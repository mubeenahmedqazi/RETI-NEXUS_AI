'use client';

import { ShieldCheck, Sparkles } from 'lucide-react';
import { Eye, HeartOrgan, Kidneys } from 'healthicons-react/outline';
import GlassCard from '@/components/ui/GlassCard';
import ScrollReveal from './ScrollReveal';

const organs = [
  { icon: Eye, title: 'Retina', desc: 'Vessel tortuosity, density & lesions read directly from the fundus image.' },
  { icon: HeartOrgan, title: 'Heart', desc: 'Vascular damage patterns shared with cardiovascular risk pathways.' },
  { icon: Kidneys, title: 'Kidneys', desc: 'Microvascular changes that often mirror early diabetic nephropathy.' },
  { icon: ShieldCheck, title: 'Early Warning', desc: 'Non-invasive, low-cost, and fast enough for routine screening.' },
];

const badges = [
  { icon: Eye, label: 'Diabetic Retinopathy' },
  { icon: HeartOrgan, label: 'Cardiac Risk Signal' },
  { icon: Kidneys, label: 'Renal Risk Signal' },
];

export default function About() {
  return (
    <>
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <ScrollReveal direction="left">
            <span className="text-xs font-semibold tracking-wide uppercase text-[var(--brand-secondary)]">Our Vision</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight" style={{ color: 'var(--foreground)' }}>
              The retina is the only place the body lets you see its blood vessels directly.
            </h2>
            <p className="mt-4 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              Diabetes doesn&apos;t just damage the eye. It damages small blood vessels everywhere, including the
              heart and kidneys. Because retinal microvasculature is directly visible through a simple fundus
              photograph, it acts as a non-invasive window into that same systemic vascular damage.
            </p>
            <p className="mt-4 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              RetiNexus AI is built on that idea: instead of requiring expensive, invasive baseline cardiac or
              renal work-ups, a single retinal scan can surface early diabetic retinopathy findings alongside
              early-warning signals for cardiovascular and kidney risk, putting a meaningful first screen within
              reach of any clinic with a fundus camera.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10"
                  style={{ color: 'var(--foreground)' }}
                >
                  <b.icon className="w-6 h-6 text-[var(--brand-secondary)]" /> {b.label}
                </span>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[var(--brand-secondary)]/15 to-[var(--brand-accent)]/15 blur-2xl" />
            <div className="relative overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-2xl">
              <img
                src="/camera-image-optimized.webp"
                alt="Fundus camera used to capture retinal photographs for screening"
                className="w-full h-full object-cover aspect-[4/5]"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-16 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="max-w-2xl mb-10">
            <span className="text-xs font-semibold tracking-wide uppercase text-[var(--brand-secondary)]">What One Scan Can Tell Us</span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
              One photograph, four signals
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {organs.map((c, i) => (
              <GlassCard
                key={c.title}
                hover
                padding="lg"
                className="!bg-[var(--card)]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <c.icon className="w-9 h-9 text-[var(--brand-accent)] mb-3" />
                <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{c.title}</h3>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{c.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
              Why we started with the eye
            </h2>
            <p className="mt-4 leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
              Most screening tools ask a patient to give something up: blood, time, money, or a trip to a
              specialist clinic. A fundus photograph asks for none of that. It takes seconds, it&apos;s painless,
              and the same image a doctor uses to check for diabetic retinopathy already contains the vascular
              detail an AI model needs to flag broader systemic risk. We built RetiNexus AI to make that second
              read automatic, so a routine eye scan can quietly do more work for the patient than it ever did
              before.
            </p>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
