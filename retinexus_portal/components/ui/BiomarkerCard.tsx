'use client';

import { motion } from 'framer-motion';
import { Biomarker } from '@/types/report';
import { Activity, Droplets, GitBranch, Waves, LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  'Vessel Tortuosity': Waves,
  'Vessel Density': Droplets,
  'Branching Points': GitBranch,
  'Arteriolar to Venular Ratio': Activity,
};

const STATUS_COLOR: Record<Biomarker['status'], string> = {
  normal: '#10b981',
  elevated: '#ef4444',
  low: '#f59e0b',
};

export default function BiomarkerCard({ biomarker, index }: { biomarker: Biomarker; index: number }) {
  const Icon = ICONS[biomarker.name] || Activity;
  const color = STATUS_COLOR[biomarker.status] || 'var(--brand-secondary)';
  const [min, max] = biomarker.normalRange;
  const span = Math.max(max - min, 0.0001);
  const rangeMax = Math.max(max * 1.3, biomarker.value * 1.1, 0.0001);
  const valuePct = Math.min(100, (biomarker.value / rangeMax) * 100);
  const bandStart = (min / rangeMax) * 100;
  const bandEnd = (max / rangeMax) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -2 }}
      className="biomarker-card rounded-xl p-4 border transition-shadow hover:shadow-md group"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <div className="biomarker-icon-row flex items-center gap-2">
          <div className="biomarker-icon p-1.5 rounded-lg" style={{ background: `${color}1a` }}>
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{biomarker.name}</span>
        </div>
        <span
          className="biomarker-status text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
          style={{ background: `${color}1a`, color }}
        >
          {biomarker.status}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold" style={{ color }}>{biomarker.value}</span>
        <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>{biomarker.unit}</span>
      </div>

      {/* mini range bar — decorative, dropped from the print layout */}
      <div className="biomarker-rangebar relative mt-3 h-1.5 rounded-full" style={{ background: 'var(--muted)' }}>
        <div
          className="absolute top-0 bottom-0 rounded-full bg-emerald-500/20"
          style={{ left: `${bandStart}%`, width: `${Math.max(bandEnd - bandStart, 2)}%` }}
        />
        <motion.div
          className="absolute -top-0.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow"
          style={{ background: color }}
          initial={{ left: 0 }}
          animate={{ left: `calc(${valuePct}% - 5px)` }}
          transition={{ duration: 0.7, delay: index * 0.06 }}
        />
      </div>
      <div className="biomarker-range-caption text-[10px] mt-1.5" style={{ color: 'var(--subtle-foreground)' }}>
        Normal: {min}–{max} {biomarker.unit}
      </div>
    </motion.div>
  );
}
