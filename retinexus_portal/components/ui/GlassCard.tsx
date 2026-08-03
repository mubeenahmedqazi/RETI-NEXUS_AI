'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  hover?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = false, glow = false, padding = 'md', children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'glass rounded-2xl relative',
          paddingMap[padding],
          hover &&
            'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-20px_hsl(var(--shadow-color)/0.4)] hover:border-[var(--brand-accent)]/30',
          glow && 'shadow-[0_0_40px_-8px_var(--brand-accent)]',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

export default GlassCard;
