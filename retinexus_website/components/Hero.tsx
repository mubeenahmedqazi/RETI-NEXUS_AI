'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Eye, CheckCircle2, Microscope, Stethoscope, UserCircle } from 'lucide-react';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import ParallaxField from './ParallaxField';
import ScrollReveal from './ScrollReveal';
import { PORTAL_LOGIN_URL, PORTAL_SIGNUP_URL } from '@/lib/portal';

const stats = [
  { value: 98.4, suffix: '%', label: 'Model sensitivity', decimals: 1 },
  { value: 5, suffix: '-stage', label: 'DR severity grading', decimals: 0 },
  { value: 12, suffix: 's', label: 'Avg. analysis time', decimals: 0 },
  { value: 9, suffix: '+', label: 'Biomarkers extracted', decimals: 0 },
];

export default function Hero() {
  return (
    <section className="relative pt-20 pb-24 px-6 overflow-hidden min-h-[92vh] flex items-center">
      <ParallaxField />
      <div className="absolute inset-0 bg-dot-grid opacity-70 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative w-full">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <ScrollReveal>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--brand-secondary)]/10 text-[var(--brand-secondary)] border border-[var(--brand-secondary)]/20">
                <Sparkles className="w-3 h-3" /> A Multi-Organ Diabetic Risk Screening System
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mt-5 leading-[1.08]" style={{ color: 'var(--foreground)' }}>
                One retinal photo.
                <span className="block text-gradient-brand">A window into whole-body risk.</span>
              </h1>
              <p className="mt-6 text-lg max-w-xl leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                Retinexus AI reads the retina&apos;s microvasculature to screen for diabetic retinopathy
                and early signals of cardiac &amp; renal risk — instantly, non-invasively, from a single fundus photograph.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={PORTAL_LOGIN_URL}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-white bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)] shadow-xl shadow-cyan-500/25 hover:scale-105 transition-transform"
                >
                  Launch Clinical Portal <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={PORTAL_SIGNUP_URL}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 hover:bg-white transition-colors"
                  style={{ color: 'var(--foreground)' }}
                >
                  Create Free Account
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--subtle-foreground)' }}>
                <Link href={PORTAL_LOGIN_URL} className="inline-flex items-center gap-1.5 hover:text-[var(--brand-secondary)] transition-colors">
                  <Stethoscope className="w-3.5 h-3.5" /> Doctor Login
                </Link>
                <span className="opacity-40">•</span>
                <Link href={PORTAL_LOGIN_URL} className="inline-flex items-center gap-1.5 hover:text-[var(--brand-secondary)] transition-colors">
                  <UserCircle className="w-3.5 h-3.5" /> Patient Login
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
                    <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                      <AnimatedCounter value={s.value} suffix={s.suffix} decimals={s.decimals} />
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--subtle-foreground)' }}>{s.label}</p>
                  </motion.div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Visual: animated retina scan */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="relative mx-auto w-full max-w-md aspect-square">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--brand-secondary)]/20 to-[var(--brand-accent)]/20 blur-2xl animate-glow-pulse" />
              <div className="relative w-full h-full rounded-full backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 p-3 shadow-2xl">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-red-950 via-rose-900 to-amber-950">
                  <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full opacity-70">
                    <g stroke="#7f1d1d" strokeWidth="1.6" fill="none" opacity="0.8">
                      <path d="M100 100 C 70 70, 40 60, 20 40" />
                      <path d="M100 100 C 130 70, 160 60, 180 40" />
                      <path d="M100 100 C 70 130, 40 150, 15 165" />
                      <path d="M100 100 C 130 130, 165 150, 185 165" />
                      <path d="M100 100 C 100 60, 95 30, 90 5" />
                      <path d="M100 100 C 100 140, 108 170, 115 195" />
                    </g>
                  </svg>
                  <motion.div
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                    animate={{ top: ['5%', '95%', '5%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-amber-200/90 shadow-[0_0_40px_10px_rgba(251,191,36,0.4)]" />
                  </div>
                  {[
                    { top: '30%', left: '62%' },
                    { top: '68%', left: '35%' },
                    { top: '45%', left: '25%' },
                  ].map((pos, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-3 h-3 rounded-full border-2 border-cyan-300"
                      style={{ top: pos.top, left: pos.left }}
                      animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                    />
                  ))}
                </div>
              </div>

              <motion.div
                className="absolute -left-6 top-8 backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 animate-float"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              >
                <Eye className="w-4 h-4 text-[var(--brand-secondary)]" />
                <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>Grade: Mild NPDR</span>
              </motion.div>
              <motion.div
                className="absolute -right-4 bottom-10 backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 animate-float-slow"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>96.2% confidence</span>
              </motion.div>
              <motion.div
                className="absolute left-2 -bottom-4 backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 animate-float"
                style={{ animationDelay: '1.5s' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
              >
                <Microscope className="w-4 h-4 text-[var(--brand-accent)]" />
                <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>9 biomarkers</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
