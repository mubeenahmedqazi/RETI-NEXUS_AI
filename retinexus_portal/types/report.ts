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
  /** 1-year / 5-year outlook, grounded in the DR-grade clinical reference scale (eye/kidney/heart). */
  predictedRisk?: {
    oneYear?: string;
    fiveYear?: string;
  };
  clinicalReport?: string;
  /** LLM-picked follow-up tests (0-2), only populated for DR grade Moderate NPDR and above. */
  suggestedTests?: string[];
}

/** LLM-generated narrative comparing a patient's DR grade and organ-risk trend across visits. */
export interface LongitudinalAnalysis {
  overallTrend: 'improving' | 'stable' | 'worsening' | 'mixed';
  summary: string;
  heartTrend: string;
  kidneyTrend: string;
  brainTrend: string;
  keyChanges: string[];
  recommendation: string;
}

/** Compact per-visit shape sent to the longitudinal-analysis endpoint (oldest visit first). */
export interface LongitudinalVisit {
  date: string;
  drGrade: string;
  riskFactors: { cardiovascular: number; kidney: number; cerebrovascular: number };
  biomarkers: { vesselTortuosity: number; vesselDensity: number; branchingPoints: number; avr: number };
  lesionCounts: { microaneurysms: number; haemorrhages: number; hardExudates: number; softExudates: number };
}

/** LLM-authored clinical report correlating an uploaded follow-up test (OCR'd) with the
 * patient's screening findings and recent visit history. */
export interface DetailedTestAnalysis {
  clinicalSummary: string;
  testFindings: string;
  organFindings: { heart: string; kidney: string; brain: string };
  redFlags: string[];
  recommendations: string[];
  urgency: 'routine' | 'priority' | 'urgent';
  extractionMethod?: 'native' | 'ocr' | 'mixed';
}

/** Context handed from ReportDisplay to the Detailed Analysis page via sessionStorage. */
export interface DetailedAnalysisContext {
  report: ReportData;
  /** The saved screening Report's database id, when known — links a saved Detailed
   * Analysis back to the specific screening report it correlates with. */
  reportId?: string;
  patientId: string;
  patientName: string;
  patientAge?: number | string;
  patientGender?: string;
  suggestedTests: string[];
}