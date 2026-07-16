'use client';

import { motion } from 'framer-motion';
import { 
  User, Phone, Calendar, FileText, ChevronRight,
  Activity, CheckCircle, AlertTriangle, Clock,
  Eye, MapPin, Mail, Heart
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface PatientCardProps {
  patient: {
    id: string;
    cnic: string;
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

  const badge = latestReport ? getGradeBadge(latestReport.drGrade) : getGradeBadge('N/A');
  const IconComponent = badge.icon;

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (patient.cnic) {
      const encodedCnic = encodeURIComponent(patient.cnic);
      router.push(`/dashboard/patient/${encodedCnic}`);
    } else {
      console.error('Patient CNIC is undefined');
    }
  };

  const handleNewScan = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (patient.cnic) {
      const encodedCnic = encodeURIComponent(patient.cnic);
      router.push(`/dashboard/upload?cnic=${encodedCnic}`);
    } else {
      console.error('Patient CNIC is undefined');
    }
  };

  const handleCardClick = () => {
    if (patient.cnic) {
      const encodedCnic = encodeURIComponent(patient.cnic);
      router.push(`/dashboard/patient/${encodedCnic}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 group-hover:from-cyan-500/30 group-hover:to-indigo-500/30 transition-all duration-300">
            <User className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors duration-300">
              {patient.name}
            </h4>
            <p className="text-sm text-white/40">CNIC: {patient.cnic}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300" />
      </div>

      {/* Details Grid - Removed address and status */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Phone className="w-4 h-4 text-cyan-400/60" />
          <span>{patient.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Calendar className="w-4 h-4 text-cyan-400/60" />
          <span>Added: {format(new Date(patient.createdAt), 'MMM d, yyyy')}</span>
        </div>
        {patient.age && (
          <div className="flex items-center gap-2 text-sm text-white/40">
            <User className="w-4 h-4 text-cyan-400/60" />
            <span>Age: {patient.age}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-white/40">
          <FileText className="w-4 h-4 text-cyan-400/60" />
          <span>{patient.reports?.length || 0} Reports</span>
        </div>
        {patient.gender && (
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Heart className="w-4 h-4 text-cyan-400/60" />
            <span>{patient.gender}</span>
          </div>
        )}
        {/* Removed address field */}
      </div>

      {/* Removed Latest Report Badge */}

      {/* Quick Action Buttons */}
      <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
        <button
          onClick={handleViewDetails}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all duration-300 text-xs text-white/60 hover:text-white"
        >
          <Eye className="w-3.5 h-3.5" />
          View Details
        </button>
        <button
          onClick={handleNewScan}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 text-xs text-cyan-400 hover:text-cyan-300"
        >
          <Activity className="w-3.5 h-3.5" />
          New Scan
        </button>
      </div>
    </motion.div>
  );
}