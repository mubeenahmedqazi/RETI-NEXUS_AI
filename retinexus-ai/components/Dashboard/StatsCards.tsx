'use client';

import { motion } from 'framer-motion';
import { Activity, Eye, Brain, AlertTriangle, CheckCircle } from 'lucide-react';
import { ReportData } from '@/types/report';

interface StatsCardsProps {
  report: ReportData;
}

export default function StatsCards({ report }: StatsCardsProps) {
  const getRiskColor = (risk: number) => {
    if (risk >= 0.7) return 'text-red-400';
    if (risk >= 0.4) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  // Get total lesions from lesionCounts if available
  const totalLesions = report.lesionCounts?.total ?? report.lesions?.length ?? 0;
  const biomarkersCount = report.biomarkers?.length ?? 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }} 
        className="glass rounded-xl p-4 border border-white/10"
      >
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-white/40">DR Grade</span>
        </div>
        <p className="text-lg font-bold text-white">{report.drGrade?.grade || 'N/A'}</p>
        <p className="text-xs text-white/40">
          {(report.drGrade?.confidence || 0) * 100}% confidence
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }} 
        className="glass rounded-xl p-4 border border-white/10"
      >
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-white/40">Overall Risk</span>
        </div>
        <p className={`text-lg font-bold ${getRiskColor(report.overallRisk || 0)}`}>
          {((report.overallRisk || 0) * 100).toFixed(0)}%
        </p>
        <p className={`text-xs ${getRiskColor(report.overallRisk || 0)}`}>
          {report.overallRisk >= 0.7 ? 'High' : report.overallRisk >= 0.4 ? 'Moderate' : 'Low'}
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }} 
        className="glass rounded-xl p-4 border border-white/10"
      >
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-white/40">Biomarkers</span>
        </div>
        <p className="text-lg font-bold text-white">{biomarkersCount}</p>
        <p className="text-xs text-white/40">Parameters analyzed</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.4 }} 
        className="glass rounded-xl p-4 border border-white/10"
      >
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-white/40">Lesions</span>
        </div>
        <p className="text-lg font-bold text-white">{totalLesions}</p>
        <p className="text-xs text-white/40">Detected abnormalities</p>
      </motion.div>
    </div>
  );
}