// Ported from retinexus_portal/types/report.ts — trimmed to the fields
// AdminReportView (a read-only adaptation of the portal's ReportDisplay) actually
// renders, kept in the same shape so the two stay easy to compare/sync.

export interface QualityMetrics {
  overall: number;
  illumination: number;
  focus: number;
  fieldOfView: number;
  artifacts: number;
}

export interface DRGrade {
  grade: 'No DR' | 'Mild NPDR' | 'Moderate NPDR' | 'Severe NPDR' | 'PDR';
  confidence: number;
  description: string;
}

export interface Biomarker {
  name: string;
  value: number;
  normalRange: [number, number];
  unit: string;
  status: 'normal' | 'elevated' | 'low';
}

export interface RiskFactor {
  name: string;
  level: number;
  description: string;
}

export interface LesionCounts {
  microaneurysms: number;
  haemorrhages: number;
  hardExudates: number;
  softExudates: number;
  total: number;
}

export interface ReportImages {
  enhanced?: string;
  vessel_mask?: string;
  detected_lesions?: string;
  gradcam?: string;
  [key: string]: string | undefined;
}

export interface ReportData {
  id: string;
  patientId: string;
  timestamp: string;
  imageUrl: string;
  images?: ReportImages;
  lesionCounts?: LesionCounts;
  quality: QualityMetrics;
  drGrade: DRGrade;
  biomarkers: Biomarker[];
  riskFactors: RiskFactor[];
  overallRisk: number;
  recommendations: string[];
  processedAt: string;
  interpretation?: string;
  organInterpretation?: {
    heart?: string;
    kidney?: string;
    brain?: string;
  };
  clinicalReport?: string;
  suggestedTests?: string[];
  /** 1-year / 5-year outlook, grounded in the DR-grade clinical reference scale
   * (eye/kidney/heart) — shown in the Detailed Analysis report only. */
  predictedRisk?: {
    oneYear?: string;
    fiveYear?: string;
  };
}
