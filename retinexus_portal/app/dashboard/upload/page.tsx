'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import UploadArea from '@/components/Dashboard/UploadArea';
import ReportDisplay from '@/components/Dashboard/ReportDisplay';
import StatsCards from '@/components/Dashboard/StatsCards';
import AnalysisLoader from '@/components/Dashboard/AnalysisLoader';
import { ReportData } from '@/types/report';
import { analyzeImage } from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasPatientContext = Boolean(searchParams.get('patientId'));
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // This page only makes sense reached from a patient's own flow (which supplies
  // patientId/patientName), never as a direct/bookmarked URL — redirect back to the
  // patient list rather than showing an upload form with nothing to attach it to.
  useEffect(() => {
    if (!hasPatientContext) {
      toast.info('Select a patient first to start a new scan.');
      router.replace('/dashboard/patients');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPatientContext]);

  if (!hasPatientContext) {
    return null;
  }

  const handleUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      setUploadedFile(file);
      const result = await analyzeImage(file);
      setReport(result);
      toast.success(`Analysis complete! DR Grade: ${result.drGrade.grade}`, {
        position: 'top-right',
        autoClose: 4000,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      if (
        errorMessage.includes('Invalid Image') ||
        errorMessage.includes('Invalid Retinal Scan') ||
        errorMessage.includes('rejected') ||
        errorMessage.includes('quality')
      ) {
        toast.error('Invalid Image: Please upload a clear retinal fundus image.', {
          position: 'top-right',
          autoClose: 8000,
        });
      } else {
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setReport(null);
    setError(null);
    setUploadedFile(null);
    toast.info('Ready for new scan', {
      position: 'top-right',
      autoClose: 2000,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Screening"
        title="Retinal Analysis"
        description="Upload a fundus image for AI-powered diabetic retinopathy diagnosis"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <div className="sticky top-20">
            <UploadArea
              onUpload={handleUpload}
              isLoading={isLoading}
              error={error}
              uploadedFile={uploadedFile}
              onReset={handleReset}
              disabled={!hasPatientContext}
            />
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-hide">
            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <AnalysisLoader />
                </motion.div>
              )}

              {report && !isLoading && (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <StatsCards report={report} />
                  <ReportDisplay report={report} onReset={handleReset} />
                </motion.div>
              )}

              {!isLoading && !report && !uploadedFile && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="surface rounded-2xl p-12 text-center h-[400px] flex flex-col items-center justify-center"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--brand-secondary)]/15 to-[var(--brand-accent)]/15 flex items-center justify-center mb-6">
                    <Eye className="w-12 h-12 text-[var(--brand-secondary)]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                    No Analysis Results
                  </h3>
                  <p className="max-w-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Upload a fundus image from the left panel to see AI analysis results
                  </p>
                  <div className="mt-6 flex items-center gap-4 text-xs" style={{ color: 'var(--subtle-foreground)' }}>
                    <span className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-[var(--brand-secondary)]" /> Fundus Images
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" /> AI Powered
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-[var(--brand-accent)]" /> Instant Results
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
