'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, Calendar, MapPin, FileText,
  ArrowLeft, Clock, X,
  Search, Download, Share2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Button from '@/components/Common/Button';
import ReportDisplay from '@/components/Dashboard/ReportDisplay';
import Badge, { gradeToTone } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { SectionLoader } from '@/components/ui/Loader';

interface Patient {
  id: string;
  cnic: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
  createdAt: string;
  reports: any[];
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cnic = params.cnic as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cnic) {
      loadPatient();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cnic]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `/api/patients/${encodeURIComponent(cnic)}`;
      let response = await fetch(url);

      if (response.status === 404) {
        const numericCnic = cnic.replace(/-/g, '');
        const allResponse = await fetch('/api/patients');
        if (allResponse.ok) {
          const allPatients = await allResponse.json();
          const found = allPatients.find((p: any) => p.cnic.replace(/-/g, '') === numericCnic);
          if (found) {
            url = `/api/patients/${encodeURIComponent(found.cnic)}`;
            response = await fetch(url);
          }
        }
      }

      if (response.ok) {
        const data = await response.json();
        setPatient(data.patient || data);
      } else if (response.status === 404) {
        setError(`Patient not found with CNIC: ${cnic}`);
        toast.error('Patient not found. Please check the CNIC format.');
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
          description={error || `No patient found with CNIC: ${cnic}. Expected format: 35201-7329319-9`}
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
                <p className="text-sm" style={{ color: 'var(--subtle-foreground)' }}>CNIC: {patient.cnic}</p>
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
            onClick={() => router.push(`/dashboard/upload?cnic=${patient.cnic}`)}
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

      {/* Reports Section */}
      <div className="surface rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <FileText className="w-5 h-5 text-[var(--brand-secondary)]" />
            Reports ({patient.reports?.length || 0})
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
                            patientCnic={patient.cnic}
                            patientName={patient.name}
                            patientId={patient.id}
                            patientAge={patient.age}
                            patientGender={patient.gender}
                          />
                          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                            <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} className="text-xs" onClick={() => window.print()}>
                              Download Report
                            </Button>
                            <Button variant="secondary" size="sm" icon={<Share2 className="w-4 h-4" />} className="text-xs">
                              Share
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
              <button onClick={() => router.push(`/dashboard/upload?cnic=${patient.cnic}`)} className="text-[var(--brand-secondary)] hover:underline text-sm">
                Upload first scan →
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}
