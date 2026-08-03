'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const STAGES = ['No DR', 'Mild', 'Moderate', 'Severe', 'PDR'];

const STAGE_COLORS = ['#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];

export default function SeverityMeter({ gradeIndex, className }: { gradeIndex: number; className?: string }) {
  const clamped = Math.max(0, Math.min(STAGES.length - 1, gradeIndex));

  return (
    <div className={cn('w-full', className)}>
      <div className="flex w-full h-3 rounded-full overflow-hidden gap-1">
        {STAGES.map((stage, i) => (
          <motion.div
            key={stage}
            className="flex-1 rounded-full"
            style={{ background: i <= clamped ? STAGE_COLORS[i] : 'var(--muted)' }}
            initial={{ scaleY: 0.3, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {STAGES.map((stage, i) => (
          <span
            key={stage}
            className="text-[10px] md:text-xs font-medium"
            style={{ color: i === clamped ? STAGE_COLORS[i] : 'var(--subtle-foreground)' }}
          >
            {stage}
          </span>
        ))}
      </div>
    </div>
  );
}
