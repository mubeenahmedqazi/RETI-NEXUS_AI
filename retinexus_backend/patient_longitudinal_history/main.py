"""
Master execution entry point for the Patient Longitudinal History pipeline.

    run_longitudinal_analysis(phone_number) -> LongitudinalInsights

Flow: resolve phone number -> patient account -> fetch last (up to) 3 Screening/Detailed
Analysis reports -> deterministically structure + compute trends -> LangGraph sequential
graph (Extraction -> Clinical Reasoning -> Validation, see graph.py) -> validated
LongitudinalInsights.

Runs standalone for local testing:
    python -m patient_longitudinal_history.main "+1234567890"
"""
from __future__ import annotations

import json
import sys
from typing import Optional

from .models import LongitudinalInsights
from .preprocessing import (
    NoReportsFoundError,
    compute_chronological_trends,
    find_patients_by_phone,
    get_patient_last_3_reports,
    raw_row_to_structured_report,
)

# langgraph/langchain-groq import cost is far lower than crewai's was (no eager
# multi-provider registry init) but `list_matching_patients` below never needs the graph
# at all, so it's still imported lazily inside run_longitudinal_analysis rather than at
# module load, keeping the "search phone number" step fast regardless.


class PatientNotFoundError(Exception):
    """No patient account matches the given phone number at all."""


def list_matching_patients(phone_number: str):
    """Used by the frontend's "select account" step when a phone number matches more
    than one patient (see app_backend.py's /longitudinal-history/patients endpoint)."""
    patients = find_patients_by_phone(phone_number)
    if not patients:
        raise PatientNotFoundError(f"No patient account found for phone number {phone_number!r}.")
    return patients


def run_longitudinal_analysis(phone_number: str, patient_id: Optional[str] = None) -> LongitudinalInsights:
    """`patient_id` disambiguates which account to run against when the phone number
    matches more than one patient — the frontend collects this via its account-picker
    before calling this pipeline (see the API endpoint in app_backend.py)."""
    from .graph import build_graph, extract_json

    try:
        patient, raw_reports = get_patient_last_3_reports(phone_number, patient_id=patient_id)
    except NoReportsFoundError:
        # Re-raised as-is — the API layer turns this into a clean 404, not a 500. This is
        # the "fewer than 3 reports" graceful path taken to its extreme (zero reports);
        # 1 or 2 reports fall through and run normally below, just with a shorter timeline.
        raise

    structured_reports = [raw_row_to_structured_report(row) for row in raw_reports]
    trends = compute_chronological_trends(structured_reports)

    raw_reports_json = json.dumps([r.model_dump() for r in structured_reports], indent=2, default=str)
    trends_json = json.dumps({name: trend.model_dump() for name, trend in trends.items()}, indent=2, default=str)

    graph = build_graph()
    state = graph.invoke(
        {
            "patient_phone": patient["phone"],
            "patient_name": patient["name"],
            "report_count": len(structured_reports),
            "raw_reports_json": raw_reports_json,
            "trends_json": trends_json,
        }
    )

    # Parsed from the raw response text rather than a structured-output/tool-calling API
    # — see tasks_prompts.py's module docstring for why (openai/gpt-oss-20b's
    # reasoning-model output doesn't survive Groq's forced tool-calling).
    try:
        validation_json = extract_json(state["validation_output"])
        insights = LongitudinalInsights.model_validate_json(validation_json)
    except Exception as e:
        # The validator step didn't return schema-valid JSON (e.g. an LLM hiccup) —
        # fail loudly rather than silently handing back an unvalidated/partial result.
        raise RuntimeError(f"Validation & Safety Auditor did not return valid JSON: {e}") from e

    # Belt-and-suspenders: these two fields are deterministic, not something the LLM
    # should be trusted to copy correctly — set them from ground truth regardless of
    # what the agent returned.
    insights.patient_phone = patient["phone"]
    insights.report_count = len(structured_reports)
    if not insights.disclaimer:
        insights.disclaimer = (
            "This is an AI-generated summary of trends across this patient's recent reports, "
            "not a diagnosis. All findings must be reviewed and confirmed by a qualified physician."
        )
    return insights


# An exact-match prefix so app_backend.py's subprocess parser can pick this line out of
# stdout regardless of whatever else libraries print during a run.
RESULT_MARKER = "###LONGITUDINAL_HISTORY_RESULT###"


def _emit(payload: dict) -> None:
    print(f"{RESULT_MARKER}{json.dumps(payload, default=str)}")


def _cli_list_patients(phone: str) -> None:
    """Invoked as `python -m patient_longitudinal_history.main list-patients <phone>` —
    the FastAPI layer (a different Python version, see app_backend.py) shells out to
    this venv's interpreter since psycopg2/crewai only live here."""
    try:
        patients = list_matching_patients(phone)
        _emit({"patients": patients})
    except PatientNotFoundError as e:
        _emit({"error": str(e)})
        sys.exit(1)


def _cli_analyze(phone: str, patient_id: Optional[str]) -> None:
    try:
        output = run_longitudinal_analysis(phone, patient_id=patient_id)
        _emit(output.model_dump())
    except NoReportsFoundError as e:
        _emit({"error": str(e)})
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "list-patients":
        _cli_list_patients(sys.argv[2])
    elif len(sys.argv) >= 2:
        _cli_analyze(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
    else:
        print(
            "Usage:\n"
            "  python -m patient_longitudinal_history.main <phone_number> [patient_id]\n"
            "  python -m patient_longitudinal_history.main list-patients <phone_number>"
        )
        sys.exit(1)
