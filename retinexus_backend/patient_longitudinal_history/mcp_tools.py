"""
FastMCP tool definitions for the Patient Longitudinal History pipeline.

Wraps the pipeline's data-access/pre-processing capabilities (DB fetch, trend
computation) as MCP tools, exposing them the same way this project's website chatbot
already exposes its own tools via MCP (see retinexus_website/lib/mcp/server.ts +
client.ts, which run their MCP server/client in-process with an InMemoryTransport rather
than a spawned subprocess). The `graph.py` LangGraph nodes below call these functions
directly -- a full stdio MCP handshake per pipeline run would add real latency for what
is otherwise an instant local function call, which fights the "make it fast" goal these
tools exist to serve. Registering them on a FastMCP server still gives external
interoperability (e.g. `fastmcp dev mcp_tools.py`) without paying that cost in the
pipeline's own hot path.
"""
from __future__ import annotations

from typing import Optional

from fastmcp import FastMCP

from .preprocessing import compute_chronological_trends, get_patient_last_3_reports, raw_row_to_structured_report

mcp = FastMCP("patient-longitudinal-history")


@mcp.tool()
def get_patient_last_3_reports_tool(phone_number: str, patient_id: Optional[str] = None) -> dict:
    """Fetch a patient's last (up to) 3 Screening/Detailed Analysis reports, structured."""
    patient, raw_reports = get_patient_last_3_reports(phone_number, patient_id=patient_id)
    structured = [raw_row_to_structured_report(row).model_dump() for row in raw_reports]
    return {"patient": patient, "reports": structured}


@mcp.tool()
def compute_trends_tool(structured_reports_json: list[dict]) -> dict:
    """Compute chronological numeric trends/deltas across a list of StructuredReport dicts."""
    from .models import StructuredReport

    reports = [StructuredReport.model_validate(r) for r in structured_reports_json]
    trends = compute_chronological_trends(reports)
    return {name: trend.model_dump() for name, trend in trends.items()}


if __name__ == "__main__":
    mcp.run()
