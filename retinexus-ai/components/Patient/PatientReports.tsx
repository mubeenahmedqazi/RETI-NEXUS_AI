'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Eye, Calendar, Clock, ChevronDown, ChevronUp,
  Activity, CheckCircle, AlertTriangle, Download, Share2,
  X, User, Phone, MapPin, Heart
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import ReportView from '@/components/Dashboard/ReportView';
import Button from '@/components/Common/Button';

interface PatientReportsProps {
  patient: {
    id: string;
    cnic: string;
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
  const router = useRouter();
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const getGradeBadge = (grade: string) => {
    switch(grade) {
      case 'No DR': 
        return { 
          color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 
          icon: CheckCircle,
          label: 'Normal'
        };
      case 'Mild NPDR': 
        return { 
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 
          icon: Activity,
          label: 'Mild'
        };
      case 'Moderate NPDR': 
        return { 
          color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', 
          icon: Activity,
          label: 'Moderate'
        };
      case 'Severe NPDR': 
        return { 
          color: 'bg-red-500/20 text-red-400 border-red-500/30', 
          icon: AlertTriangle,
          label: 'Severe'
        };
      case 'PDR': 
        return { 
          color: 'bg-red-500/20 text-red-500 border-red-500/30', 
          icon: AlertTriangle,
          label: 'PDR'
        };
      default: 
        return { 
          color: 'bg-white/10 text-white/60 border-white/10', 
          icon: Activity,
          label: 'N/A'
        };
    }
  };

  const toggleReport = (reportId: string) => {
    setExpandedReport(expandedReport === reportId ? null : reportId);
  };

  // Calculate report statistics
  const totalReports = patient.reports?.length || 0;
  const normalReports = patient.reports?.filter(r => r.drGrade === 'No DR').length || 0;
  const abnormalReports = totalReports - normalReports;

  return (
    <div className="space-y-6">
      {/* Patient Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <FileText className="w-4 h-4 text-cyan-400" />
            Total Reports
          </div>
          <p className="text-2xl font-bold text-white mt-1">{totalReports}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Normal Scans
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{normalReports}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Abnormal Scans
          </div>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{abnormalReports}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Activity className="w-4 h-4 text-cyan-400" />
            Latest Scan
          </div>
          <p className="text-sm font-medium text-white mt-1">
            {patient.reports && patient.reports.length > 0 
              ? format(new Date(patient.reports[0].createdAt), 'MMM d, yyyy')
              : 'No scans yet'}
          </p>
        </div>
      </div>

      {/* Reports List */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            All Reports
          </h3>
          <button
            onClick={onUploadClick}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors duration-300 flex items-center gap-1"
          >
            <Activity className="w-4 h-4" />
            New Scan
          </button>
        </div>

        {patient.reports && patient.reports.length > 0 ? (
          <div className="space-y-4">
            {patient.reports.map((report, index) => {
              const badge = getGradeBadge(report.drGrade);
              const IconComponent = badge.icon;
              const isExpanded = expandedReport === report.id;

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300 overflow-hidden"
                >
                  {/* Report Header - Click to expand */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors duration-300"
                    onClick={() => toggleReport(report.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-cyan-500/10 flex-shrink-0">
                          <FileText className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${badge.color}`}>
                              {report.drGrade || 'N/A'}
                            </span>
                            <span className="text-xs text-white/40">
                              • {badge.label}
                            </span>
                            <span className="text-xs text-white/40">
                              • {(report.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(report.createdAt), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(report.createdAt), 'h:mm a')}
                            </span>
                            {report.patientName && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {report.patientName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <IconComponent className="w-4 h-4" />
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-white/40" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white/40" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Report Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-4">
                          <ReportView report={report.reportData} />
                          
                          {/* Report Actions */}
                          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/10">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Download className="w-4 h-4" />}
                              className="text-xs"
                            >
                              Download Report
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Share2 className="w-4 h-4" />}
                              className="text-xs"
                            >
                              Share
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Eye className="w-4 h-4" />}
                              className="text-xs"
                              onClick={() => {
                                // You can add logic to open full report view
                              }}
                            >
                              Full View
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
          <div className="text-center py-12 text-white/40">
            <FileText className="w-12 h-12 mx-auto mb-3 text-white/20" />
            <p>No reports yet</p>
            <button
              onClick={onUploadClick}
              className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 mx-auto"
            >
              <Activity className="w-4 h-4" />
              Upload first scan →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}