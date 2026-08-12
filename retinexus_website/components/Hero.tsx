'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, CheckCircle2, Microscope, Stethoscope, UserCircle } from 'lucide-react';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import ParallaxField from './ParallaxField';
import ScrollReveal from './ScrollReveal';
import { PORTAL_LOGIN_URL } from '@/lib/portal';

const stats = [
  { value: 98.4, suffix: '%', label: 'Model sensitivity', decimals: 1 },
  { value: 5, suffix: '-stage', label: 'DR severity grading', decimals: 0 },
  { value: 12, suffix: 's', label: 'Avg. analysis time', decimals: 0 },
  { value: 9, suffix: '+', label: 'Biomarkers extracted', decimals: 0 },
];

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    video.muted = true;
    video.defaultMuted = true;

    const start = () => {
      video.playbackRate = 0.5;
      if (!mq.matches) video.play().catch(() => {});
    };

    if (video.readyState >= 2) start();
    else video.addEventListener('loadeddata', start, { once: true });

    return () => video.removeEventListener('loadeddata', start);
  }, []);

  return (
    <section className="relative z-0 isolate pt-44 sm:pt-48 pb-24 px-6 overflow-hidden min-h-[92vh] flex items-center">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-55 dark:opacity-45"
          src="/medical-neural-loop.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          tabIndex={-1}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-[var(--background)]/40 to-[var(--background)]" />
      </div>

      <div className="absolute inset-0 z-[1]">
        <ParallaxField />
        <div className="absolute inset-0 bg-dot-grid opacity-40 pointer-events-none" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <ScrollReveal>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]" style={{ color: 'var(--foreground)' }}>
                One retinal photo.
                <span className="block text-gradient-brand">A window into whole-body risk.</span>
              </h1>
              <p className="mt-6 text-lg max-w-xl leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                Retinexus AI reads the retina&apos;s microvasculature to screen for diabetic retinopathy
                and early signals of cardiac &amp; renal risk — instantly, non-invasively, from a single fundus photograph.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--subtle-foreground)' }}>
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
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  <img
                    src="/Eyeball.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <motion.div
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                    animate={{ top: ['5%', '95%', '5%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
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
