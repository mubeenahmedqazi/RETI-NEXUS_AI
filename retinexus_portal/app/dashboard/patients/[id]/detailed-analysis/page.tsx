'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, UploadCloud, FileText, FileWarning, X, Sparkles,
  CheckCircle2, AlertTriangle, AlertOctagon, Stethoscope, Calendar, Eye,
  ClipboardList, RefreshCw, Download, ShieldAlert, Brain, Heart, Bean,
  Image as ImageIcon, ZoomIn, Check, ChevronRight, TrendingUp, TrendingDown, Minus, GitBranch,
  type LucideIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Button from '@/components/Common/Button';
import PageHeader from '@/components/ui/PageHeader';
import Badge, { gradeToTone } from '@/components/ui/Badge';
import BiomarkerCard from '@/components/ui/BiomarkerCard';
import EmptyState from '@/components/ui/EmptyState';
import { SectionLoader } from '@/components/ui/Loader';
import { Swirling } from '@/components/ui/Swirling';
import ClinicalReportHeader from '@/components/ui/ClinicalReportHeader';
import ReportDisplay from '@/components/Dashboard/ReportDisplay';
import DetailedAnalysisReport from '@/components/Dashboard/DetailedAnalysisReport';
import LongitudinalAnalysis from '@/components/Patient/LongitudinalAnalysis';
import { submitDetailedTestAnalysis, generateLongitudinalAnalysis, API_BASE_URL } from '@/services/api';
import {
  DetailedAnalysisContext,
  DetailedTestAnalysis,
  LongitudinalAnalysis as LongitudinalAnalysisData,
} from '@/types/report';
import { toVisitSummary } from '@/lib/reportVisitSummary';
import { getReportImageUrl } from '@/lib/reportImages';

const ACCEPTED_EXTENSIONS = ['pdf', 'jpg', 'jpeg'];

const URGENCY_META: Record<DetailedTestAnalysis['urgency'], { label: string; color: string; icon: LucideIcon }> = {
  routine: { label: 'Routine Follow-up', color: '#10b981', icon: CheckCircle2 },
  priority: { label: 'Priority Attention', color: '#f59e0b', icon: AlertTriangle },
  urgent: { label: 'Urgent — Immediate Review', color: '#ef4444', icon: AlertOctagon },
};

// Lesion-type biomarkers already get their own dedicated Lesion Detection card, so they're

function formatDate(dateString: string | undefined | null) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, 'MMM d, yyyy');
  } catch {
    return 'N/A';
  }
}

export default function DetailedAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [context, setContext] = useState<DetailedAnalysisContext | null>(null);
  const [previousReports, setPreviousReports] = useState<any[]>([]);
  // Full, unsliced report history — feeds the Longitudinal Trend widget, which
  // lives only on this page (not the plain screening-report view).
  const [allReports, setAllReports] = useState<any[]>([]);
  // This patient's saved Detailed Analyses — merged into Longitudinal Tracking
  // History alongside screening reports and the current report.
  const [allDetailedAnalyses, setAllDetailedAnalyses] = useState<any[]>([]);
  const [loadingContext, setLoadingContext] = useState(true);
  const [trackingStatus, setTrackingStatus] = useState<LongitudinalAnalysisData | null>(null);
  const [trackingStatusLoading, setTrackingStatusLoading] = useState(false);

  const [selectedTest, setSelectedTest] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DetailedTestAnalysis | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [viewingReport, setViewingReport] = useState<any | null>(null);
  const [viewingDetailedAnalysis, setViewingDetailedAnalysis] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!patientId) return;

    const load = async () => {
      setLoadingContext(true);
      try {
        const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}`);
        const data = await res.json();
        const patient = data.patient || data;
        const reports: any[] = patient?.reports || [];
        setAllReports(reports);
        setAllDetailedAnalyses(patient?.detailedAnalyses || []);

        const stored = sessionStorage.getItem('retinexus:detailedAnalysisContext');
        if (stored) {
          const parsed: DetailedAnalysisContext = JSON.parse(stored);
          if (parsed.patientId === patientId) {
            setContext(parsed);
            setSelectedTest(parsed.suggestedTests[0] || '');
            setPreviousReports(reports.slice(0, 3));
            return;
          }
        }

        // No session context (direct link / refresh) — fall back to the patient's most
        // recently saved report as "current" and the next 3 as history.
        if (reports.length > 0) {
          const [latest, ...rest] = reports;
          const fallback: DetailedAnalysisContext = {
            report: latest.reportData,
            reportId: latest.id,
            patientId,
            patientName: patient.name,
            patientAge: patient.age,
            patientGender: patient.gender,
            suggestedTests: latest.reportData?.suggestedTests || [],
          };
          setContext(fallback);
          setSelectedTest(fallback.suggestedTests[0] || '');
          setPreviousReports(rest.slice(0, 3));
        }
      } catch {
        toast.error('Failed to load patient context.', { position: 'top-right', autoClose: 4000 });
      } finally {
        setLoadingContext(false);
      }
    };

    load();
  }, [patientId]);

  // Longitudinal Tracking History status — asks the LLM for the overall trend
  // (improving/stable/worsening/mixed) + advice synthesizing this patient's
  // recent history alongside the current visit. Capped to the last 3 previous
  // reports overall — screening and Detailed Analysis mixed, whichever are most
  // recent — so the prompt stays focused instead of growing unbounded over a
  // long-tenured patient. Only skipped when there's nothing previous at all.
  useEffect(() => {
    if (!context) return;
    const screeningHistory = context.reportId
      ? allReports.filter((r) => r.id !== context.reportId)
      : allReports.slice(1);

    if (screeningHistory.length === 0 && allDetailedAnalyses.length === 0) {
      setTrackingStatus(null);
      return;
    }

    type RecentEntry =
      | { kind: 'screening'; date: string; raw: any }
      | { kind: 'detailed'; date: string; raw: any };

    const last3: RecentEntry[] = [
      ...screeningHistory.filter((r) => r.reportData).map((r): RecentEntry => ({ kind: 'screening', date: r.createdAt, raw: r })),
      ...allDetailedAnalyses.map((a): RecentEntry => ({ kind: 'detailed', date: a.createdAt, raw: a })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    const chronologicalVisits = [
      ...last3
        .filter((e): e is Extract<RecentEntry, { kind: 'screening' }> => e.kind === 'screening')
        .map((e) => toVisitSummary(e.raw.reportData, e.raw.createdAt))
        .reverse(),
      toVisitSummary(context.report, context.report.processedAt),
    ];
    const detailedPayload = last3
      .filter((e): e is Extract<RecentEntry, { kind: 'detailed' }> => e.kind === 'detailed')
      .map((e) => ({
        date: e.raw.createdAt as string,
        testName: (e.raw.testName as string) || 'Detailed Analysis',
        urgency: (e.raw.urgency as string) || 'routine',
        clinicalSummary: (e.raw.clinicalSummary as string) || '',
      }));

    setTrackingStatusLoading(true);
    generateLongitudinalAnalysis(chronologicalVisits, detailedPayload)
      .then(setTrackingStatus)
      .catch(() => setTrackingStatus(null))
      .finally(() => setTrackingStatusLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context?.reportId, allReports.length, allDetailedAnalyses.length]);

  const handleFileChosen = (chosen: File | null) => {
    if (!chosen) return;
    const ext = chosen.name.split('.').pop()?.toLowerCase();
    if (!ext || !ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error('Only PDF, JPG, or JPEG files are supported.', { position: 'top-right', autoClose: 4000 });
      return;
    }
    setFile(chosen);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFileChosen(e.dataTransfer.files?.[0] || null);
  };

  const runAnalysis = async () => {
    if (!file || !context || !selectedTest) return;
    setAnalyzing(true);
    setError(null);
    try {
      const currentVisit = toVisitSummary(context.report, context.report.processedAt);
      const previousVisits = previousReports
        .filter((r) => r.reportData)
        .map((r) => toVisitSummary(r.reportData, r.createdAt));
      const analysis = await submitDetailedTestAnalysis(file, selectedTest, context.patientName, currentVisit, previousVisits);
      setResult(analysis);
      setAnalyzedAt(new Date().toISOString());
    } catch (e: any) {
      setError(e.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setApproved(false);
  };

  const handleApprove = async () => {
    if (!result || !context) return;
    if (approved) {
      toast.info('Detailed analysis already approved!', { position: 'top-right', autoClose: 3000 });
      return;
    }
    setApproving(true);
    try {
      const response = await fetch('/api/detailed-analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: context.patientId,
          reportId: context.reportId || null,
          testName: selectedTest,
          clinicalSummary: result.clinicalSummary,
          testFindings: result.testFindings,
          organFindings: result.organFindings,
          redFlags: result.redFlags,
          recommendations: result.recommendations,
          urgency: result.urgency,
          extractionMethod: result.extractionMethod || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save detailed analysis');
      setApproved(true);
      toast.success('Detailed analysis approved and saved to patient records!', { position: 'top-right', autoClose: 4000 });
    } catch (e: any) {
      toast.error(e.message || 'Failed to save detailed analysis.', { position: 'top-right', autoClose: 5000 });
    } finally {
      setApproving(false);
    }
  };

  if (loadingContext) {
    return <SectionLoader label="Loading patient context..." className="min-h-[60vh]" />;
  }

  if (!context) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.push(`/dashboard/patients`)}>
          Back to Patients
        </Button>
        <EmptyState
          icon={FileWarning}
          title="No Screening Report Found"
          description="This patient has no retinal screening report yet to run a detailed analysis against."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 no-print">
        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.push(`/dashboard/patient/${encodeURIComponent(patientId)}`)}>
          Back to {context.patientName}
        </Button>
        {result && (
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={resetUpload}>
            Run Another Test
          </Button>
        )}
      </div>

      <div className="no-print">
        <PageHeader
          eyebrow="AI-Assisted Correlation"
          title="Detailed Analysis"
          description={`Upload ${selectedTest || 'the suggested follow-up test'} for ${context.patientName} — it's read automatically and correlated against their retinal screening findings.`}
        />
      </div>

      {/* Longitudinal Trend Analysis — lives here only, not on the plain screening report view */}
      {allReports.length >= 2 && (
        <div className="no-print">
          <LongitudinalAnalysis reports={allReports} />
        </div>
      )}

      <div className="grid lg:grid-cols-[340px_1fr] gap-6 items-start">
        {/* ── LEFT: screening context (screen only — not part of the exported report) ── */}
        <div className="space-y-6 lg:sticky lg:top-24 no-print">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="surface rounded-2xl p-5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--subtle-foreground)' }}>
              Current Screening
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={gradeToTone(context.report.drGrade?.grade)}>{context.report.drGrade?.grade || 'N/A'}</Badge>
              <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>
                {formatDate(context.report.processedAt)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                  {((context.report.overallRisk || 0) * 100).toFixed(0)}%
                </p>
                <p className="text-[10px]" style={{ color: 'var(--subtle-foreground)' }}>Overall Risk</p>
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                  {context.report.lesionCounts?.total ?? 0}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--subtle-foreground)' }}>Lesions Detected</p>
              </div>
            </div>
          </motion.div>

          {/* Previous Reports — click any entry to open its full screening report */}
          {previousReports.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="surface rounded-2xl p-5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: 'var(--subtle-foreground)' }}>
                <Calendar className="w-3 h-3" />
                Previous Reports
              </p>
              <div className="space-y-1.5">
                {previousReports.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setViewingReport(r)}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl hover:bg-[var(--muted)] transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <Badge tone={gradeToTone(r.drGrade)} className="text-[10px]">{r.drGrade}</Badge>
                      <span className="text-[11px] truncate" style={{ color: 'var(--subtle-foreground)' }}>{formatDate(r.createdAt)}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--subtle-foreground)' }} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Previous Detailed Analysis — click any entry to open its full report */}
          {allDetailedAnalyses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="surface rounded-2xl p-5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: 'var(--subtle-foreground)' }}>
                <Stethoscope className="w-3 h-3" />
                Previous Detailed Analysis
              </p>
              <div className="space-y-1.5">
                {allDetailedAnalyses.map((a) => {
                  const meta = URGENCY_META[a.urgency as DetailedTestAnalysis['urgency']] || URGENCY_META.routine;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setViewingDetailedAnalysis(a)}
                      className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl hover:bg-[var(--muted)] transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: `${meta.color}1a`, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[11px] truncate" style={{ color: 'var(--foreground)' }}>{a.testName}</span>
                        <span className="text-[11px] truncate" style={{ color: 'var(--subtle-foreground)' }}>{formatDate(a.createdAt)}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--subtle-foreground)' }} />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── RIGHT: uploader, or the rendered Detailed Analysis Report ──────────── */}
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="surface rounded-2xl p-6 space-y-5"
            >
              {context.suggestedTests.length > 1 && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Which test are you uploading?</p>
                  <div className="flex flex-wrap gap-2">
                    {context.suggestedTests.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTest(t)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors"
                        style={
                          selectedTest === t
                            ? { background: 'var(--brand-secondary)', borderColor: 'var(--brand-secondary)', color: '#fff' }
                            : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                        }
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors"
                style={{
                  borderColor: dragging ? 'var(--brand-secondary)' : 'var(--border)',
                  background: dragging ? 'color-mix(in srgb, var(--brand-secondary) 6%, transparent)' : 'var(--muted)',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,image/jpeg,application/pdf"
                  onChange={(e) => handleFileChosen(e.target.files?.[0] || null)}
                />
                <UploadCloud className="w-9 h-9 mx-auto mb-3" style={{ color: 'var(--brand-secondary)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Drag &amp; drop the {selectedTest || 'test report'} here, or click to browse
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--subtle-foreground)' }}>PDF, JPG, or JPEG</p>
              </div>

              {file && (
                <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                  <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brand-secondary)' }} />
                  <span className="text-sm truncate flex-1" style={{ color: 'var(--foreground)' }}>{file.name}</span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--subtle-foreground)' }}>
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                  <button onClick={() => setFile(null)} className="p-1 rounded-lg hover:bg-[var(--muted)] flex-shrink-0">
                    <X className="w-3.5 h-3.5" style={{ color: 'var(--subtle-foreground)' }} />
                  </button>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                variant="primary"
                icon={analyzing ? <Swirling className="w-4 h-4" style={{ color: 'var(--brand-secondary)' }} /> : <Sparkles className="w-4 h-4" />}
                disabled={!file || analyzing}
                onClick={runAnalysis}
                className="w-full"
                glow={!!file && !analyzing}
              >
                {analyzing ? 'Extracting text & analyzing...' : 'Run Detailed Analysis'}
              </Button>
            </motion.div>
          ) : (
            <DetailedAnalysisReport
              key="result"
              result={result}
              testName={selectedTest}
              analyzedAt={analyzedAt}
              reportIdLabel={`DA-${patientId.slice(-8).toUpperCase()}`}
              patientName={context.patientName}
              patientAge={context.patientAge}
              patientGender={context.patientGender}
              screeningReport={context.report}
              trackingStatus={trackingStatus}
              trackingStatusLoading={trackingStatusLoading}
              onApprove={handleApprove}
              approving={approving}
              approved={approved}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Previous report viewer — click a Previous Reports entry to open its full report */}
      <AnimatePresence>
        {viewingReport && (
          <motion.div
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingReport(null)}
          >
            <motion.div
              className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden surface"
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone={gradeToTone(viewingReport.drGrade)}>{viewingReport.drGrade}</Badge>
                  <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>{formatDate(viewingReport.createdAt)}</span>
                </div>
                <button onClick={() => setViewingReport(null)} className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors">
                  <X className="w-4 h-4" style={{ color: 'var(--subtle-foreground)' }} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(90vh - 57px)' }}>
                <ReportDisplay
                  report={viewingReport.reportData}
                  onReset={() => setViewingReport(null)}
                  hideActions
                  patientName={context.patientName}
                  patientId={context.patientId}
                  patientAge={context.patientAge}
                  patientGender={context.patientGender}
                  reportNumber={viewingReport.reportNumber}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Previous Detailed Analysis viewer — click a sidebar entry to open its full report */}
      <AnimatePresence>
        {viewingDetailedAnalysis && (
          <motion.div
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingDetailedAnalysis(null)}
          >
            <motion.div
              className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden surface"
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{viewingDetailedAnalysis.testName}</span>
                  {(() => {
                    const meta = URGENCY_META[viewingDetailedAnalysis.urgency as DetailedTestAnalysis['urgency']] || URGENCY_META.routine;
                    return (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                        style={{ background: `${meta.color}1a`, color: meta.color }}
                      >
                        {meta.label}
                      </span>
                    );
                  })()}
                  <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>{formatDate(viewingDetailedAnalysis.createdAt)}</span>
                </div>
                <button onClick={() => setViewingDetailedAnalysis(null)} className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors">
                  <X className="w-4 h-4" style={{ color: 'var(--subtle-foreground)' }} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto scrollbar-hide space-y-4" style={{ maxHeight: 'calc(90vh - 57px)' }}>
                {viewingDetailedAnalysis.clinicalSummary && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--subtle-foreground)' }}>Detailed Analysis</p>
                    <p className="text-sm leading-relaxed pl-3 border-l-2" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--brand-secondary)' }}>
                      {viewingDetailedAnalysis.clinicalSummary}
                    </p>
                  </div>
                )}
                {viewingDetailedAnalysis.testFindings && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--subtle-foreground)' }}>Findings</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{viewingDetailedAnalysis.testFindings}</p>
                  </div>
                )}
                {(viewingDetailedAnalysis.organFindings?.heart || viewingDetailedAnalysis.organFindings?.kidney || viewingDetailedAnalysis.organFindings?.brain) && (
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { key: 'heart', label: 'Heart', icon: Heart, text: viewingDetailedAnalysis.organFindings?.heart },
                      { key: 'kidney', label: 'Kidney', icon: Bean, text: viewingDetailedAnalysis.organFindings?.kidney },
                      { key: 'brain', label: 'Brain', icon: Brain, text: viewingDetailedAnalysis.organFindings?.brain },
                    ].map((o) => o.text && (
                      <div key={o.key} className="pl-3 border-l-2" style={{ borderColor: 'var(--brand-secondary)' }}>
                        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                          <o.icon className="w-3 h-3 text-[var(--brand-secondary)]" />
                          {o.label}
                        </p>
                        <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--muted-foreground)' }}>{o.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1" style={{ color: 'var(--subtle-foreground)' }}>
                      <AlertTriangle className="w-3 h-3 text-amber-500" /> Red Flags
                    </p>
                    {viewingDetailedAnalysis.redFlags?.length > 0 ? (
                      <ul className="space-y-1">
                        {viewingDetailedAnalysis.redFlags.map((f: string, i: number) => (
                          <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--foreground)' }}>
                            <span className="mt-1 w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#f59e0b' }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> None identified
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1" style={{ color: 'var(--subtle-foreground)' }}>
                      <ClipboardList className="w-3 h-3 text-[var(--brand-secondary)]" /> Recommendations
                    </p>
                    <ul className="space-y-1">
                      {(viewingDetailedAnalysis.recommendations || []).map((r: string, i: number) => (
                        <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--foreground)' }}>
                          <CheckCircle2 className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
