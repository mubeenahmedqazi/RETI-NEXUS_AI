'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Swirling } from './Swirling';

const SIZE_MAP = {
  sm: 28,
  md: 48,
  lg: 80,
};

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

/** Retinexus AI's single canonical loading indicator: a swirling cyan ring. */
export default function Loader({ size = 'md', label, className }: LoaderProps) {
  const ring = SIZE_MAP[size];

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Swirling style={{ width: ring, height: ring, color: 'var(--brand-secondary)' }} />
      {label && (
        <motion.p
          className="text-sm font-medium"
          style={{ color: 'var(--muted-foreground)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}

/** Full-viewport centered variant for route/auth-gate loading states. */
export function FullScreenLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <Loader size="lg" label={label} />
    </div>
  );
}

/** Centered variant that fills its parent section (for in-page async content). */
export function SectionLoader({ label = 'Loading...', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center min-h-[320px]', className)}>
      <Loader size="md" label={label} />
    </div>
  );
}
