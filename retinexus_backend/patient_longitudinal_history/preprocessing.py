"""
Database access and deterministic (non-LLM) pre-processing for the Patient
Longitudinal History pipeline.

Talks to the same Neon Postgres database the Node portal uses (`patients`, `reports`,
`detailed_analyses` tables — see retinexus_portal/prisma/schema.prisma for the source of
truth on column names). Read-only: this module never writes to the database.
"""
from __future__ import annotations

import json
import os
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

from .models import MedicalMetric, MetricTrend, StructuredReport

load_dotenv()

# Biomarkers with normal-range status already baked in server-side elsewhere (Node) —
# here we just need name/value/unit/range as they were stored in reportData.biomarkers.
_RISK_METRIC_LABELS = {
    "cardiovascular_risk_index": "Cardiovascular Risk",
    "chronic_kidney_disease_risk_index": "Kidney Risk",
    "cerebrovascular_risk_index": "Cerebrovascular Risk",
}


class NoReportsFoundError(Exception):
    """Raised when a phone number matches no patient, or a matched patient has zero
    Screening/Detailed Analysis reports on file."""


def _get_connection():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL is not set in retinexus_backend/.env — the longitudinal "
            "history pipeline needs read access to the same Postgres database the "
            "portal uses."
        )
    return psycopg2.connect(database_url, cursor_factory=psycopg2.extras.RealDictCursor)


def find_patients_by_phone(phone_number: str) -> List[Dict[str, Any]]:
    """Every patient account matching this phone number (digits-only comparison, so
    formatting like spaces/dashes doesn't matter) — a phone can be shared across more
    than one patient record, which is why the frontend has the user pick an account
    before this pipeline runs on it."""
    with _get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, name, phone, age, gender, "doctorId"
            FROM patients
            WHERE regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace(%s, '[^0-9]', '', 'g')
            ORDER BY "createdAt" DESC
            """,
            (phone_number,),
        )
        return list(cur.fetchall())


def _fetch_screening_reports(cur, patient_id: str) -> List[Dict[str, Any]]:
    cur.execute(
        """
        SELECT id, "reportNumber", "drGrade", confidence, "reportData",
               COALESCE("processedAt", "createdAt"::text) AS report_date, "createdAt"
        FROM reports
        WHERE "patientId" = %s
        ORDER BY "createdAt" DESC
        """,
        (patient_id,),
    )
    rows = cur.fetchall()
    for r in rows:
        r["_kind"] = "screening"
    return rows


def _fetch_detailed_analyses(cur, patient_id: str) -> List[Dict[str, Any]]:
    cur.execute(
        """
        SELECT id, "testName", "clinicalSummary", "testFindings", "organFindings",
               urgency, "createdAt"
        FROM detailed_analyses
        WHERE "patientId" = %s
        ORDER BY "createdAt" DESC
        """,
        (patient_id,),
    )
    rows = cur.fetchall()
    for r in rows:
        r["_kind"] = "detailed"
    return rows


def get_patient_last_3_reports(phone_number: str, patient_id: Optional[str] = None) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Resolves the phone number to a patient account (disambiguated by `patient_id`
    when the frontend already had the user pick one — see main.py), then returns that
    patient plus their last 3 reports, newest first, mixed across Screening and
    Detailed Analysis (matching the same "last 3 mixed" convention the portal's own
    Longitudinal Tracking History feature already uses).

    Raises NoReportsFoundError if the phone matches no patient, or the matched patient
    has no reports at all.
    """
    candidates = find_patients_by_phone(phone_number)
    if not candidates:
        raise NoReportsFoundError(f"No patient account found for phone number {phone_number!r}.")

    if patient_id:
        patient = next((p for p in candidates if p["id"] == patient_id), None)
        if patient is None:
            raise NoReportsFoundError(f"Patient {patient_id!r} does not match phone number {phone_number!r}.")
    else:
        patient = candidates[0]

    with _get_connection() as conn, conn.cursor() as cur:
        screening = _fetch_screening_reports(cur, patient["id"])
        detailed = _fetch_detailed_analyses(cur, patient["id"])

    combined = screening + detailed
    if not combined:
        raise NoReportsFoundError(f"{patient['name']} has no Screening or Detailed Analysis reports on file yet.")

    combined.sort(key=lambda r: r["createdAt"], reverse=True)
    last_3 = combined[:3]
    return patient, last_3


def _parse_json_field(value: Any) -> Any:
    """reportData/organFindings come back as dicts already when the driver recognizes
    the column as JSON/JSONB, but as a raw string in some psycopg2/column configs —
    handle both rather than assuming."""
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return {}
    return {}


def _to_iso_date(value: Any) -> str:
    if isinstance(value, (datetime, date)):
        return value.date().isoformat() if isinstance(value, datetime) else value.isoformat()
    text = str(value)
    # processedAt is sometimes a full ISO timestamp string, sometimes already a date.
    return text[:10] if len(text) >= 10 else text


def raw_row_to_structured_report(row: Dict[str, Any]) -> StructuredReport:
    """Deterministic (no LLM) conversion — screening reports already carry clean
    structured biomarker/risk data, so there is nothing for an LLM to "extract" there;
    it's a straight field mapping. Detailed Analysis rows are narrative by nature, so
    they get an empty metrics list here — the Extraction Specialist agent (agents.py)
    is what pulls any numeric mentions out of their free text."""
    if row["_kind"] == "screening":
        report_data = _parse_json_field(row["reportData"])
        metrics: List[MedicalMetric] = []

        for b in report_data.get("biomarkers", []) or []:
            try:
                normal_range = b.get("normalRange")
                reference_range = f"{normal_range[0]}-{normal_range[1]}" if normal_range else None
                metrics.append(
                    MedicalMetric(
                        test_name=b["name"],
                        value=float(b["value"]),
                        unit=b.get("unit", ""),
                        reference_range=reference_range,
                    )
                )
            except (KeyError, TypeError, ValueError):
                continue

        risk_factors = report_data.get("riskFactors") or {}
        for key, label in _RISK_METRIC_LABELS.items():
            if key in risk_factors:
                try:
                    metrics.append(MedicalMetric(test_name=label, value=float(risk_factors[key]), unit="%"))
                except (TypeError, ValueError):
                    continue

        narrative = str(report_data.get("interpretation") or "").strip()
        return StructuredReport(
            report_date=_to_iso_date(row["report_date"]),
            report_type="Screening",
            metrics=metrics,
            narrative=f"DR Grade: {row.get('drGrade', 'N/A')} (confidence {row.get('confidence', 0):.0%}). {narrative}".strip(),
        )

    # Detailed Analysis
    return StructuredReport(
        report_date=_to_iso_date(row["createdAt"]),
        report_type="Detailed Analysis",
        metrics=[],
        narrative=f"{row.get('testName', 'Follow-up test')}: {row.get('clinicalSummary', '')} {row.get('testFindings', '')}".strip(),
    )


def compute_chronological_trends(reports: List[StructuredReport]) -> Dict[str, MetricTrend]:
    """Sorts the given reports chronologically (oldest first), groups matching metrics
    by test_name across dates, and computes percentage change + absolute delta between
    each consecutive appearance. Pure Python — no LLM involved, so trend numbers can
    never be hallucinated."""
    ordered = sorted(reports, key=lambda r: r.report_date)

    by_test: Dict[str, MetricTrend] = {}
    for report in ordered:
        for metric in report.metrics:
            trend = by_test.get(metric.test_name)
            if trend is None:
                trend = MetricTrend(test_name=metric.test_name, unit=metric.unit, dates=[], values=[])
                by_test[metric.test_name] = trend
            trend.dates.append(report.report_date)
            trend.values.append(metric.value)

    for trend in by_test.values():
        for i in range(1, len(trend.values)):
            prev, curr = trend.values[i - 1], trend.values[i]
            delta = curr - prev
            pct = (delta / prev * 100) if prev != 0 else float("inf") if delta != 0 else 0.0
            sign = "+" if delta >= 0 else ""
            pct_str = f"{sign}{pct:.1f}%" if pct != float("inf") else "new"
            trend.changes.append(f"{prev:g} -> {curr:g} ({pct_str})")

    return by_test
