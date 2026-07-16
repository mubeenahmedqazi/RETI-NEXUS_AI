'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Eye, Calendar, Clock, ArrowLeft, ChevronDown, ChevronUp, Download, Share2, X } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import Button from '@/components/Common/Button';
import ReportDisplay from '@/components/Dashboard/ReportDisplay';

export default function PatientReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await fetch('/api/patient/reports', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch(grade) {
      case 'No DR': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Mild NPDR': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Moderate NPDR': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Severe NPDR': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'PDR': return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  const toggleReport = (reportId: string) => {
    setSelectedReport(selectedReport === reportId ? null : reportId);
  };

  // Helper function to safely format date
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  const formatTime = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'h:mm a');
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/patient/dashboard')}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">My Reports</h1>
          <p className="text-white/40 text-sm">
            View all your retinal scan reports 
            <span className="ml-2 text-cyan-400">({reports.length} reports)</span>
          </p>
        </div>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="glass rounded-2xl p-12 border border-white/10 text-center">
          <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 text-lg">No reports yet</p>
          <p className="text-white/40 text-sm mt-1">Share your CNIC with a doctor to get scanned</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report, index) => {
            const isExpanded = selectedReport === report.id;
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`glass rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isExpanded 
                    ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10' 
                    : 'border-white/10 hover:border-cyan-500/30'
                }`}
              >
                {/* Report Header - Click to expand */}
                <div 
                  className="p-6 cursor-pointer hover:bg-white/5 transition-colors duration-300"
                  onClick={() => toggleReport(report.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex-shrink-0">
                        <Eye className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${getGradeColor(report.drGrade)}`}>
                            {report.drGrade || 'N/A'}
                          </span>
                          <span className="text-xs text-white/40">
                            {(report.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(report.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(report.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Report #{index + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white/40" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Report Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-white/10"
                    >
                      <div className="p-6 max-h-[600px] overflow-y-auto">
                        <ReportDisplay 
                          report={report.reportData} 
                          onReset={() => toggleReport(report.id)}
                          hideActions={true}
                        />
                        
                        {/* Report Actions */}
                        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/10">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Download className="w-4 h-4" />}
                            className="text-xs"
                            onClick={() => window.print()}
                          >
                            Download Report
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Share2 className="w-4 h-4" />}
                            className="text-xs"
                          >
                            Share
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<X className="w-4 h-4" />}
                            className="text-xs"
                            onClick={() => toggleReport(report.id)}
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}