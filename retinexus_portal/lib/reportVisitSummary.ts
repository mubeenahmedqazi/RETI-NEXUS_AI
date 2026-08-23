import { LongitudinalVisit } from '@/types/report';

/** Reads a named risk-factor level (0-1) out of a transformed report's riskFactors array. */
export function riskLevel(reportData: any, name: string): number {
  const factors = reportData?.riskFactors || [];
  return factors.find((f: any) => f.name === name)?.level ?? 0;
}

/** Reads a named biomarker's raw value out of a transformed report's biomarkers array. */
export function biomarkerValue(reportData: any, name: string): number {
  const biomarkers = reportData?.biomarkers || [];
  return biomarkers.find((b: any) => b.name === name)?.value ?? 0;
}

/**
 * Builds a compact, LLM-friendly visit summary from a full ReportData object.
 *
 * A full ReportData carries `raw_report` — the entire pipeline payload, including
 * per-classifier internals, image file paths, and the whole clinicalReport markdown
 * text embedded again — which is far more than any prompt needs and can bloat a
 * request enough to silently degrade or fail the LLM call. Every backend prompt that
 * takes report context (longitudinal trend, detailed analysis) should be fed this
 * summary instead of the raw object.
 */
export function toVisitSummary(reportData: any, date: string): LongitudinalVisit {
  const lesions = reportData?.lesionCounts || {};
  return {
    date,
    drGrade: reportData?.drGrade?.grade || 'Unknown',
    riskFactors: {
      cardiovascular: riskLevel(reportData, 'Cardiovascular Risk'),
      kidney: riskLevel(reportData, 'Kidney Disease Risk'),
      cerebrovascular: riskLevel(reportData, 'Cerebrovascular Risk'),
    },
    biomarkers: {
      vesselTortuosity: biomarkerValue(reportData, 'Vessel Tortuosity'),
      vesselDensity: biomarkerValue(reportData, 'Vessel Density'),
      branchingPoints: biomarkerValue(reportData, 'Branching Points'),
      avr: biomarkerValue(reportData, 'Arteriolar to Venular Ratio'),
    },
    lesionCounts: {
      microaneurysms: lesions.microaneurysms ?? 0,
      haemorrhages: lesions.haemorrhages ?? 0,
      hardExudates: lesions.hardExudates ?? 0,
      softExudates: lesions.softExudates ?? 0,
    },
  };
}
