'use client';

import { Eye, HeartPulse, Droplets, ShieldCheck } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import ScrollReveal from './ScrollReveal';

const organs = [
  { icon: Eye, title: 'Retina', desc: 'Vessel tortuosity, density & lesions read directly from the fundus image.' },
  { icon: HeartPulse, title: 'Heart', desc: 'Vascular damage patterns shared with cardiovascular risk pathways.' },
  { icon: Droplets, title: 'Kidneys', desc: 'Microvascular changes that often mirror early diabetic nephropathy.' },
  { icon: ShieldCheck, title: 'Early Warning', desc: 'Non-invasive, low-cost, and fast enough for routine screening.' },
];

const badges = [
  { icon: Eye, label: 'Diabetic Retinopathy' },
  { icon: HeartPulse, label: 'Cardiac Risk Signal' },
  { icon: Droplets, label: 'Renal Risk Signal' },
];

export default function About() {
  return (
    <section id="about" className="py-24 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
        <ScrollReveal direction="left">
          <span className="text-xs font-semibold tracking-wide uppercase text-[var(--brand-secondary)]">About &amp; Vision</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight" style={{ color: 'var(--foreground)' }}>
            The retina is the only place the body lets you see its blood vessels directly.
          </h2>
          <p className="mt-4 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Diabetes doesn&apos;t just damage the eye — it damages small blood vessels everywhere, including the
            heart and kidneys. Because retinal microvasculature is directly visible through a simple fundus
            photograph, it acts as a non-invasive window into that same systemic vascular damage.
          </p>
          <p className="mt-4 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Retinexus AI is built on that idea: instead of requiring expensive, invasive baseline cardiac or
            renal work-ups, a single retinal scan can surface early diabetic retinopathy findings alongside
            early-warning signals for cardiovascular and kidney risk — putting a meaningful first screen within
            reach of any clinic with a fundus camera.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {badges.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10"
                style={{ color: 'var(--foreground)' }}
              >
                <b.icon className="w-4 h-4 text-[var(--brand-secondary)]" /> {b.label}
              </span>
            ))}
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 gap-4">
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
              <c.icon className="w-6 h-6 text-[var(--brand-accent)] mb-3" />
              <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{c.title}</h3>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{c.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
