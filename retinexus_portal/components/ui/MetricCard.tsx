'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  iconTone?: string;
  trend?: { value: number; positive?: boolean };
  delay?: number;
  className?: string;
  footer?: ReactNode;
}


export default function MetricCard({
  label,
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  icon: Icon,
  iconTone = 'text-[var(--brand-secondary)] bg-[var(--brand-secondary)]/10',
  trend,
  delay = 0,
  className,
  footer,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3 }}
      className={cn('surface rounded-2xl p-5 transition-shadow hover:shadow-lg', className)}
    >
      <div className="flex items-center justify-between">
        <div className={cn('p-2.5 rounded-xl', iconTone)}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        {trend && (
          <span
            className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
              trend.positive ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
            )}
          >
            {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mt-4" style={{ color: 'var(--foreground)' }}>
        <AnimatedCounter value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </p>
      {footer}
    </motion.div>
  );
}
