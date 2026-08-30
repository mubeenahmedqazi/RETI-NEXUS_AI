'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, Activity } from 'lucide-react';
import Logo from '@/components/ui/Logo';

const highlights = [
  { icon: Users, text: 'Approve and manage doctor accounts' },
  { icon: ShieldCheck, text: 'Block access or reset credentials instantly' },
  { icon: Activity, text: 'Full visibility into every patient record' },
];

export default function AuthShell({
  children,
  eyebrow = 'RetiNexus Admin',
  title,
  subtitle,
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--background)]">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 bg-[var(--brand-primary)]">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.08]" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[var(--brand-secondary)]/25 blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-[var(--brand-accent)]/20 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 inline-flex">
          <Logo size={48} withWordmark withTagline wordmarkColor="#FFFFFF" taglineColor="rgba(103,232,249,0.7)" />
        </div>

        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Operational control for<br />the whole clinical network.
            </h2>
            <p className="text-white/50 mt-4 max-w-md leading-relaxed">
              Approve new doctors, manage credentials, and oversee every patient record
              across the platform from one place.
            </p>

            <div className="mt-10 space-y-4">
              {highlights.map((h, i) => (
                <motion.div
                  key={h.text}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.12 }}
                >
                  <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                    <h.icon className="w-4 h-4 text-cyan-300" />
                  </div>
                  <span className="text-sm text-white/70">{h.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 text-white/30 text-xs">Authorized personnel only</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10 py-12 relative">
        <div className="absolute inset-0 bg-dot-grid opacity-40 pointer-events-none lg:hidden" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <Logo size={48} withWordmark withTagline />
          </div>

          <div className="mb-7">
            <span className="text-xs font-semibold tracking-wide uppercase text-[var(--brand-secondary)]">{eyebrow}</span>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>{title}</h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--muted-foreground)' }}>{subtitle}</p>
          </div>

          <div className="surface rounded-2xl p-6 sm:p-8">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
