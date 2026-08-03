'use client';

import { Activity, Eye, Brain, AlertTriangle } from 'lucide-react';
import { ReportData } from '@/types/report';
import MetricCard from '@/components/ui/MetricCard';

interface StatsCardsProps {
  report: ReportData;
}

export default function StatsCards({ report }: StatsCardsProps) {
  const risk = report.overallRisk || 0;
  const riskTone =
    risk >= 0.7 ? 'text-red-500 bg-red-500/10' : risk >= 0.4 ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10';

  const totalLesions = report.lesionCounts?.total ?? report.lesions?.length ?? 0;
  const biomarkersCount = report.biomarkers?.length ?? 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="surface rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-4 h-4 text-[var(--brand-secondary)]" />
          <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>DR Grade</span>
        </div>
        <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{report.drGrade?.grade || 'N/A'}</p>
        <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>
          {((report.drGrade?.confidence || 0) * 100).toFixed(0)}% confidence
        </p>
      </div>

      <div className="surface rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-[var(--brand-secondary)]" />
          <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Overall Risk</span>
        </div>
        <p className={`text-lg font-bold ${riskTone.split(' ')[0]}`}>{(risk * 100).toFixed(0)}%</p>
        <p className={`text-xs ${riskTone.split(' ')[0]}`}>{risk >= 0.7 ? 'High' : risk >= 0.4 ? 'Moderate' : 'Low'}</p>
      </div>

      <div className="surface rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-4 h-4 text-[var(--brand-secondary)]" />
          <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Biomarkers</span>
        </div>
        <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{biomarkersCount}</p>
        <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Parameters analyzed</p>
      </div>

      <div className="surface rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-[var(--brand-secondary)]" />
          <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Lesions</span>
        </div>
        <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{totalLesions}</p>
        <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Detected abnormalities</p>
      </div>
    </div>
  );
}
