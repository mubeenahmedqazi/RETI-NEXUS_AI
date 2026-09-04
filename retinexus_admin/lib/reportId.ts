/** The stored report code (e.g. "SR26090401" / "DA26090401") — assigned once when a
 * report/analysis is saved and identical everywhere it's shown (doctor portal, patient
 * portal, PDFs, and here). Rows saved before this field existed have `reportCode: null`,
 * so those fall back to their old per-app-derived label rather than showing nothing. */
export function formatReportId(report: { reportCode?: string | null; reportNumber: number }): string {
  return report.reportCode || `RN-${String(report.reportNumber).padStart(6, '0')}`;
}

export function formatAnalysisId(analysis: { reportCode?: string | null; id: string }): string {
  return analysis.reportCode || `DA-${analysis.id.slice(-8).toUpperCase()}`;
}
