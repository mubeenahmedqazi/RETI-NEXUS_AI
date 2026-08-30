"""
Pydantic data models for the Patient Longitudinal History pipeline.

These are the schemas every stage of the pipeline is validated against:
DB rows -> StructuredReport (deterministic + extraction-agent output) ->
PatientTimeline (+ calculated_trends) -> LongitudinalInsights (final, audited output).
"""
from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class MedicalMetric(BaseModel):
    """A single numeric measurement pulled from a report (a biomarker, a lab value, etc.)."""

    test_name: str
    value: float
    unit: str
    reference_range: Optional[str] = None


class StructuredReport(BaseModel):
    """One patient visit, normalized to a fixed shape regardless of whether it came from
    a Screening report or a Detailed Analysis follow-up test."""

    report_date: str = Field(..., description="YYYY-MM-DD")
    report_type: str = Field(..., description='"Screening" or "Detailed Analysis"')
    metrics: List[MedicalMetric] = Field(default_factory=list)
    # Free-text context the LLM stages reason over (clinical summary / findings) — kept
    # separate from `metrics` so MedicalMetric stays strictly numeric, per spec.
    narrative: str = ""


class MetricTrend(BaseModel):
    """One metric's value across every report it appeared in, oldest first."""

    test_name: str
    unit: str
    dates: List[str]
    values: List[float]
    # Human-readable deltas between consecutive appearances, e.g. "5.6 -> 6.1 (+8.9%)".
    changes: List[str] = Field(default_factory=list)


class PatientTimeline(BaseModel):
    """The full input handed to the crew: the patient's last (up to) 3 reports,
    chronologically sorted, plus the deterministically pre-computed trends."""

    patient_phone: str
    reports: List[StructuredReport]
    calculated_trends: Dict[str, MetricTrend] = Field(default_factory=dict)


class LongitudinalInsights(BaseModel):
    """Final, validator-audited output of the crew — what the frontend actually renders."""

    patient_phone: str
    report_count: int
    summary: str
    trajectory_insights: List[str] = Field(default_factory=list)
    progression_risks: List[str] = Field(default_factory=list)
    biomarker_changes: List[str] = Field(default_factory=list)
    disclaimer: str
