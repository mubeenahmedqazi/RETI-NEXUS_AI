'use client';

import { motion } from 'framer-motion';
import { ScanEye } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZE_MAP = {
  sm: { ring: 22, mask: 3, icon: 10 },
  md: { ring: 44, mask: 5, icon: 18 },
  lg: { ring: 72, mask: 7, icon: 28 },
};

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

/** Retinexus AI's single canonical loading indicator: a rotating scan-ring with a pulsing focal point. */
export default function Loader({ size = 'md', label, className }: LoaderProps) {
  const { ring, mask, icon } = SIZE_MAP[size];

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative" style={{ width: ring, height: ring }}>
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, var(--brand-accent) 35%, var(--brand-secondary) 75%, transparent 100%)',
            WebkitMaskImage: `radial-gradient(farthest-side, transparent calc(100% - ${mask}px), #000 calc(100% - ${mask}px))`,
            maskImage: `radial-gradient(farthest-side, transparent calc(100% - ${mask}px), #000 calc(100% - ${mask}px))`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [0.85, 1, 0.85], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ScanEye style={{ width: icon, height: icon, color: 'var(--brand-secondary)' }} />
        </motion.div>
      </div>
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
