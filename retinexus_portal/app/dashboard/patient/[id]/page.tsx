'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, Calendar, MapPin, FileText,
  ArrowLeft, Clock, X,
  Search, Download, ChevronDown, ChevronUp,
  Stethoscope, CheckCircle2, AlertTriangle, ClipboardList, Heart, Bean, Brain,
} from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Button from '@/components/Common/Button';
import ReportDisplay from '@/components/Dashboard/ReportDisplay';
import ClinicalReportHeader from '@/components/ui/ClinicalReportHeader';
import Badge, { gradeToTone } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { SectionLoader } from '@/components/ui/Loader';

interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
  createdAt: string;
  reports: any[];
  detailedAnalyses: any[];
}

const URGENCY_META: Record<string, { label: string; color: string }> = {
  routine: { label: 'Routine', color: '#10b981' },
  priority: { label: 'Priority', color: '#f59e0b' },
  urgent: { label: 'Urgent', color: '#ef4444' },
};

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPatient();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/patients/${encodeURIComponent(id)}`);

      if (response.ok) {
        const data = await response.json();
        if (data.exists === false) {
          setError('Patient not found');
          toast.error('Patient not found.');
        } else {
          setPatient(data.patient || data);
        }
      } else if (response.status === 404) {
        setError('Patient not found');
        toast.error('Patient not found.');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load patient');
        toast.error(errorData.error || 'Failed to load patient');
      }
    } catch (error) {
      console.error('Failed to load patient:', error);
      setError('Network error. Please try again.');
      toast.error('Failed to load patient');
    } finally {
      setLoading(false);
    }
  };

  const toggleReport = (reportId: string) => {
    setSelectedReport(selectedReport === reportId ? null : reportId);
  };

  const toggleAnalysis = (analysisId: string) => {
    setSelectedAnalysis(selectedAnalysis === analysisId ? null : analysisId);
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMM d, yyyy');
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'h:mm a');
    } catch {
      return 'N/A';
    }
  };

  if (loading) return <SectionLoader label="Loading patient..." />;

  if (error || !patient) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.push('/dashboard/patients')}>
          Back to Patients
        </Button>
        <EmptyState
          icon={Search}
          title="Patient Not Found"
          description={error || 'No patient found.'}
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => router.push('/dashboard/patients')} className="px-4 py-2 rounded-xl surface hover:bg-[var(--muted)] transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
                View All Patients
              </button>
              <button onClick={() => router.push('/dashboard/patients')} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)] text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300">
                Add New Patient
              </button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.push('/dashboard/patients')}>
        Back to Patients
      </Button>

      {/* Patient Info */}
      <motion.div
        className="relative overflow-hidden rounded-2xl p-6 border bg-gradient-to-r from-[var(--brand-secondary)]/[0.07] to-[var(--brand-accent)]/[0.06]"
        style={{ borderColor: 'color-mix(in srgb, var(--brand-secondary) 20%, transparent)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--brand-secondary)]/15 to-[var(--brand-accent)]/15">
                <User className="w-6 h-6 text-[var(--brand-secondary)]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{patient.name}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {patient.phone || 'N/A'}</span>
              {patient.age && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Age: {patient.age}</span>}
              {patient.gender && <span className="flex items-center gap-1"><User className="w-4 h-4" /> {patient.gender}</span>}
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Added: {formatDate(patient.createdAt)}</span>
            </div>
          </div>
          <button
            onClick={() => router.push(`/dashboard/upload?patientId=${patient.id}&patientName=${encodeURIComponent(patient.name)}`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)] text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105"
          >
            Upload Scan
          </button>
        </div>
        {patient.address && (
          <div className="mt-3 text-sm flex items-center gap-1" style={{ color: 'var(--subtle-foreground)' }}>
            <MapPin className="w-4 h-4" /> {patient.address}
          </div>
        )}
      </motion.div>

      {/* Screening Reports */}
      <div className="surface rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <FileText className="w-5 h-5 text-[var(--brand-secondary)]" />
            Screening Reports ({patient.reports?.length || 0})
          </h2>
        </div>

        {patient.reports && patient.reports.length > 0 ? (
          <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
            {patient.reports.map((report, index) => {
              const isExpanded = selectedReport === report.id;
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border transition-all duration-300 overflow-hidden"
                  style={{ borderColor: isExpanded ? 'var(--brand-secondary)' : 'var(--border)' }}
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-[var(--muted)] transition-colors duration-300"
                    onClick={() => toggleReport(report.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-[var(--brand-secondary)]/10 flex-shrink-0">
                          <FileText className="w-4 h-4 text-[var(--brand-secondary)]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge tone={gradeToTone(report.drGrade)}>{report.drGrade || 'N/A'}</Badge>
                            <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>
                              {(report.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--subtle-foreground)' }}>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(report.createdAt)}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(report.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[var(--brand-secondary)] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--subtle-foreground)' }} />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <div className="p-4 max-h-[500px] overflow-y-auto scrollbar-hide">
                          <ReportDisplay
                            report={report.reportData}
                            onReset={() => toggleReport(report.id)}
                            hideActions={true}
                            patientName={patient.name}
                            patientId={patient.id}
                            patientAge={patient.age}
                            patientGender={patient.gender}
                            reportNumber={report.reportNumber}
                          />
                          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                            <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} className="text-xs" onClick={() => window.print()}>
                              Download Report
                            </Button>
                            <Button variant="outline" size="sm" icon={<X className="w-4 h-4" />} className="text-xs" onClick={() => toggleReport(report.id)}>
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
        ) : (
          <EmptyState
            icon={FileText}
            title="No Reports Yet"
            description="Upload a scan for this patient to see reports here"
            action={
              <button onClick={() => router.push(`/dashboard/upload?patientId=${patient.id}&patientName=${encodeURIComponent(patient.name)}`)} className="text-[var(--brand-secondary)] hover:underline text-sm">
                Upload first scan →
              </button>
            }
          />
        )}
      </div>

      {/* Detailed Reports — saved follow-up test correlations, kept separate from Screening Reports */}
      <div className="surface rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Stethoscope className="w-5 h-5 text-[var(--brand-secondary)]" />
            Detailed Reports ({patient.detailedAnalyses?.length || 0})
          </h2>
        </div>

        {patient.detailedAnalyses && patient.detailedAnalyses.length > 0 ? (
          <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
            {patient.detailedAnalyses.map((analysis, index) => {
              const isExpanded = selectedAnalysis === analysis.id;
              const urgency = URGENCY_META[analysis.urgency] || URGENCY_META.routine;
              const organFindings = analysis.organFindings || {};
              return (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border transition-all duration-300 overflow-hidden"
                  style={{ borderColor: isExpanded ? 'var(--brand-secondary)' : 'var(--border)' }}
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-[var(--muted)] transition-colors duration-300"
                    onClick={() => toggleAnalysis(analysis.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-[var(--brand-secondary)]/10 flex-shrink-0">
                          <Stethoscope className="w-4 h-4 text-[var(--brand-secondary)]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{analysis.testName}</span>
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                              style={{ background: `${urgency.color}1a`, color: urgency.color }}
                            >
                              {urgency.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--subtle-foreground)' }}>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(analysis.createdAt)}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(analysis.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[var(--brand-secondary)] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--subtle-foreground)' }} />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <div id="pdf-detailed-analysis-content" className="p-4 space-y-4">
                          <ClinicalReportHeader
                            reportId={`DA-${analysis.id.slice(-8).toUpperCase()}`}
                            patientName={patient.name}
                            patientAge={patient.age}
                            patientGender={patient.gender}
                          />
                          {analysis.clinicalSummary && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--subtle-foreground)' }}>Detailed Analysis</p>
                              <p className="text-sm leading-relaxed pl-3 border-l-2" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--brand-secondary)' }}>
                                {analysis.clinicalSummary}
                              </p>
                            </div>
                          )}
                          {analysis.testFindings && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--subtle-foreground)' }}>Findings</p>
                              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{analysis.testFindings}</p>
                            </div>
                          )}
                          {(organFindings.heart || organFindings.kidney || organFindings.brain) && (
                            <div className="grid sm:grid-cols-3 gap-3">
                              {[
                                { key: 'heart', label: 'Heart', icon: Heart, text: organFindings.heart },
                                { key: 'kidney', label: 'Kidney', icon: Bean, text: organFindings.kidney },
                                { key: 'brain', label: 'Brain', icon: Brain, text: organFindings.brain },
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
                              {analysis.redFlags?.length > 0 ? (
                                <ul className="space-y-1">
                                  {analysis.redFlags.map((f: string, i: number) => (
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
                                {(analysis.recommendations || []).map((r: string, i: number) => (
                                  <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--foreground)' }}>
                                    <CheckCircle2 className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 pt-2 border-t no-print" style={{ borderColor: 'var(--border)' }}>
                            <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} className="text-xs" onClick={() => window.print()}>
                              Download Report
                            </Button>
                            <Button variant="outline" size="sm" icon={<X className="w-4 h-4" />} className="text-xs" onClick={() => toggleAnalysis(analysis.id)}>
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
        ) : (
          <EmptyState
            icon={Stethoscope}
            title="No Detailed Reports Yet"
            description="Approved follow-up test correlations will appear here"
          />
        )}
      </div>
    </div>
  );
}
