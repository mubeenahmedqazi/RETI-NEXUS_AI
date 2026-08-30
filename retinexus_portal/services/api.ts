import axios, { AxiosError } from 'axios';
import { ReportData, LongitudinalAnalysis, LongitudinalVisit, DetailedTestAnalysis } from '@/types/report';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// ✅ Analyze image
export const analyzeImage = async (file: File): Promise<ReportData> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          console.log(`Upload: ${percentCompleted}%`);
        }
      },
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new Error(axiosError.message);
  }
};

// ✅ Check backend health
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
    });
    console.log('🏥 Backend health:', response.data);
    return response.status === 200 && response.data?.status === 'healthy';
  } catch (error) {
    console.error('❌ Backend health check failed');
    return false;
  }
};

// ✅ Save report - doctorId is automatically added by the API
export const saveReport = async (reportData: {
  patientId: string;
  patientName: string;
  drGrade: string;
  confidence: number;
  description: string;
  imageUrl: string;
  processedAt: string;
  reportData: any;
  clinicalReport?: string;
}) => {
  try {
    console.log('📤 Saving report:', reportData);
    
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
      credentials: 'include',
    });

    // Try to parse the response
    let data;
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('❌ Failed to parse response:', text);
      throw new Error('Invalid server response');
    }

    if (!response.ok) {
      console.error('❌ Server response:', text);
      throw new Error(data.error || `Server error: ${response.status}`);
    }

    console.log('✅ Report saved:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Save report error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to save report');
  }
};

// ✅ Get all reports for the authenticated doctor
export const getReports = async () => {
  try {
    const response = await fetch('/api/reports', {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }
    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch reports');
  }
};

// ✅ Get every saved Detailed Analysis for the authenticated doctor (across all patients) —
// the sidebar's separate "Detailed Analysis" list, distinct from screening Reports above.
export const getAllDetailedAnalyses = async () => {
  try {
    const response = await fetch('/api/detailed-analyses', {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch detailed analyses');
    }
    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch detailed analyses');
  }
};

// ✅ Get all patients for the authenticated doctor. Pass `phone` to also search
// beyond this doctor's own patients — for finding a patient by phone number
// who was self-registered or registered by a different doctor.
export const getPatients = async (phone?: string) => {
  try {
    const url = phone ? `/api/patients?phone=${encodeURIComponent(phone)}` : '/api/patients';
    const response = await fetch(url, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch patients');
    }
    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch patients');
  }
};

/** Compact prior Detailed Analysis summary sent alongside screening visits to the longitudinal endpoint. */
export interface LongitudinalDetailedAnalysis {
  date: string;
  testName: string;
  urgency: string;
  clinicalSummary: string;
}

// ✅ Ask the LLM to compare a patient's DR grade/risk trend across their visit history,
// synthesized together with their prior Detailed Analyses (if any).
// `visits` must be chronological, oldest-first, and include the current scan as the last entry.
export const generateLongitudinalAnalysis = async (
  visits: LongitudinalVisit[],
  detailedAnalyses: LongitudinalDetailedAnalysis[] = []
): Promise<LongitudinalAnalysis> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/longitudinal-analysis`,
      { visits, detailed_analyses: detailedAnalyses },
      { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || axiosError.message);
  }
};

// ✅ Patient Longitudinal History (CrewAI pipeline, retinexus_backend/patient_longitudinal_history)
// Step 1: resolve a phone number to the patient account(s) it matches.
export interface MatchedPatient {
  id: string;
  name: string;
  phone: string;
  age: number | null;
  gender: string | null;
}

export const findPatientsByPhone = async (phoneNumber: string): Promise<MatchedPatient[]> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/longitudinal-history/patients`,
      { phone_number: phoneNumber },
      { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
    );
    return response.data.patients;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || axiosError.message);
  }
};

// Step 2: runs the CrewAI multi-agent pipeline against the selected patient's last (up
// to) 3 reports — three sequential LLM calls, plus automatic retry-with-backoff if
// Groq's per-minute rate limit is hit, so this can take a few minutes in the worst case.
export interface LongitudinalInsights {
  patient_phone: string;
  report_count: number;
  summary: string;
  trajectory_insights: string[];
  progression_risks: string[];
  biomarker_changes: string[];
  disclaimer: string;
}

export const runLongitudinalHistoryAnalysis = async (
  phoneNumber: string,
  patientId?: string
): Promise<LongitudinalInsights> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/longitudinal-history/analyze`,
      { phone_number: phoneNumber, patient_id: patientId },
      { headers: { 'Content-Type': 'application/json' }, timeout: 290000 }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || axiosError.message);
  }
};

// ✅ Detailed Analysis: upload a follow-up test report (PDF/JPG/JPEG), OCR it on the backend
// (which also verifies the patient's name appears in the extracted text before analyzing),
// and correlate it against the patient's current screening findings + recent visit history.
// `currentVisit`/`previousVisits` must be compact visit summaries (see toVisitSummary in
// lib/reportVisitSummary.ts) — never the full ReportData object, whose embedded raw_report
// (classifier internals, image paths, the whole markdown report text) bloats the prompt
// enough to degrade or silently fail the LLM call.
export const submitDetailedTestAnalysis = async (
  file: File,
  testName: string,
  patientName: string,
  currentVisit: LongitudinalVisit,
  previousVisits: LongitudinalVisit[]
): Promise<DetailedTestAnalysis> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('test_name', testName);
    formData.append('patient_name', patientName);
    formData.append('current_report', JSON.stringify(currentVisit));
    formData.append('previous_reports', JSON.stringify(previousVisits));

    const response = await axios.post(`${API_BASE_URL}/detailed-test-analysis`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 90000,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || axiosError.message);
  }
};

// ✅ Get patient reports (for patient dashboard)
export const getPatientReports = async () => {
  try {
    const response = await fetch('/api/patient/reports', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      // Try to get error message
      let errorMessage = 'Failed to fetch reports';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching patient reports:', error);
    throw error;
  }
};

export default api;