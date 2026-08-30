"""
LangGraph orchestration for the Patient Longitudinal History pipeline -- replaces the
former CrewAI Crew/Agent/Task setup (agents.py/tasks.py, now removed) while preserving
the exact same 3 conceptual roles and the hard-won Groq rate-limit handling from this
project's own debugging history:

  Extraction Specialist -> Clinical Reasoning Analyst -> Validation & Safety Auditor

Why LangGraph over CrewAI: CrewAI's import alone cost ~20-30s here (eager litellm
provider-registry init) before a single LLM call was even made, and this project hit a
real CrewAI 1.15.18 bug (`mark_cache_breakpoint` leaking a `cache_breakpoint` key into
every Groq request, requiring a runtime monkey-patch) plus a rich-console stdout-capture
issue. LangGraph's `StateGraph` has none of that -- it's a plain dependency graph over
plain Python functions, with no eager multi-provider init and no cache/console coupling.

On "parallel agents": these 3 steps are genuinely sequential -- each one's prompt depends
on the previous step's output (Reasoning needs the Extraction result; Validation needs
both) -- so running them concurrently isn't a matter of switching a flag, it would change
what each step sees. It also wouldn't help on this Groq account specifically: the account
is on an 8000 TPM (tokens-per-minute) tier, a hard aggregate cap shared across every
concurrent connection, not a per-connection limit -- firing the 3 calls at once would
compete for the same shrinking budget instead of spreading it out, making rate-limit
failures *more* likely, not less. The speed win here comes from removing CrewAI's own
overhead and bugs above, plus this module's per-node (not per-crew) retry-with-backoff
below, which stops a transient rate-limit failure from re-paying for already-succeeded
steps.
"""
from __future__ import annotations

import os
import re
import time
from typing import TypedDict

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph

from .tasks_prompts import EXTRACTION_SYSTEM, REASONING_SYSTEM, VALIDATION_SYSTEM, extract_json

load_dotenv()

_GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b").strip()


def _get_llm(temperature: float) -> ChatGroq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set in retinexus_backend/.env")
    # max_tokens: without an explicit cap the Validation step's JSON response was
    # observed being cut off mid-string on this model/provider combination.
    return ChatGroq(model=_GROQ_MODEL, api_key=api_key, temperature=temperature, max_tokens=4096)


def _invoke_with_rate_limit_retry(llm: ChatGroq, messages: list, node_label: str, max_attempts: int = 4) -> str:
    """Per-node retry-with-backoff on a Groq rate-limit error -- ported from this
    project's main.py (`_run_task_with_rate_limit_retry`). Retrying only the failed node
    (not the whole graph) matters on this account's tight 8000 TPM tier: retrying
    everything re-spends tokens on steps that already succeeded, which was observed to
    make the account's rolling-window usage climb across attempts instead of draining."""
    last_error: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            response = llm.invoke(messages)
            return response.content if isinstance(response.content, str) else str(response.content)
        except Exception as e:  # noqa: BLE001 - the Groq client's exception class isn't
            # guaranteed stable across versions; the error payload text is the reliable signal.
            message = str(e)
            if "rate_limit_exceeded" not in message and "RateLimitError" not in message:
                raise
            last_error = e
            if attempt == max_attempts:
                break
            match = re.search(r"try again in ([\d.]+)s", message)
            wait_seconds = float(match.group(1)) + 5 if match else 20.0
            print(f"[!] Groq rate limit hit on '{node_label}' (attempt {attempt}/{max_attempts}) — waiting {wait_seconds:.1f}s and retrying just this step.")
            time.sleep(wait_seconds)

    raise RuntimeError(
        f"Longitudinal analysis failed at the '{node_label}' step after {max_attempts} attempts "
        "due to Groq's rate limit. Try again shortly, or upgrade the Groq account tier for "
        "higher throughput."
    ) from last_error


class PipelineState(TypedDict):
    patient_phone: str
    patient_name: str
    report_count: int
    raw_reports_json: str
    trends_json: str
    extraction_output: str
    reasoning_output: str
    validation_output: str


def extract_node(state: PipelineState) -> dict:
    llm = _get_llm(temperature=0.0)
    prompt = (
        "Below is the raw JSON for this patient's last (up to) 3 medical reports, "
        "mixing Screening scans and Detailed Analysis follow-up tests:\n\n"
        f"{state['raw_reports_json']}\n\n"
        "For every report, produce a StructuredReport: report_date (YYYY-MM-DD), "
        "report_type ('Screening' or 'Detailed Analysis'), and metrics — every "
        "numeric test/biomarker value you can find, with its unit and reference "
        "range if stated. The `narrative` field already contains the clinical "
        "summary text; you may pull additional numeric metrics mentioned in it "
        "(e.g. \"HbA1c came back at 6.1%\") but must NOT invent a value that isn't "
        "written in the source text or JSON. If a report already lists metrics, "
        "keep them exactly as given — do not alter or drop existing values.\n\n"
        "Respond with ONLY a raw JSON object — no markdown code fences, no explanation, "
        "no reasoning text before or after it — with a single `reports` array of "
        "StructuredReport records: "
        '{"reports": [{"report_date": "...", "report_type": "...", "metrics": '
        '[{"test_name": "...", "value": 0.0, "unit": "...", "reference_range": "..."}], '
        '"narrative": "..."}]}'
    )
    messages = [SystemMessage(content=EXTRACTION_SYSTEM), HumanMessage(content=prompt)]
    output = _invoke_with_rate_limit_retry(llm, messages, "Extraction")
    return {"extraction_output": output}


def reason_node(state: PipelineState) -> dict:
    # A short pacing pause before each non-first node — spreads the 3 calls' token usage
    # across Groq's rolling 60s window instead of clustering them back-to-back; each
    # node's own retry-with-backoff above still handles a rate-limit hit if pacing alone
    # isn't enough.
    time.sleep(3)
    llm = _get_llm(temperature=0.3)
    prompt = (
        "Here is the extracted, chronologically-orderable report timeline from the "
        "previous step:\n\n"
        f"{state['extraction_output']}\n\n"
        "Plus these deterministically pre-computed numeric trends (already-verified "
        "deltas — treat these numbers as ground truth, do not recompute or contradict "
        f"them):\n\n{state['trends_json']}\n\n"
        "Write: (1) a short overall `summary` of this patient's trajectory across "
        "these visits, (2) `trajectory_insights` — bullet observations about the "
        "direction of change over time, (3) `progression_risks` — anything in the "
        "trend that suggests worsening risk if it continues, (4) `biomarker_changes` "
        "— a plain-language line per metric that changed, referencing the exact "
        "before/after values and % change given above. Ground every claim in the "
        "trend data and report narratives provided — never state a number that "
        "isn't in the input.\n\n"
        "Respond with ONLY a raw JSON object — no markdown code fences, no explanation, "
        "no reasoning text before or after it — matching: "
        '{"summary": "...", "trajectory_insights": ["..."], "progression_risks": '
        '["..."], "biomarker_changes": ["..."]}'
    )
    messages = [SystemMessage(content=REASONING_SYSTEM), HumanMessage(content=prompt)]
    output = _invoke_with_rate_limit_retry(llm, messages, "Clinical Reasoning")
    return {"reasoning_output": output}


def validate_node(state: PipelineState) -> dict:
    time.sleep(3)
    llm = _get_llm(temperature=0.0)
    prompt = (
        "Audit this draft analysis:\n\n"
        f"{state['reasoning_output']}\n\n"
        "Against the extracted report data from the first step:\n\n"
        f"{state['extraction_output']}\n\n"
        f"And these pre-computed trends:\n\n{state['trends_json']}\n\n"
        "Checklist — every one of these must hold before you approve the output:\n"
        "1. Zero metric hallucinations: every value/date mentioned in the draft must "
        "appear in the raw reports or computed trends above.\n"
        "2. Dates are mapped correctly to the report they came from.\n"
        "3. Every percentage/delta claim matches the pre-computed trends exactly — "
        "if the draft states a different number, correct it to match the trends.\n"
        "4. The final output MUST include a `disclaimer` field stating this is an "
        "AI-generated summary, not a diagnosis, and must be reviewed by a physician.\n\n"
        f"Produce the final result, with patient_phone={state['patient_phone']!r} and "
        f"report_count={state['report_count']}, carrying over the corrected summary/"
        "trajectory_insights/progression_risks/biomarker_changes plus the disclaimer.\n\n"
        "Respond with ONLY a raw JSON object — no markdown code fences, no explanation, "
        "no reasoning text before or after it — matching: "
        f'{{"patient_phone": "{state["patient_phone"]}", "report_count": {state["report_count"]}, '
        '"summary": "...", "trajectory_insights": ["..."], "progression_risks": '
        '["..."], "biomarker_changes": ["..."], "disclaimer": "..."}'
    )
    messages = [SystemMessage(content=VALIDATION_SYSTEM), HumanMessage(content=prompt)]
    output = _invoke_with_rate_limit_retry(llm, messages, "Validation & Safety Audit")
    return {"validation_output": output}


def build_graph():
    graph = StateGraph(PipelineState)
    graph.add_node("extract", extract_node)
    graph.add_node("reason", reason_node)
    graph.add_node("validate", validate_node)
    graph.set_entry_point("extract")
    graph.add_edge("extract", "reason")
    graph.add_edge("reason", "validate")
    graph.add_edge("validate", END)
    return graph.compile()


__all__ = ["PipelineState", "build_graph", "extract_json"]
