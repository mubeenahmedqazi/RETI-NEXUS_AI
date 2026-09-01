/** Same "RN-000027" format used everywhere a report's ID is shown in the doctor and
 * patient portals (report lists, the printed clinical report header) — kept identical
 * here so a report reads as the same ID no matter which app it's viewed from. */
export function formatReportId(reportNumber: number): string {
  return `RN-${String(reportNumber).padStart(6, '0')}`;
}

/** Same "DA-A1B2C3D4" format the portal uses for a Detailed Analysis (it has no
 * reportNumber-style sequence of its own, unlike Report — the portal derives one from
 * the last 8 characters of the record's own id). Kept identical here for the same
 * cross-app consistency reason as formatReportId. */
export function formatAnalysisId(id: string): string {
  return `DA-${id.slice(-8).toUpperCase()}`;
}
