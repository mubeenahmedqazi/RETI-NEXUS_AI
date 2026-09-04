import prisma from '@/lib/db';

/** SR26090401 / DA26090401 — prefix + 2-digit year + month + day + a 2-digit daily
 * sequence shared across all doctors, assigned once at save time and never recomputed —
 * every surface (lists, detail pages, PDFs, admin) displays this exact stored value
 * instead of each deriving its own label from reportNumber/id, which is what caused a
 * report's PDF to show a different id than its list entry. */
function todayDateDigits(now: Date): string {
  const yy = String(now.getUTCFullYear() % 100).padStart(2, '0');
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

function todayRangeUTC(now: Date): { gte: Date; lte: Date } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  return {
    gte: new Date(Date.UTC(y, m, d, 0, 0, 0, 0)),
    lte: new Date(Date.UTC(y, m, d, 23, 59, 59, 999)),
  };
}

export async function generateScreeningReportCode(now: Date = new Date()): Promise<string> {
  const dateDigits = todayDateDigits(now);
  const createdAt = todayRangeUTC(now);
  for (let attempt = 0; attempt < 10; attempt++) {
    const countToday = await prisma.report.count({ where: { createdAt } });
    const seq = String(countToday + 1 + attempt).padStart(2, '0');
    const candidate = `SR${dateDigits}${seq}`;
    const exists = await prisma.report.findUnique({ where: { reportCode: candidate } });
    if (!exists) return candidate;
  }
  throw new Error('Could not generate a unique screening report code after several attempts');
}

export async function generateDetailedAnalysisReportCode(now: Date = new Date()): Promise<string> {
  const dateDigits = todayDateDigits(now);
  const createdAt = todayRangeUTC(now);
  for (let attempt = 0; attempt < 10; attempt++) {
    const countToday = await prisma.detailedAnalysis.count({ where: { createdAt } });
    const seq = String(countToday + 1 + attempt).padStart(2, '0');
    const candidate = `DA${dateDigits}${seq}`;
    const exists = await prisma.detailedAnalysis.findUnique({ where: { reportCode: candidate } });
    if (!exists) return candidate;
  }
  throw new Error('Could not generate a unique detailed analysis report code after several attempts');
}
