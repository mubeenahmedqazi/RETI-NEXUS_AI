'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, AlertTriangle, AlertOctagon, Stethoscope, Eye,
  ClipboardList, Brain, Heart, Bean, Image as ImageIcon, ZoomIn, X, Check,
  TrendingUp, TrendingDown, Minus, GitBranch, CheckCircle2, Download,
  type LucideIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import Button from '@/components/Common/Button';
import BiomarkerCard from '@/components/ui/BiomarkerCard';
import { Swirling } from '@/components/ui/Swirling';
import ClinicalReportHeader from '@/components/ui/ClinicalReportHeader';
import { API_BASE_URL } from '@/services/api';
import { getReportImageUrl } from '@/lib/reportImages';
import { DetailedTestAnalysis, LongitudinalAnalysis as LongitudinalAnalysisData, ReportData } from '@/types/report';

const URGENCY_META: Record<DetailedTestAnalysis['urgency'], { label: string; color: string; icon: LucideIcon }> = {
  routine: { label: 'Routine Follow-up', color: '#10b981', icon: CheckCircle2 },
  priority: { label: 'Priority Attention', color: '#f59e0b', icon: AlertTriangle },
  urgent: { label: 'Urgent — Immediate Review', color: '#ef4444', icon: AlertOctagon },
};

const TRACKING_STATUS_META: Record<'improving' | 'stable' | 'worsening' | 'mixed', { label: string; color: string; icon: LucideIcon }> = {
  improving: { label: 'Improving', color: '#10b981', icon: TrendingDown },
  stable: { label: 'Stable', color: 'var(--brand-secondary)', icon: Minus },
  worsening: { label: 'Worsening', color: '#ef4444', icon: TrendingUp },
  mixed: { label: 'Mixed', color: '#f59e0b', icon: GitBranch },
};

// Lesion-type biomarkers already get their own dedicated Lesion Detection card, so they're
// kept out of the Biomarker Dashboard grid (mirrors ReportDisplay's screening-report layout).
const EXCLUDED_FROM_BIOMARKER_DASHBOARD = [
  'hard exudates', 'soft exudates', 'microaneurysms', 'microaneurysm',
  'haemorrhages', 'hemorrhages', 'haemorrhage', 'hemorrhage',
];

const IMAGE_LABELS: Record<string, string> = {
  enhanced: 'Enhanced Image',
  vessel_mask: 'Vessel Segmentation Mask',
  detected_lesions: 'Lesion Detection / Bounding Boxes',
  gradcam: 'Grad-CAM / Heatmap Analysis',
};

// Fixed display order — the images object's own key order depends on the backend's
// JSON construction and isn't guaranteed consistent run to run, so images are always
// shown in this order regardless of how they're stored.
const IMAGE_ORDER = ['enhanced', 'vessel_mask', 'detected_lesions', 'gradcam'];

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

interface DetailedAnalysisReportProps {
  result: DetailedTestAnalysis;
  testName: string;
  analyzedAt: string;
  reportIdLabel: string;
  patientName?: string;
  patientAge?: number | string;
  patientGender?: string;
  /** The screening report this analysis correlates against — supplies the biomarker
   * dashboard, lesion counts, output images, and predicted-risk sections. Undefined for
   * a purely OCR/text-based analysis with no linked screening report (those sections are
   * simply omitted). */
  screeningReport?: ReportData;
  trackingStatus?: LongitudinalAnalysisData | null;
  trackingStatusLoading?: boolean;
  /** Hides Approve — for read-only views of an already-saved analysis (e.g. the
   * doctor-wide Detailed Analyses list), where re-approving makes no sense. */
  showDownloadOnly?: boolean;
  onApprove?: () => void;
  approving?: boolean;
  approved?: boolean;
  /** Fires the PDF print flow automatically once mounted — for a "Download" entry point
   * that shouldn't require an extra click once this report renders. */
  autoDownload?: boolean;
}

export default function DetailedAnalysisReport({
  result,
  testName,
  analyzedAt,
  reportIdLabel,
  patientName,
  patientAge,
  patientGender,
  screeningReport,
  trackingStatus,
  trackingStatusLoading,
  showDownloadOnly = false,
  onApprove,
  approving = false,
  approved = false,
  autoDownload = false,
}: DetailedAnalysisReportProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState('');

  const getImageUrl = (filename: string | undefined | null) => getReportImageUrl(filename, API_BASE_URL);

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    try {
      window.print();
    } catch (error) {
      console.error('Print failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (!autoDownload) return;
    const timer = setTimeout(() => handleDownloadPDF(), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload]);

  const openImagePopup = (url: string, label: string) => {
    setSelectedImage(url);
    setSelectedLabel(label);
  };
  const closeImagePopup = () => {
    setSelectedImage(null);
    setSelectedLabel('');
  };

  const urgency = URGENCY_META[result.urgency];
  const UrgencyIcon = urgency?.icon;
  const dashboardBiomarkers = (screeningReport?.biomarkers || []).filter(
    (b) => !EXCLUDED_FROM_BIOMARKER_DASHBOARD.includes(b.name?.toLowerCase().trim())
  );
  const lesionCounts = screeningReport?.lesionCounts;
  const reportImages = screeningReport?.images || {};

  return (
    <>
      <motion.div
        key="result"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        id="pdf-detailed-analysis-content"
        className="space-y-5"
      >
        <ClinicalReportHeader
          reportId={reportIdLabel}
          patientName={patientName}
          patientAge={patientAge}
          patientGender={patientGender}
        />

        {/* Report title card — screen + print */}
        <div className="surface rounded-2xl p-6 clinical-section">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--subtle-foreground)' }}>
                Detailed Analysis Report
              </p>
              <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{testName}</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--subtle-foreground)' }}>{formatDate(analyzedAt)}</p>
            </div>
            {urgency && UrgencyIcon && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: `${urgency.color}1a`, color: urgency.color }}
              >
                <UrgencyIcon className="w-3.5 h-3.5" />
                {urgency.label}
              </span>
            )}
          </div>
        </div>

        {/* Biomarker Dashboard + Lesion Detection — from the correlated screening report */}
        {dashboardBiomarkers.length > 0 && (
          <div className="surface rounded-2xl p-6 clinical-section">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--foreground)' }}>
              <Brain className="w-4 h-4 text-[var(--brand-secondary)]" />
              Biomarker Dashboard
            </h3>
            <div className="pdf-biomarker-grid grid grid-cols-2 gap-4">
              {dashboardBiomarkers.map((biomarker, index) => (
                <BiomarkerCard key={biomarker.name} biomarker={biomarker} index={index} />
              ))}
            </div>
          </div>
        )}

        {lesionCounts && (
          <div className="surface rounded-2xl p-6 clinical-section">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--foreground)' }}>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Lesion Detection ({lesionCounts.total ?? 0})
            </h3>
            <div className="pdf-lesion-grid grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Microaneurysms', value: lesionCounts.microaneurysms, color: '#ef4444' },
                { label: 'Haemorrhages', value: lesionCounts.haemorrhages, color: '#f97316' },
                { label: 'Hard Exudates', value: lesionCounts.hardExudates, color: '#f59e0b' },
                { label: 'Soft Exudates', value: lesionCounts.softExudates, color: 'var(--brand-secondary)' },
              ].map((l) => (
                <div key={l.label} className="lesion-stat-box rounded-xl p-4 text-center border" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-2xl font-bold" style={{ color: l.color }}>{l.value || 0}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--subtle-foreground)' }}>{l.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Output images, forced onto their own page (matches the screening report) */}
        {Object.keys(reportImages).length > 0 && (
          <div className="pdf-images-page surface rounded-2xl p-6 clinical-section">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--foreground)' }}>
              <ImageIcon className="w-4 h-4 text-[var(--brand-secondary)]" />
              Analysis Output Images
            </h3>
            <div className="grid grid-cols-2 gap-4 image-output-grid">
              {IMAGE_ORDER.map((key) => {
                const filename = reportImages?.[key];
                const imageUrl = filename ? getImageUrl(filename as string) : null;
                const label = IMAGE_LABELS[key] || key.replace('_', ' ');
                if (!imageUrl) {
                  return (
                    <div key={key} className="p-4 rounded-xl border text-center" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
                      <ImageIcon className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--subtle-foreground)' }} />
                      <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>{label}</p>
                      <p className="text-xs text-red-500 mt-1">Not available</p>
                    </div>
                  );
                }
                return (
                  <motion.div
                    key={key}
                    className="rounded-xl overflow-hidden border group cursor-pointer"
                    style={{ borderColor: 'var(--border)' }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => openImagePopup(imageUrl, label)}
                  >
                    <div className="relative">
                      <img src={imageUrl} alt={label} className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-start justify-end p-2 no-print">
                        <ZoomIn className="w-4 h-4 text-white/0 group-hover:text-white/90 transition-colors duration-300" />
                      </div>
                    </div>
                    <div className="px-3 py-2 border-t text-center" style={{ borderColor: '#cbd5e1', background: '#eef2f6' }}>
                      <p className="text-xs font-semibold" style={{ color: '#0f172a' }}>{label}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Findings, correlation, predicted risk, tracking, red flags, recommendations */}
        <div className="pdf-summary-page space-y-5">
          <div className="surface rounded-2xl p-6 clinical-section">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2" style={{ color: 'var(--foreground)' }}>
              <FileText className="w-4 h-4 text-[var(--brand-secondary)]" />
              Findings
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{result.testFindings}</p>
          </div>

          <div className="surface rounded-2xl p-6 clinical-section">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2" style={{ color: 'var(--foreground)' }}>
              <Stethoscope className="w-4 h-4 text-[var(--brand-secondary)]" />
              Detailed Analysis
            </h3>
            <p className="text-sm leading-relaxed pl-4 border-l-2" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--brand-secondary)' }}>
              {result.clinicalSummary}
            </p>
          </div>

          <div className="surface rounded-2xl p-6 clinical-section">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--foreground)' }}>
              <Eye className="w-4 h-4 text-[var(--brand-secondary)]" />
              Organ-Specific Correlation
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { key: 'heart', label: 'Heart', icon: Heart, text: result.organFindings.heart },
                { key: 'kidney', label: 'Kidney', icon: Bean, text: result.organFindings.kidney },
                { key: 'brain', label: 'Brain', icon: Brain, text: result.organFindings.brain },
              ].map((o) => o.text && (
                <div key={o.key} className="pl-4 border-l-2" style={{ borderColor: 'var(--brand-secondary)' }}>
                  <h4 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                    <o.icon className="w-3.5 h-3.5 text-[var(--brand-secondary)]" />
                    {o.label}
                  </h4>
                  <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--muted-foreground)' }}>{o.text}</p>
                </div>
              ))}
            </div>
          </div>

          {(screeningReport?.predictedRisk?.oneYear || screeningReport?.predictedRisk?.fiveYear) && (
            <div className="surface rounded-2xl p-6 clinical-section">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--foreground)' }}>
                <TrendingUp className="w-4 h-4 text-[var(--brand-accent)]" />
                Predicted Risk Outlook
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {screeningReport?.predictedRisk?.oneYear && (
                  <div className="pl-4 border-l-2" style={{ borderColor: 'var(--brand-accent)' }}>
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Predicted Outlook — 1 Year</h4>
                    <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      {screeningReport.predictedRisk.oneYear}
                    </p>
                  </div>
                )}
                {screeningReport?.predictedRisk?.fiveYear && (
                  <div className="pl-4 border-l-2" style={{ borderColor: 'var(--brand-accent)' }}>
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Predicted Outlook — 5 Years</h4>
                    <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      {screeningReport.predictedRisk.fiveYear}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {(trackingStatusLoading || trackingStatus) && (
            <div className="surface rounded-2xl p-6 clinical-section">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--foreground)' }}>
                <TrendingUp className="w-4 h-4 text-[var(--brand-secondary)]" />
                Longitudinal Tracking History
              </h3>
              {trackingStatusLoading && (
                <div className="flex items-center gap-2 text-xs no-print" style={{ color: 'var(--subtle-foreground)' }}>
                  <Swirling className="w-3.5 h-3.5" style={{ color: 'var(--brand-secondary)' }} />
                  Analyzing patient history...
                </div>
              )}
              {!trackingStatusLoading && trackingStatus && (
                <div className="rounded-xl p-4" style={{ background: 'var(--muted)' }}>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2"
                    style={{
                      background: `${TRACKING_STATUS_META[trackingStatus.overallTrend].color}1a`,
                      color: TRACKING_STATUS_META[trackingStatus.overallTrend].color,
                    }}
                  >
                    {(() => {
                      const StatusIcon = TRACKING_STATUS_META[trackingStatus.overallTrend].icon;
                      return <StatusIcon className="w-3.5 h-3.5" />;
                    })()}
                    Status: {TRACKING_STATUS_META[trackingStatus.overallTrend].label}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{trackingStatus.summary}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="surface rounded-2xl p-6 clinical-section">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--foreground)' }}>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Red Flags &amp; Warning Signs
              </h3>
              {result.redFlags.length > 0 ? (
                <ul className="space-y-2">
                  {result.redFlags.map((flag, i) => (
                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--foreground)' }}>
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#f59e0b' }} />
                      {flag}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  No significant concerns identified
                </p>
              )}
            </div>

            <div className="surface rounded-2xl p-6 clinical-section">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--foreground)' }}>
                <ClipboardList className="w-4 h-4 text-[var(--brand-secondary)]" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--foreground)' }}>
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-500 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="hidden print:block report-print-footer text-center pt-4 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs italic" style={{ color: 'var(--subtle-foreground)' }}>
              This is an AI-Generated Detailed Analysis Report. All findings must be clinically correlated and confirmed by a qualified physician before any therapeutic action.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-center flex items-center justify-center gap-1.5 no-print" style={{ color: 'var(--subtle-foreground)' }}>
          {result.extractionMethod === 'ocr' ? 'Text extracted via OCR' : result.extractionMethod === 'mixed' ? 'Text extracted via OCR + document text' : 'Text extracted from document'}
          {' '}· AI-generated, for physician review
        </p>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 no-print">
          {!showDownloadOnly && onApprove && (
            <Button
              variant={approved ? 'success' : 'primary'}
              icon={approving ? <Swirling className="w-4 h-4" style={{ color: 'var(--brand-secondary)' }} /> : <Check className="w-4 h-4" />}
              onClick={onApprove}
              disabled={approving || approved}
              className="min-w-[160px]"
              glow={!approved}
            >
              {approving ? 'Saving...' : approved ? 'Approved' : 'Approve Report'}
            </Button>
          )}

          <Button
            variant="secondary"
            icon={isDownloading ? <Swirling className="w-4 h-4" style={{ color: 'var(--brand-secondary)' }} /> : <Download className="w-4 h-4" />}
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="min-w-[140px]"
          >
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </motion.div>

      {/* Image popup — click any output image to view it full-size */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImagePopup}
          >
            <motion.div
              className="relative max-w-[90vw] max-h-[90vh]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute -top-4 -right-4 z-10 p-2 rounded-full bg-red-500/90 hover:bg-red-500 text-white transition-colors duration-300 shadow-xl"
                onClick={closeImagePopup}
              >
                <X className="w-6 h-6" />
              </button>
              <div className="rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                <img src={selectedImage} alt={selectedLabel} className="max-w-[85vw] max-h-[80vh] object-contain" />
                <div className="p-4 bg-gradient-to-t from-black/90 to-transparent">
                  <p className="text-white text-lg font-bold text-center">{selectedLabel}</p>
                  <p className="text-white/40 text-sm text-center mt-1">Click anywhere to close • Press ESC</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
