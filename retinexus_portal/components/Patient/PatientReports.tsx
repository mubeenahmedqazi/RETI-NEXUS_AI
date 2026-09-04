'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Calendar, Clock, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, Download, Share2, Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import ReportDisplay from '@/components/Dashboard/ReportDisplay';
import Button from '@/components/Common/Button';
import Badge, { gradeToTone } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

interface PatientReportsProps {
  patient: {
    id: string;
    name: string;
    phone: string;
    age: number;
    gender: string;
    address: string;
    reports: any[];
  };
  onUploadClick?: () => void;
}

export default function PatientReports({ patient, onUploadClick }: PatientReportsProps) {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const toggleReport = (reportId: string) => {
    setExpandedReport(expandedReport === reportId ? null : reportId);
  };

  const totalReports = patient.reports?.length || 0;
  const normalReports = patient.reports?.filter((r) => r.drGrade === 'No DR').length || 0;
  const abnormalReports = totalReports - normalReports;

  return (
    <div className="space-y-6">
      {/* Patient Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="surface rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--subtle-foreground)' }}>
            <FileText className="w-4 h-4 text-[var(--brand-secondary)]" /> Total Reports
          </div>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>{totalReports}</p>
        </div>
        <div className="surface rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--subtle-foreground)' }}>
            <CheckCircle className="w-4 h-4 text-emerald-500" /> Normal Scans
          </div>
          <p className="text-2xl font-bold mt-1 text-emerald-500">{normalReports}</p>
        </div>
        <div className="surface rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--subtle-foreground)' }}>
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Abnormal Scans
          </div>
          <p className="text-2xl font-bold mt-1 text-amber-500">{abnormalReports}</p>
        </div>
        <div className="surface rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--subtle-foreground)' }}>
            <Calendar className="w-4 h-4 text-[var(--brand-secondary)]" /> Latest Scan
          </div>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--foreground)' }}>
            {patient.reports && patient.reports.length > 0 ? format(new Date(patient.reports[0].createdAt), 'MMM d, yyyy') : 'No scans yet'}
          </p>
        </div>
      </div>

      {/* Reports List */}
      <div className="surface rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <FileText className="w-5 h-5 text-[var(--brand-secondary)]" /> All Reports
          </h3>
          <button onClick={onUploadClick} className="text-sm text-[var(--brand-secondary)] hover:underline flex items-center gap-1">
            New Scan
          </button>
        </div>

        {patient.reports && patient.reports.length > 0 ? (
          <div className="space-y-4">
            {patient.reports.map((report, index) => {
              const isExpanded = expandedReport === report.id;
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border transition-all duration-300 overflow-hidden"
                  style={{ borderColor: isExpanded ? 'var(--brand-secondary)' : 'var(--border)' }}
                >
                  <div className="p-4 cursor-pointer hover:bg-[var(--muted)] transition-colors duration-300" onClick={() => toggleReport(report.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-[var(--brand-secondary)]/10 flex-shrink-0">
                          <FileText className="w-4 h-4 text-[var(--brand-secondary)]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge tone={gradeToTone(report.drGrade)}>{report.drGrade || 'N/A'}</Badge>
                            <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>{(report.confidence * 100).toFixed(0)}% confidence</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--subtle-foreground)' }}>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(report.createdAt), 'MMM d, yyyy')}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(report.createdAt), 'h:mm a')}</span>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--brand-secondary)] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--subtle-foreground)' }} />}
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
                        <div className="p-4">
                          <ReportDisplay
                            report={report.reportData}
                            onReset={() => toggleReport(report.id)}
                            hideActions={true}
                            patientName={patient.name}
                            patientId={patient.id}
                            patientAge={patient.age}
                            patientGender={patient.gender}
                            reportNumber={report.reportNumber}
                            reportCode={report.reportCode}
                          />
                          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                            <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} className="text-xs" onClick={() => window.print()}>Download Report</Button>
                            <Button variant="secondary" size="sm" icon={<Share2 className="w-4 h-4" />} className="text-xs">Share</Button>
                            <Button variant="outline" size="sm" icon={<Eye className="w-4 h-4" />} className="text-xs" onClick={() => toggleReport(report.id)}>Close</Button>
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
            title="No reports yet"
            action={<button onClick={onUploadClick} className="text-[var(--brand-secondary)] hover:underline text-sm">Upload first scan →</button>}
          />
        )}
      </div>
    </div>
  );
}
