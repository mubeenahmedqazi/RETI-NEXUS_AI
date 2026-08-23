'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Microscope, Eye, Brain, Heart, Bean,
  AlertTriangle, CheckCircle, Image as ImageIcon, Check, X, ZoomIn, GitCompare,
  FileText,
} from 'lucide-react';
import { ReportData, DetailedAnalysisContext } from '@/types/report';
import Button from '../Common/Button';
import { Swirling } from '../ui/Swirling';
import { saveReport, API_BASE_URL } from '@/services/api';
import { getReportImageUrl } from '@/lib/reportImages';
import { toast } from 'react-toastify';
import ProgressRing from '@/components/ui/ProgressRing';
import SeverityMeter from '@/components/ui/SeverityMeter';
import BiomarkerCard from '@/components/ui/BiomarkerCard';
import CompareSlider from '@/components/ui/CompareSlider';
import Badge, { gradeToTone } from '@/components/ui/Badge';
import ClinicalReportHeader from '@/components/ui/ClinicalReportHeader';

interface ReportDisplayProps {
  report: ReportData;
  onReset: () => void;
  hideActions?: boolean;
  patientName?: string;
  patientId?: string;
  patientAge?: number | string;
  patientGender?: string;
  /** Saved report's globally-unique sequence number (from the DB). Falls back to the
   * backend-generated preview id when the report hasn't been saved yet. */
  reportNumber?: number;
}

const GRADE_INDEX: Record<string, number> = {
  'No DR': 0,
  'Mild NPDR': 1,
  'Moderate NPDR': 2,
  'Severe NPDR': 3,
  PDR: 4,
};

// Per-organ heading metadata for the Report Interpretation section.
// Eye/retina findings are already the subject of the main summary paragraph above,
// so only the systemic organs get their own breakdown here.
const ORGAN_SECTIONS: { key: 'heart' | 'kidney' | 'brain'; label: string; icon: typeof Heart }[] = [
  { key: 'heart', label: 'Heart Health', icon: Heart },
  { key: 'kidney', label: 'Kidney Health', icon: Bean },
  { key: 'brain', label: 'Brain Health', icon: Brain },
];

export default function ReportDisplay({
  report,
  onReset,
  hideActions = false,
  patientName: propPatientName,
  patientId: propPatientId,
  patientAge: propPatientAge,
  patientGender: propPatientGender,
  reportNumber,
}: ReportDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string>('');
  const [patientName, setPatientName] = useState<string>(propPatientName || '');
  const [patientId, setPatientId] = useState<string>(propPatientId || '');
  const [patientAge, setPatientAge] = useState<number | string>(propPatientAge ?? '');
  const [patientGender, setPatientGender] = useState<string>(propPatientGender || '');
  const [showCompare, setShowCompare] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [report]);

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setDoctorId(data.id || data.doctorId || '');
        }
      } catch (error) {
        console.error('Failed to fetch doctor info:', error);
      }
    };
    fetchDoctorInfo();
  }, []);

  useEffect(() => {
    if (!propPatientId && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const name = params.get('patientName') || params.get('name') || '';
      const id = params.get('patientId') || params.get('id') || '';
      const age = params.get('patientAge') || params.get('age') || '';
      const gender = params.get('patientGender') || params.get('gender') || '';

      if (name) setPatientName(name);
      if (id) setPatientId(id);
      if (age) setPatientAge(age);
      if (gender) setPatientGender(gender);
    }
  }, [propPatientId]);

  // Always resolve Name/Age/Gender from the patient record matching this id,
  // so the printed report reflects the real patient — not stale/missing props.
  useEffect(() => {
    if (!patientId) return;
    const fetchPatientById = async () => {
      try {
        const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}`);
        if (response.ok) {
          const data = await response.json();
          const p = data.patient;
          if (p) {
            if (p.name) setPatientName(p.name);
            if (p.age !== undefined && p.age !== null) setPatientAge(p.age);
            if (p.gender) setPatientGender(p.gender);
          }
        }
      } catch (error) {
        console.error('Failed to resolve patient by id:', error);
      }
    };
    fetchPatientById();
  }, [patientId]);

  const totalLesions = report.lesionCounts?.total ?? report.lesions?.length ?? 0;
  const gradeNumber = GRADE_INDEX[report.drGrade?.grade || 'No DR'] ?? 0;
  const confidencePct = (report.drGrade?.confidence || 0) * 100;
  const riskPct = (report.overallRisk || 0) * 100;

  // Lesion counts (Hard/Soft Exudates, Microaneurysms, Haemorrhages) have their
  // own card in "Lesion Detection" below — keep them out of the Biomarker Dashboard.
  const EXCLUDED_FROM_BIOMARKER_DASHBOARD = [
    'hard exudates',
    'soft exudates',
    'microaneurysms',
    'microaneurysm',
    'haemorrhages',
    'hemorrhages',
    'haemorrhage',
    'hemorrhage',
  ];
  const dashboardBiomarkers = (report.biomarkers || []).filter(
    (b) => !EXCLUDED_FROM_BIOMARKER_DASHBOARD.includes(b.name?.toLowerCase().trim())
  );

  const hasOrganInterpretation = ORGAN_SECTIONS.some((o) => !!report.organInterpretation?.[o.key]);

  // LLM-picked follow-up tests (0-2), only populated by the backend for DR grade
  // Moderate NPDR and above, based on this specific patient's findings.
  const suggestedTests = report.suggestedTests || [];

  // Hands the current report + patient context to the Detailed Analysis page via
  // sessionStorage (the report may still be an unsaved, just-generated result with no
  // DB id yet, so it can't simply be re-fetched by id on the next page).
  const handleOpenDetailedAnalysis = () => {
    if (!patientId) {
      toast.error('Select a patient before running a detailed analysis.', { position: 'top-right', autoClose: 4000 });
      return;
    }
    const context: DetailedAnalysisContext = {
      report,
      patientId,
      patientName: patientName || 'Patient',
      patientAge,
      patientGender,
      suggestedTests,
    };
    sessionStorage.setItem('retinexus:detailedAnalysisContext', JSON.stringify(context));
    router.push(`/dashboard/patients/${encodeURIComponent(patientId)}/detailed-analysis`);
  };

  const getImageUrl = (filename: string | undefined) => {
    return getReportImageUrl(filename, API_BASE_URL);
  };

  const imageLabels: Record<string, string> = {
    enhanced: 'Enhanced Image',
    vessel_mask: 'Vessel Segmentation',
    detected_lesions: 'Lesion Detection',
    gradcam: 'Grad-CAM Visualization',
  };

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

  const handleApprove = async () => {
    if (isApproved) {
      toast.info('Report already approved!', { position: 'top-right', autoClose: 3000 });
      return;
    }
    if (!patientId) {
      toast.error('Patient is missing. Please go back and select a patient.', { position: 'top-right', autoClose: 5000 });
      return;
    }
    if (!doctorId) {
      toast.error('Doctor information not found. Please refresh and try again.', { position: 'top-right', autoClose: 5000 });
      return;
    }

    try {
      setIsApproving(true);
      const reportData = {
        patientId,
        patientName: patientName || 'Patient',
        doctorId,
        drGrade: report.drGrade?.grade || 'Unknown',
        confidence: report.drGrade?.confidence || 0,
        description: report.drGrade?.description || '',
        imageUrl: report.imageUrl || '',
        processedAt: report.processedAt || new Date().toISOString(),
        reportData: report,
      };

      const result = await saveReport(reportData);

      if (result.success) {
        setIsApproved(true);
        toast.success(`Report approved and saved successfully for ${patientName}!`, { position: 'top-right', autoClose: 4000 });
      }
    } catch (error: any) {
      console.error('Approve error:', error);
      const errorMessage = error.message || 'Failed to save report. Please try again.';
      toast.error(errorMessage, { position: 'top-right', autoClose: 6000 });
    } finally {
      setIsApproving(false);
    }
  };

  const openImagePopup = (url: string, label: string) => {
    setSelectedImage(url);
    setSelectedLabel(label);
    document.body.style.overflow = 'hidden';
  };

  const closeImagePopup = () => {
    setSelectedImage(null);
    setSelectedLabel('');
    document.body.style.overflow = 'auto';
  };

  const enhancedUrl = getImageUrl(report.images?.enhanced) || (report.imageUrl?.startsWith('http') ? report.imageUrl : null);
  const gradcamUrl = getImageUrl(report.images?.gradcam);

  return (
    <>
      <div ref={reportRef} id="pdf-report-content" className="space-y-6 p-2">
        <ClinicalReportHeader
          reportId={reportNumber ? `RN-${String(reportNumber).padStart(6, '0')}` : report.id}
          patientName={patientName}
          patientAge={patientAge}
          patientGender={patientGender}
        />

        {/* DR Grade + Severity + Confidence */}
        <div className="surface rounded-2xl p-6 clinical-section">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Eye className="w-5 h-5 text-[var(--brand-secondary)]" />
            Diabetic Retinopathy Grade
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{report.drGrade?.grade || 'N/A'}</p>
                <Badge tone={gradeToTone(report.drGrade?.grade)}>Grade {gradeNumber}</Badge>
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{report.drGrade?.description || ''}</p>

              <div className="mt-5">
                <SeverityMeter gradeIndex={gradeNumber} />
              </div>
            </div>

            <ProgressRing
              value={confidencePct}
              size={110}
              strokeWidth={8}
              color="var(--brand-accent)"
              label={<span className="text-xl">{confidencePct.toFixed(0)}%</span>}
              sublabel="Confidence"
              className="pdf-confidence-ring"
            />
          </div>
        </div>

        {/* Risk overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="surface rounded-2xl p-5 flex items-center gap-4 sm:col-span-1">
            <ProgressRing
              value={riskPct}
              size={78}
              strokeWidth={7}
              color={riskPct >= 70 ? '#ef4444' : riskPct >= 40 ? '#f59e0b' : '#10b981'}
              label={<span className="text-sm font-bold">{riskPct.toFixed(0)}%</span>}
              className="pdf-risk-ring"
            />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Overall Risk</p>
              <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>
                {riskPct >= 70 ? 'High risk — clinical review advised' : riskPct >= 40 ? 'Moderate risk' : 'Low risk'}
              </p>
            </div>
          </div>
          <div className="surface rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{totalLesions}</p>
              <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Lesions detected</p>
            </div>
          </div>
          <div className="surface rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--brand-secondary)]/10 flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-[var(--brand-secondary)]" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{dashboardBiomarkers.length}</p>
              <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Biomarkers analyzed</p>
            </div>
          </div>
        </div>

        {/* Biomarkers */}
        {dashboardBiomarkers.length > 0 && (
          <div className="surface rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Brain className="w-5 h-5 text-[var(--brand-secondary)]" />
              Biomarker Dashboard
            </h3>
            <div className="pdf-biomarker-grid grid grid-cols-2 gap-4">
              {dashboardBiomarkers.map((biomarker, index) => (
                <BiomarkerCard key={biomarker.name} biomarker={biomarker} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Lesion Detection */}
        <div className="surface rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Lesion Detection ({totalLesions})
          </h3>

          {report.lesionCounts ? (
            <div className="pdf-lesion-grid grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Microaneurysms', value: report.lesionCounts.microaneurysms, color: '#ef4444' },
                { label: 'Haemorrhages', value: report.lesionCounts.haemorrhages, color: '#f97316' },
                { label: 'Hard Exudates', value: report.lesionCounts.hardExudates, color: '#f59e0b' },
                { label: 'Soft Exudates', value: report.lesionCounts.softExudates, color: 'var(--brand-secondary)' },
              ].map((l, i) => (
                <motion.div
                  key={l.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="lesion-stat-box rounded-xl p-4 text-center border transition-all hover:shadow-md"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <p className="text-2xl font-bold" style={{ color: l.color }}>{l.value || 0}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--subtle-foreground)' }}>{l.label}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6" style={{ color: 'var(--muted-foreground)' }}>
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
              <p>No lesions detected</p>
            </div>
          )}
        </div>

        {/* Risk Factors — formal clinical assessment table (screen only; the PDF/download
            export keeps the report compact by relying on the Report Interpretation narrative
            instead of this raw table). */}
        {report.riskFactors && report.riskFactors.length > 0 && (
          <div className="surface rounded-2xl p-6 clinical-section no-print">
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Heart className="w-5 h-5 text-rose-500" />
              Clinical Risk Factor Assessment
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--subtle-foreground)' }}>
              Systemic and ocular risk contributors identified from the analyzed scan
            </p>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr style={{ background: 'var(--muted)' }}>
                    <th
                      className="text-left font-semibold uppercase tracking-wide px-4 py-2.5 text-[10px]"
                      style={{ color: 'var(--subtle-foreground)' }}
                    >
                      Risk Factor
                    </th>
                    <th
                      className="text-left font-semibold uppercase tracking-wide px-4 py-2.5 text-[10px]"
                      style={{ color: 'var(--subtle-foreground)' }}
                    >
                      Clinical Notes
                    </th>
                    <th
                      className="text-right font-semibold uppercase tracking-wide px-4 py-2.5 text-[10px] whitespace-nowrap"
                      style={{ color: 'var(--subtle-foreground)' }}
                    >
                      Severity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.riskFactors.map((factor, index) => {
                    const color = factor.level >= 0.7 ? '#ef4444' : factor.level >= 0.4 ? '#f59e0b' : '#10b981';
                    const tier = factor.level >= 0.7 ? 'High' : factor.level >= 0.4 ? 'Moderate' : 'Low';
                    return (
                      <tr
                        key={index}
                        className="border-t align-top"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: 'var(--foreground)' }}>
                          {factor.name}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--muted-foreground)' }}>
                          {factor.description}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-end gap-1.5 min-w-[110px]">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>{tier}</span>
                              <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
                                {(factor.level * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${factor.level * 100}%` }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report Interpretation — plain-English summary, broken down per organ (web + PDF) */}
        {(hasOrganInterpretation || report.interpretation) && (
          <div className="surface rounded-2xl p-6 clinical-section">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
              <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <FileText className="w-5 h-5 text-[var(--brand-secondary)]" />
                Report Interpretation
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full" style={{ color: 'var(--brand-secondary)', background: 'var(--muted)' }}>
                AI-Generated Summary
              </span>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--subtle-foreground)' }}>
              For patient reference — to be reviewed and confirmed by the attending physician
            </p>

            {report.interpretation && (
              <p
                className="text-sm leading-relaxed pl-4 border-l-2"
                style={{ color: 'var(--muted-foreground)', borderColor: 'var(--brand-secondary)' }}
              >
                {report.interpretation}
              </p>
            )}

            {hasOrganInterpretation && (
              <div className={`grid sm:grid-cols-2 gap-4 ${report.interpretation ? 'mt-5 pt-5 border-t' : ''}`} style={{ borderColor: 'var(--border)' }}>
                {ORGAN_SECTIONS.map((organ) => {
                  const text = report.organInterpretation?.[organ.key];
                  if (!text) return null;
                  return (
                    <div key={organ.key} className="pl-4 border-l-2" style={{ borderColor: 'var(--brand-secondary)' }}>
                      <h4 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                        <organ.icon className="w-3.5 h-3.5 text-[var(--brand-secondary)]" />
                        {organ.label}
                      </h4>
                      <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--muted-foreground)' }}>
                        {text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Recommended follow-up tests — names the tests the Detailed Analysis button
            correlates against, both on screen and in the printed report. Always shown
            (even with none suggested) so the report explicitly states that, rather than
            silently omitting the section. */}
        <div className="surface rounded-2xl p-6 clinical-section pdf-suggested-tests pdf-page2-start">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Microscope className="w-5 h-5 text-[var(--brand-secondary)]" />
            Recommended Follow-up Tests
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--subtle-foreground)' }}>
            Suggested for a Detailed Analysis based on this scan&apos;s findings
          </p>
          {suggestedTests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestedTests.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
                >
                  <Microscope className="w-3 h-3 text-[var(--brand-secondary)]" />
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No test recommended</p>
          )}
        </div>

        {/* Comparison slider — screen only, excluded from the printed/PDF report */}
        {enhancedUrl && gradcamUrl && (
          <div className="surface rounded-2xl p-6 no-print">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <GitCompare className="w-5 h-5 text-[var(--brand-secondary)]" />
                Original vs Grad-CAM Overlay
              </h3>
              <button
                onClick={() => setShowCompare(!showCompare)}
                className="text-xs text-[var(--brand-secondary)] hover:underline"
              >
                {showCompare ? 'Hide' : 'Show'} comparison
              </button>
            </div>
            <AnimatePresence>
              {showCompare && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <div className="max-w-md mx-auto compare-slider-wrap">
                    <CompareSlider beforeSrc={enhancedUrl} afterSrc={gradcamUrl} beforeLabel="Original" afterLabel="Grad-CAM" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Output Images */}
        {report.images && Object.keys(report.images).length > 0 && (
          <div className="pdf-images-page surface rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <ImageIcon className="w-5 h-5 text-[var(--brand-secondary)]" />
              Analysis Output Images
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 image-output-grid">
              {Object.entries(report.images).map(([key, filename]) => {
                const imageUrl = getImageUrl(filename as string);

                if (!imageUrl) {
                  return (
                    <div key={key} className="p-4 rounded-xl border text-center" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
                      <ImageIcon className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--subtle-foreground)' }} />
                      <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>{imageLabels[key] || key}</p>
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
                    onClick={() => openImagePopup(imageUrl, imageLabels[key] || key)}
                  >
                    <div className="relative">
                      <img
                        src={imageUrl}
                        alt={imageLabels[key] || key}
                        className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-start justify-end p-2 no-print">
                        <ZoomIn className="w-4 h-4 text-white/0 group-hover:text-white/90 transition-colors duration-300" />
                      </div>
                    </div>
                    {/* Always-visible caption — required for both screen and print/PDF output */}
                    <div className="px-3 py-2 border-t text-center" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
                      <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                        {imageLabels[key] || key.replace('_', ' ')}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Print-only formal footer — appears once, at the end of the document (last page) */}
        <div className="hidden print:block report-print-footer text-center pt-4 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs italic" style={{ color: 'var(--subtle-foreground)' }}>
            This is AI Generated Report No signature Needed
          </p>
        </div>
      </div>

      {/* Image Popup Modal */}
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

      {/* Actions */}
      {!hideActions && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <Button
            variant={isApproved ? 'success' : 'primary'}
            icon={isApproving ? <Swirling className="w-4 h-4" style={{ color: 'var(--brand-secondary)' }} /> : <Check className="w-4 h-4" />}
            onClick={handleApprove}
            disabled={isApproving || isApproved || !patientId || !doctorId}
            className="min-w-[160px]"
            glow={!isApproved}
          >
            {isApproving ? 'Saving...' : isApproved ? 'Approved' : 'Approve Report'}
          </Button>

          <Button
            variant="secondary"
            icon={isDownloading ? <Swirling className="w-4 h-4" style={{ color: 'var(--brand-secondary)' }} /> : <Download className="w-4 h-4" />}
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="min-w-[140px]"
          >
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Button>

          <Button
            variant="secondary"
            icon={<Microscope className="w-4 h-4" />}
            className="min-w-[160px]"
            disabled={suggestedTests.length === 0 || !patientId}
            onClick={handleOpenDetailedAnalysis}
          >
            Detailed Analysis
          </Button>
        </div>
      )}
    </>
  );
}
