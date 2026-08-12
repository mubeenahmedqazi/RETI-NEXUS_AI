import axios, { AxiosError } from 'axios';
import { ReportData } from '@/types/report';

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

// ✅ Get all patients for the authenticated doctor
export const getPatients = async () => {
  try {
    const response = await fetch('/api/patients', {
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