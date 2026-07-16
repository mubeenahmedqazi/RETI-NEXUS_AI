'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Eye, Calendar, User, Search, Clock, X, ArrowLeft, Sparkles,
  Activity, Brain, Heart, AlertTriangle, CheckCircle, Image, Hash 
} from 'lucide-react';
import { format } from 'date-fns';
import { getReports } from '@/services/api';
import { ReportData } from '@/types/report';
import ReportDisplay from '@/components/Dashboard/ReportDisplay';
import Button from '@/components/Common/Button';

interface SavedReport {
  id: string;
  patientId: string;
  patientName: string;
  drGrade: string;
  confidence: number;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  processedAt: string;
  approvedAt: string;
  reportData: ReportData;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await getReports();
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report =>
    report.patientName?.toLowerCase().includes(search.toLowerCase()) ||
    report.drGrade?.toLowerCase().includes(search.toLowerCase()) ||
    report.patientId?.includes(search)
  );

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

  const openReportModal = (report: SavedReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeReportModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
    document.body.style.overflow = 'auto';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Prominent Header like Upload Page */}
        <motion.div 
          className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-violet-500/10 border border-cyan-500/20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-indigo-500/5 to-violet-500/5"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          
          <div className="relative flex items-center justify-between">
            <div>
              <motion.h1 
                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent"
                whileHover={{ scale: 1.02 }}
              >
                 Saved Reports
              </motion.h1>
              <motion.p 
                className="text-white/50 text-sm mt-1 flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                View all approved reports
                <Sparkles className="w-4 h-4 text-violet-400" />
              </motion.p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">● {reports.length} Reports</span>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by patient name or DR grade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all duration-300"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/60">Loading reports...</p>
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-white/10">
            <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Reports Found</h3>
            <p className="text-white/40">
              {search ? 'No reports match your search' : 'Approved reports will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer group"
                onClick={() => openReportModal(report)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 group-hover:from-cyan-500/30 group-hover:to-indigo-500/30 transition-all duration-300">
                        <FileText className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors duration-300">
                          {report.patientName || 'Unknown Patient'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/40">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(report.approvedAt || report.createdAt), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(report.approvedAt || report.createdAt), 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm border ${getGradeColor(report.drGrade)}`}>
                        {report.drGrade || 'N/A'}
                      </span>
                      <span className="text-sm text-white/40">
                        Confidence: {((report.confidence || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openReportModal(report);
                    }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all duration-300 group-hover:bg-white/10"
                  >
                    <Eye className="w-5 h-5 text-white/40 group-hover:text-cyan-400 transition-colors duration-300" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {isModalOpen && selectedReport && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeReportModal}
          >
            <motion.div
              className="relative w-full max-w-5xl max-h-[92vh] bg-[#0a0a1a] rounded-2xl border border-white/10 shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 glass p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/5 to-indigo-500/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-cyan-400" />
                      Report Details
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-white/40">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {selectedReport.patientName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(selectedReport.approvedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(selectedReport.approvedAt).split(',')[1]?.trim()}
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm border ${getGradeColor(selectedReport.drGrade)}`}>
                    {selectedReport.drGrade}
                  </span>
                </div>
              </div>

              {/* Scrollable Content */}
              <div 
                className="flex-1 overflow-y-auto scrollbar-hide p-6"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {/* ✅ PASS hideActions={true} TO HIDE ALL BUTTONS */}
                <ReportDisplay 
                  report={selectedReport.reportData} 
                  onReset={closeReportModal}
                  hideActions={true}  // ✅ This hides Approve, Download, Share, New Scan
                />
                
                <div className="flex justify-center mt-8 pb-2">
                  <Button 
                    variant="outline" 
                    icon={<X className="w-4 h-4" />} 
                    onClick={closeReportModal}
                    className="min-w-[140px]"
                  >
                    Close Report
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}