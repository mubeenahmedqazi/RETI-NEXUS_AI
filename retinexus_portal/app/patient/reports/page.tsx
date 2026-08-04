'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Eye, Calendar, Clock, ChevronDown, ChevronUp, Download, Share2, X } from 'lucide-react';
import { format } from 'date-fns';
import Button from '@/components/Common/Button';
import ReportDisplay from '@/components/Dashboard/ReportDisplay';
import PageHeader from '@/components/ui/PageHeader';
import Badge, { gradeToTone } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';

export default function PatientReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [patientAge, setPatientAge] = useState<number | undefined>(undefined);
  const [patientGender, setPatientGender] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadReports();
    loadPatientInfo();
  }, []);

  const loadPatientInfo = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPatientAge(data.age);
        setPatientGender(data.gender);
      }
    } catch (error) {
      console.error('Failed to fetch patient info:', error);
    }
  };

  const loadReports = async () => {
    try {
      const response = await fetch('/api/patient/reports', { credentials: 'include' });
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-2xl animate-shimmer" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Reports" description={`View all your retinal scan reports — ${reports.length} total`} />

      {reports.length === 0 ? (
        <EmptyState icon={FileText} title="No reports yet" description="Share your CNIC with a doctor to get scanned." />
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
                className="surface rounded-2xl overflow-hidden transition-all duration-300"
                style={{ borderColor: isExpanded ? 'var(--brand-secondary)' : 'var(--border)' }}
              >
                <div className="p-6 cursor-pointer hover:bg-[var(--muted)] transition-colors duration-300" onClick={() => toggleReport(report.id)}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--brand-secondary)]/15 to-[var(--brand-accent)]/15 flex-shrink-0">
                        <Eye className="w-6 h-6 text-[var(--brand-secondary)]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge tone={gradeToTone(report.drGrade)}>{report.drGrade || 'N/A'}</Badge>
                          <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>{(report.confidence * 100).toFixed(0)}% confidence</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--subtle-foreground)' }}>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(report.createdAt)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(report.createdAt)}</span>
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Report #{index + 1}</span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-[var(--brand-secondary)]" /> : <ChevronDown className="w-5 h-5" style={{ color: 'var(--subtle-foreground)' }} />}
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
                      <div className="p-6 max-h-[600px] overflow-y-auto scrollbar-hide">
                        <ReportDisplay
                          report={report.reportData}
                          onReset={() => toggleReport(report.id)}
                          hideActions={true}
                          patientCnic={report.patientCnic}
                          patientName={report.patientName}
                          patientId={report.patientId}
                          patientAge={patientAge}
                          patientGender={patientGender}
                        />
                        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} className="text-xs" onClick={() => window.print()}>Download Report</Button>
                          <Button variant="secondary" size="sm" icon={<Share2 className="w-4 h-4" />} className="text-xs">Share</Button>
                          <Button variant="outline" size="sm" icon={<X className="w-4 h-4" />} className="text-xs" onClick={() => toggleReport(report.id)}>Close</Button>
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
