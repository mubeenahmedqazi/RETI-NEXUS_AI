'use client';

import Link from 'next/link';
import { Bean, Eye, HeartPulse, Brain, Activity, ArrowRight } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const stages = [
  { name: 'No DR', color: '#10b981' },
  { name: 'Mild NPDR', color: '#84cc16' },
  { name: 'Moderate NPDR', color: '#f59e0b' },
  { name: 'Severe NPDR', color: '#f97316' },
  { name: 'PDR', color: '#ef4444' },
];

const systemicEffects = [
  { icon: Eye, label: 'Eyes' },
  { icon: HeartPulse, label: 'Heart' },
  { icon: Bean, label: 'Kidneys' },
  { icon: Brain, label: 'Nerves' },
];

export default function WhatIsDR() {
  return (
    <section className="py-24 px-6 border-t bg-[var(--muted)]/40" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="max-w-3xl">
          <span className="text-xs font-semibold tracking-wide uppercase text-[var(--brand-secondary)]">Understanding the Condition</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight" style={{ color: 'var(--foreground)' }}>
            What is diabetic retinopathy?
          </h2>
          <p className="mt-4 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Diabetic retinopathy is damage to the blood vessels of the retina caused by consistently high blood
            sugar. Over time, those vessels weaken, leak fluid, or close off entirely, and the eye tries to grow
            new, fragile vessels to compensate: the stage most likely to cause serious vision loss. It develops
            gradually, in five recognized stages, almost always without pain and often without any noticeable
            change in vision until the damage is advanced.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="mt-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {stages.map((s, i) => (
              <div key={s.name} className="flex items-center flex-shrink-0">
                <span
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap"
                  style={{ borderColor: `${s.color}55`, color: s.color, background: `${s.color}14` }}
                >
                  {s.name}
                </span>
                {i < stages.length - 1 && (
                  <div className="w-5 sm:w-8 h-px flex-shrink-0" style={{ background: 'var(--border)' }} />
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.18} className="mt-10">
          <div className="rounded-2xl p-6 sm:p-8 backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
            <div className="flex items-start gap-3">
              <Activity className="w-6 h-6 text-[var(--brand-secondary)] flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed" style={{ color: 'var(--foreground)' }}>
                Diabetes itself is one of the fastest-growing health challenges in the world, affecting hundreds
                of millions of people, a number that keeps climbing every year. Left unmanaged, it doesn&apos;t
                just threaten eyesight. The same high blood sugar that damages retinal vessels damages small
                blood vessels everywhere else in the body, which is why diabetic retinopathy is so often an early,
                visible signal of risk building up elsewhere.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t flex flex-wrap items-center justify-center gap-x-8 gap-y-4" style={{ borderColor: 'var(--border)' }}>
              {systemicEffects.map((e) => (
                <div key={e.label} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[var(--brand-secondary)]/10 to-[var(--brand-accent)]/10">
                    <e.icon className="w-4 h-4 text-[var(--brand-accent)]" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{e.label}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3} className="mt-10">
          <Link
            href="/what-is-dr"
            className="hover-wobble group inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)] shadow-lg shadow-cyan-500/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-cyan-500/30"
          >
            See the full picture: global impact, Pakistan &amp; your body
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
