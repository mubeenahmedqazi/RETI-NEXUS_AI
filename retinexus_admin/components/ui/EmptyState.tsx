'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface rounded-2xl p-12 text-center flex flex-col items-center"
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-[var(--brand-secondary)]/10 to-[var(--brand-accent)]/10">
        <Icon className="w-8 h-8 text-[var(--brand-secondary)]" />
      </div>
      <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h3>
      {description && (
        <p className="text-sm mt-1 max-w-sm" style={{ color: 'var(--muted-foreground)' }}>{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
