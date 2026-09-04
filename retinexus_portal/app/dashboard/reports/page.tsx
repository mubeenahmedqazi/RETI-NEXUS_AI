'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Calendar, Clock, User, Search, X, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { getReports } from '@/services/api';
import { ReportData } from '@/types/report';
import ReportDisplay from '@/components/Dashboard/ReportDisplay';
import Button from '@/components/Common/Button';
import PageHeader from '@/components/ui/PageHeader';
import Badge, { gradeToTone } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface SavedReport {
  id: string;
  reportNumber: number;
  reportCode: string | null;
  patientId: string;
  patientName: string;
  drGrade: string;
  confidence: number;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  processedAt: string;
  approvedAt: string;
  createdAt: string;
  reportData: ReportData;
  patient?: {
    name?: string;
    age?: number;
    gender?: string;
  };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // True only when the modal was opened via the card's Download button, so ReportDisplay
  // knows to fire the print flow automatically instead of just sitting open for viewing.
  const [autoDownload, setAutoDownload] = useState(false);

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

  const filteredReports = reports.filter(
    (report) =>
      report.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      report.drGrade?.toLowerCase().includes(search.toLowerCase()) ||
      report.patientId?.includes(search)
  );

  const openReportModal = (report: SavedReport, download = false) => {
    setSelectedReport(report);
    setAutoDownload(download);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeReportModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
    setAutoDownload(false);
    document.body.style.overflow = 'auto';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Clinical Records"
          title="Screening Reports"
          description="View all approved patient screening reports"
          actions={<Badge tone="accent">{reports.length} Reports</Badge>}
        />

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--subtle-foreground)' }} />
          <input
            type="text"
            placeholder="Search by patient name or DR grade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl surface ring-focus outline-none transition-all duration-300"
            style={{ color: 'var(--foreground)' }}
          />
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredReports.length === 0 ? (
          <EmptyState icon={FileText} title="No Reports Found" description={search ? 'No reports match your search' : 'Approved reports will appear here'} />
        ) : (
          <div className="grid gap-4">
            {filteredReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                className="surface rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-[var(--brand-secondary)]/15 to-[var(--brand-accent)]/15">
                        <FileText className="w-5 h-5 text-[var(--brand-secondary)]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-lg font-semibold truncate group-hover:text-[var(--brand-secondary)] transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
                          {report.patientName || 'Unknown Patient'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--subtle-foreground)' }}>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(report.approvedAt || report.createdAt), 'MMM d, yyyy')}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(report.approvedAt || report.createdAt), 'h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge tone={gradeToTone(report.drGrade)}>{report.drGrade || 'N/A'}</Badge>
                      <Badge tone="neutral">{report.reportCode || `RN-${String(report.reportNumber).padStart(6, '0')}`}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => openReportModal(report)}
                      className="min-w-[100px]"
                    >
                      View
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Download className="w-4 h-4" />}
                      onClick={() => openReportModal(report, true)}
                      className="min-w-[100px]"
                    >
                      Download
                    </Button>
                  </div>
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
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeReportModal}
          >
            <motion.div
              className="relative w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col surface"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-[var(--brand-secondary)]/[0.06] to-[var(--brand-accent)]/[0.05]" style={{ borderColor: 'var(--border)' }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                      <FileText className="w-5 h-5 text-[var(--brand-secondary)]" />
                      Report Details
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-sm" style={{ color: 'var(--subtle-foreground)' }}>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {selectedReport.patientName}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(selectedReport.approvedAt)}</span>
                    </div>
                  </div>
                  <Badge tone={gradeToTone(selectedReport.drGrade)}>{selectedReport.drGrade}</Badge>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
                <ReportDisplay
                  report={selectedReport.reportData}
                  onReset={closeReportModal}
                  hideActions={true}
                  autoDownload={autoDownload}
                  patientName={selectedReport.patient?.name || selectedReport.patientName}
                  patientId={selectedReport.patientId}
                  patientAge={selectedReport.patient?.age}
                  patientGender={selectedReport.patient?.gender}
                  reportNumber={selectedReport.reportNumber}
                  reportCode={selectedReport.reportCode}
                />
                <div className="flex justify-center mt-8 pb-2">
                  <Button variant="outline" icon={<X className="w-4 h-4" />} onClick={closeReportModal} className="min-w-[140px]">
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
