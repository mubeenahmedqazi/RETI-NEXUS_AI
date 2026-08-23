'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Swirling } from './Swirling';

export interface TimelineStep {
  icon: LucideIcon;
  label: string;
  description?: string;
}

export default function Timeline({
  steps,
  currentStep,
  complete = false,
  orientation = 'vertical',
}: {
  steps: TimelineStep[];
  currentStep: number;
  complete?: boolean;
  orientation?: 'vertical' | 'horizontal';
}) {
  if (orientation === 'horizontal') {
    return (
      <div className="flex items-start w-full overflow-x-auto scrollbar-hide gap-1">
        {steps.map((step, i) => {
          const isDone = complete || i < currentStep;
          const isActive = !complete && i === currentStep;
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center flex-1 min-w-[110px]">
              <div className="flex flex-col items-center flex-1 text-center gap-2">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors',
                    isDone && 'bg-emerald-500 border-emerald-500 text-white',
                    isActive && 'border-[var(--brand-accent)] text-[var(--brand-accent)]',
                    !isDone && !isActive && 'border-[var(--border)] text-[var(--subtle-foreground)]'
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isActive ? (
                    <Swirling className="w-4 h-4" style={{ color: 'var(--brand-secondary)' }} />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className="text-[11px] font-medium leading-tight"
                  style={{ color: isActive ? 'var(--brand-accent)' : isDone ? '#10b981' : 'var(--subtle-foreground)' }}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('h-0.5 flex-1 mx-1 mt-[-20px]', isDone ? 'bg-emerald-500' : 'bg-[var(--border)]')} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const isActive = !complete && index === currentStep;
        const isCompleted = complete || index < currentStep;
        const Icon = step.icon;

        return (
          <motion.div
            key={step.label}
            className={cn(
              'flex items-start gap-4 p-4 rounded-xl border transition-all duration-300',
              isActive && 'bg-[var(--brand-accent)]/8 border-[var(--brand-accent)]/30',
              isCompleted && 'bg-emerald-500/8 border-emerald-500/25',
              !isActive && !isCompleted && 'bg-[var(--muted)] border-[var(--border)] opacity-60'
            )}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <div className="flex-shrink-0 mt-0.5">
              {isCompleted ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </motion.div>
              ) : isActive ? (
                <Swirling className="w-6 h-6" style={{ color: 'var(--brand-secondary)' }} />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-[var(--border-strong)] flex items-center justify-center">
                  <Icon className="w-3 h-3 text-[var(--subtle-foreground)]" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4
                className="font-medium text-sm"
                style={{ color: isActive ? 'var(--brand-accent)' : isCompleted ? '#10b981' : 'var(--muted-foreground)' }}
              >
                {step.label}
              </h4>
              {step.description && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--subtle-foreground)' }}>
                  {step.description}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
