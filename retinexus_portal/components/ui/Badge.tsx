import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
  danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
  accent: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
};

export default function Badge({
  children,
  tone = 'neutral',
  icon,
  className,
  dot = false,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        toneClasses[tone],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {icon}
      {children}
    </span>
  );
}

export function gradeToTone(grade: string | undefined): BadgeTone {
  switch (grade) {
    case 'No DR': return 'success';
    case 'Mild NPDR': return 'warning';
    case 'Moderate NPDR': return 'warning';
    case 'Severe NPDR': return 'danger';
    case 'PDR': return 'danger';
    default: return 'neutral';
  }
}
