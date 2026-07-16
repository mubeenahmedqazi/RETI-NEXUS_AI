'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Eye, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import UploadArea from '@/components/Dashboard/UploadArea';
import ReportDisplay from '@/components/Dashboard/ReportDisplay';
import StatsCards from '@/components/Dashboard/StatsCards';
import AnalysisLoader from '@/components/Dashboard/AnalysisLoader';
import { ReportData } from '@/types/report';
import { analyzeImage } from '@/services/api';
import Button from '@/components/Common/Button';

export default function UploadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      setUploadedFile(file);
      const result = await analyzeImage(file);
      setReport(result);
      toast.success(` Analysis complete! DR Grade: ${result.drGrade.grade}`, {
        position: "top-right",
        autoClose: 4000,
        icon: '🎯',
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
        toast.error('⚠️ Invalid Image: Please upload a clear retinal fundus image.', {
          position: "top-right",
          autoClose: 8000,
          icon: '',
        });
      } else {
        toast.error(` ${errorMessage}`, {
          position: "top-right",
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
    toast.info(' Ready for new scan', {
      position: "top-right",
      autoClose: 2000,
    });
  };

  return (
    <div className="space-y-6">
      <motion.div 
        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-violet-500/10 border border-cyan-500/20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Retinal Analysis
            </h1>
            <p className="text-white/50 text-sm mt-1 flex items-center gap-2">
              Upload fundus image for AI-powered diagnosis
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">● AI Ready</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <div className="sticky top-20">
            <UploadArea 
              onUpload={handleUpload}
              isLoading={isLoading}
              error={error}
              uploadedFile={uploadedFile}
              onReset={handleReset}
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
                  className="glass rounded-2xl p-12 text-center"
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
                  className="glass rounded-2xl p-12 text-center h-[400px] flex flex-col items-center justify-center"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 flex items-center justify-center mb-6">
                    <Eye className="w-12 h-12 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Analysis Results
                  </h3>
                  <p className="text-white/40 max-w-sm">
                    Upload a fundus image from the left panel to see AI analysis results
                  </p>
                  <div className="mt-6 flex items-center gap-4 text-xs text-white/20">
                    <span className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-cyan-400" /> Fundus Images
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" /> AI Powered
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-violet-400" /> Instant Results
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