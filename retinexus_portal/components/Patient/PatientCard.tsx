'use client';

import { motion } from 'framer-motion';
import {
  User, Phone, Calendar, FileText, ChevronRight,
  Activity, Eye, Heart,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import Badge, { gradeToTone } from '@/components/ui/Badge';

interface PatientCardProps {
  patient: {
    id: string;
    name: string;
    phone: string;
    age: number;
    gender: string;
    address: string;
    email?: string;
    createdAt: string;
    reports: any[];
  };
  index: number;
}

export default function PatientCard({ patient, index }: PatientCardProps) {
  const router = useRouter();
  const latestReport = patient.reports && patient.reports.length > 0 ? patient.reports[0] : null;

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/patient/${encodeURIComponent(patient.id)}`);
  };

  const handleNewScan = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/upload?patientId=${encodeURIComponent(patient.id)}&patientName=${encodeURIComponent(patient.name)}`);
  };

  const handleCardClick = () => {
    router.push(`/dashboard/patient/${encodeURIComponent(patient.id)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      className="surface rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[var(--brand-secondary)]/15 to-[var(--brand-accent)]/15">
            <User className="w-5 h-5 text-[var(--brand-secondary)]" />
          </div>
          <div>
            <h4 className="text-lg font-semibold group-hover:text-[var(--brand-secondary)] transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
              {patient.name}
            </h4>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 group-hover:text-[var(--brand-secondary)] transition-all duration-300" style={{ color: 'var(--subtle-foreground)' }} />
      </div>

      {latestReport && (
        <div className="mt-3">
          <Badge tone={gradeToTone(latestReport.drGrade)}>{latestReport.drGrade || 'N/A'}</Badge>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-[var(--brand-secondary)]/60" />
          <span>{patient.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--brand-secondary)]/60" />
          <span>Added: {format(new Date(patient.createdAt), 'MMM d, yyyy')}</span>
        </div>
        {patient.age && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--brand-secondary)]/60" />
            <span>Age: {patient.age}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--brand-secondary)]/60" />
          <span>{patient.reports?.length || 0} Reports</span>
        </div>
        {patient.gender && (
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[var(--brand-secondary)]/60" />
            <span>{patient.gender}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={handleViewDetails}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 text-xs hover:bg-[var(--muted)]"
          style={{ color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
        >
          <Eye className="w-3.5 h-3.5" />
          View Details
        </button>
        <button
          onClick={handleNewScan}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[var(--brand-secondary)]/12 to-[var(--brand-accent)]/12 hover:from-[var(--brand-secondary)]/20 hover:to-[var(--brand-accent)]/20 transition-all duration-300 text-xs text-[var(--brand-secondary)]"
          style={{ border: '1px solid color-mix(in srgb, var(--brand-secondary) 25%, transparent)' }}
        >
          <Activity className="w-3.5 h-3.5" />
          New Scan
        </button>
      </div>
    </motion.div>
  );
}
