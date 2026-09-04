'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Calendar, Search, X, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { getAllDetailedAnalyses } from '@/services/api';
import { DetailedTestAnalysis, ReportData } from '@/types/report';
import DetailedAnalysisReport from '@/components/Dashboard/DetailedAnalysisReport';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface SavedDetailedAnalysis {
  id: string;
  patientId: string;
  reportId: string | null;
  reportCode: string | null;
  testName: string;
  clinicalSummary: string;
  testFindings: string;
  organFindings: { heart?: string; kidney?: string; brain?: string };
  redFlags: string[];
  recommendations: string[];
  urgency: DetailedTestAnalysis['urgency'];
  extractionMethod?: string | null;
  createdAt: string;
  patient?: { name?: string; age?: number; gender?: string };
  report?: { reportNumber?: number; reportData?: ReportData } | null;
}

function formatDate(dateString: string | undefined | null) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, 'MMM d, yyyy \'at\' h:mm a');
  } catch {
    return 'N/A';
  }
}

export default function DetailedAnalysesPage() {
  const [analyses, setAnalyses] = useState<SavedDetailedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SavedDetailedAnalysis | null>(null);
  const [autoDownload, setAutoDownload] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllDetailedAnalyses();
        setAnalyses(data);
      } catch (error) {
        console.error('Failed to load detailed analyses:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = analyses.filter(
    (a) =>
      a.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.testName?.toLowerCase().includes(search.toLowerCase())
  );

  const openAnalysis = (analysis: SavedDetailedAnalysis, download = false) => {
    setSelected(analysis);
    setAutoDownload(download);
  };

  const close = () => {
    setSelected(null);
    setAutoDownload(false);
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Clinical Records"
          title="Detailed Analysis"
          description="Follow-up test correlations saved separately from screening reports"
          actions={<Badge tone="accent">{analyses.length} Analyses</Badge>}
        />

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--subtle-foreground)' }} />
          <input
            type="text"
            placeholder="Search by patient name or test..."
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
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No Detailed Analyses Found"
            description={search ? 'No analyses match your search' : 'Saved Detailed Analysis reports will appear here'}
          />
        ) : (
          <div className="grid gap-4">
            {filtered.map((analysis, index) => (
              <motion.div
                key={analysis.id}
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
                        <Stethoscope className="w-5 h-5 text-[var(--brand-secondary)]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-lg font-semibold truncate group-hover:text-[var(--brand-secondary)] transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
                          {analysis.patient?.name || 'Unknown Patient'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--subtle-foreground)' }}>
                          <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {analysis.testName}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(analysis.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge tone="neutral">{analysis.reportCode || `DA-${analysis.id.slice(-8).toUpperCase()}`}</Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openAnalysis(analysis)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium min-w-[100px] justify-center surface hover:bg-[var(--muted)] hover:border-[var(--brand-accent)]/40 hover:scale-105 active:scale-95 transition-all duration-300"
                      style={{ color: 'var(--foreground)' }}
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <button
                      onClick={() => openAnalysis(analysis, true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium min-w-[100px] justify-center surface hover:bg-[var(--muted)] hover:border-[var(--brand-accent)]/40 hover:scale-105 active:scale-95 transition-all duration-300"
                      style={{ color: 'var(--foreground)' }}
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Analysis viewer/downloader */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.div
              className="relative w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col surface"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-[var(--brand-secondary)]/[0.06] to-[var(--brand-accent)]/[0.05] flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <Stethoscope className="w-5 h-5 text-[var(--brand-secondary)]" />
                  Detailed Analysis Report
                </h2>
                <button onClick={close} className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors">
                  <X className="w-5 h-5" style={{ color: 'var(--subtle-foreground)' }} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
                <DetailedAnalysisReport
                  result={{
                    clinicalSummary: selected.clinicalSummary,
                    testFindings: selected.testFindings,
                    organFindings: {
                      heart: selected.organFindings?.heart || '',
                      kidney: selected.organFindings?.kidney || '',
                      brain: selected.organFindings?.brain || '',
                    },
                    redFlags: selected.redFlags,
                    recommendations: selected.recommendations,
                    urgency: selected.urgency,
                    extractionMethod: selected.extractionMethod as DetailedTestAnalysis['extractionMethod'],
                  }}
                  testName={selected.testName}
                  analyzedAt={selected.createdAt}
                  reportIdLabel={selected.reportCode || `DA-${selected.id.slice(-8).toUpperCase()}`}
                  patientName={selected.patient?.name}
                  patientAge={selected.patient?.age}
                  patientGender={selected.patient?.gender}
                  screeningReport={selected.report?.reportData}
                  showDownloadOnly
                  autoDownload={autoDownload}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
