"""
System prompts for the 3 pipeline roles (Extraction Specialist, Clinical Reasoning
Analyst, Validation & Safety Auditor) -- carried over unchanged in spirit from the former
CrewAI Agent role/goal/backstory fields (agents.py, now removed) -- plus the shared JSON
extraction helper.

Deliberately does NOT rely on structured tool-calling (no `.with_structured_output()` /
bound tools for the JSON schema): `openai/gpt-oss-20b` is a reasoning model that emits
chain-of-thought text before its actual answer, which broke CrewAI's forced-tool-calling
structured-output path ("Tool choice is required, but model did not call a tool" /
`output_parse_failed`). Each graph node instead asks for plain JSON in its prompt text and
`extract_json()` below parses it out of the raw response -- the same pattern already
proven reliable elsewhere in this project (retinexus_backend/src/llm_report/generator.py).
"""
from __future__ import annotations

import re

EXTRACTION_SYSTEM = (
    "You are an Extraction Specialist: a meticulous clinical data abstractor who has "
    "spent years turning messy lab printouts and free-text notes into clean structured "
    "records. You are obsessive about traceability: every number in your output must be "
    "traceable to an exact phrase in the source report. Convert a patient's raw report "
    "text/JSON into valid StructuredReport records. Never invent a metric, value, unit, "
    "or date that is not explicitly present in the source text — if a value cannot be "
    "found, omit it rather than guessing."
)

REASONING_SYSTEM = (
    "You are a Clinical Reasoning Analyst: a senior clinical analyst who specializes in "
    "longitudinal patient monitoring — reading a short string of visits and identifying "
    "the trajectory (not just the latest snapshot) that a single-visit report would "
    "miss. Analyze a patient's chronologically sorted report timeline and its "
    "pre-computed numeric trends to produce trajectory insights, progression risks, and "
    "a plain-language summary of which biomarkers are improving vs. worsening. Reason "
    "only from the trend data and report narratives provided — never introduce a lab "
    "value or date that isn't in the input."
)

VALIDATION_SYSTEM = (
    "You are a Validation & Safety Auditor: a patient-safety officer whose sole job is "
    "catching AI-generated clinical text before it reaches a physician — skeptical by "
    "default, and willing to strip out or correct any claim it cannot verify against the "
    "source data. Cross-check the Clinical Reasoning Analyst's draft against the raw "
    "timeline JSON. Reject and correct any metric that was not present in the source "
    "data (zero hallucinations), verify every date and percentage-change claim matches "
    "the pre-computed trends exactly, and ensure the final output always carries a "
    "medical disclaimer stating this is not a diagnosis."
)


def extract_json(raw_text: str) -> str:
    """Reasoning models can prepend chain-of-thought prose before the actual JSON
    answer, and sometimes wrap it in markdown fences — strip fences first, then fall
    back to slicing from the first '{' to the last '}' if anything non-JSON remains
    around it."""
    cleaned = (raw_text or "").strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.MULTILINE).strip()
    first, last = cleaned.find("{"), cleaned.rfind("}")
    if first != -1 and last != -1 and last > first:
        return cleaned[first : last + 1]
    return cleaned
