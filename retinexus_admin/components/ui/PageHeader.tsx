'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 md:p-7 border',
        'bg-gradient-to-r from-[var(--brand-secondary)]/[0.07] via-[var(--brand-accent)]/[0.06] to-transparent',
        'border-[var(--brand-secondary)]/15',
        className
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[var(--brand-accent)]/10 blur-3xl animate-float-slow" />
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {eyebrow && (
            <span className="text-xs font-semibold tracking-wide uppercase text-[var(--brand-secondary)]">
              {eyebrow}
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>
            {title}
          </h1>
          {description && (
            <p className="text-sm mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </motion.div>
  );
}
