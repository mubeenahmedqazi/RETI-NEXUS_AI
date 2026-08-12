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

export interface Lesion {
  id: string;
  type: 'Microaneurysm' | 'Hemorrhage' | 'Exudate' | 'Cotton Wool Spot';
  location: { x: number; y: number };
  size: number;
  severity: 'mild' | 'moderate' | 'severe';
  risk: number;
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
  lesions: Lesion[];
  riskFactors: RiskFactor[];
  overallRisk: number;
  recommendations: string[];
  processedAt: string;
  /** Ophthalmologist-style clinical interpretation paragraph (covers the eye/DR finding). */
  interpretation?: string;
  /** Short clinical notes for the systemic organs discussed in the report. */
  organInterpretation?: {
    heart?: string;
    kidney?: string;
    brain?: string;
  };
  clinicalReport?: string;
}