'use client';

import { motion } from 'framer-motion';
import {
  Globe2,
  TrendingUp,
  Clock,
  MapPin,
  AlertTriangle,
  Eye,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { Eye as OrganEye, HeartOrgan, Kidneys, Neurology } from 'healthicons-react/outline';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import GlassCard from '@/components/ui/GlassCard';
import ScrollReveal from './ScrollReveal';

/* ── Section 1: the global burden ─────────────────────────────────────── */

const globalStats: { value: number; prefix: string; suffix: string; label: string; decimals: number }[] = [
  { value: 537, prefix: '', suffix: 'M+', label: 'Adults living with diabetes worldwide', decimals: 0 },
  { value: 10, prefix: '1 in ', suffix: '', label: 'Adults worldwide affected', decimals: 0 },
  { value: 783, prefix: '', suffix: 'M', label: 'Projected cases by 2045', decimals: 0 },
  { value: 6.7, prefix: '', suffix: 'M', label: 'Deaths linked to diabetes every year', decimals: 1 },
];

function GlobalBurden() {
  return (
    <section className="py-24 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto">
        <ScrollReveal className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-[var(--brand-secondary)]">
            <Globe2 className="w-3.5 h-3.5" /> The Global Picture
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight" style={{ color: 'var(--foreground)' }}>
            Diabetes is spreading faster than almost any other chronic disease.
          </h2>
          <p className="mt-4 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            According to the International Diabetes Federation&apos;s Diabetes Atlas, more than{' '}
            <strong style={{ color: 'var(--foreground)' }}>537 million adults</strong> were living with diabetes
            globally as of the most recent global estimate: roughly one in every ten adults on the planet. That
            number isn&apos;t plateauing. It has nearly quadrupled since 2000, and current projections put it at
            over 780 million by 2045, driven by aging populations, rising obesity, and urban lifestyle shifts that
            are hitting low- and middle-income countries hardest, precisely where access to specialist screening
            is weakest.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-5">
          {globalStats.map((s, i) => (
            <ScrollReveal key={s.label} delay={0.1 + i * 0.06}>
              <GlassCard padding="lg" hover className="h-full !bg-[var(--card)]">
                <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                  <AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
                </p>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  {s.label}
                </p>
              </GlassCard>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.3} className="mt-6">
          <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>
            Source: International Diabetes Federation, Diabetes Atlas. Figures are the most recent published
            global estimates and continue to be revised upward with each edition.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ── Section 2: Pakistan spotlight ────────────────────────────────────── */

function PakistanSpotlight() {
  return (
    <section className="relative py-24 px-6 border-t overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--brand-secondary)]/[0.06] via-transparent to-transparent" />
      <div className="absolute -top-24 right-0 w-96 h-96 rounded-full bg-[var(--brand-secondary)]/10 blur-3xl animate-blob pointer-events-none" />

      <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-14 items-center">
        <ScrollReveal direction="left" className="lg:col-span-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-[var(--brand-danger)]">
            <MapPin className="w-3.5 h-3.5" /> Pakistan
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight" style={{ color: 'var(--foreground)' }}>
            Pakistan has the highest diabetes prevalence rate of any country in the world.
          </h2>
          <p className="mt-4 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Per the IDF Diabetes Atlas, roughly <strong style={{ color: 'var(--foreground)' }}>three in every ten
            Pakistani adults</strong> are living with diabetes, the highest national prevalence rate recorded
            anywhere, ahead of every other country the Atlas tracks. That places tens of millions of people in
            Pakistan on a trajectory toward the same downstream complications this page describes: retinopathy,
            heart disease, kidney failure, and stroke.
          </p>
          <p className="mt-4 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            The scale of the problem is also a scale of missed screening. Ophthalmologists and specialist diabetes
            clinics are concentrated in a handful of major cities, while the disease itself is everywhere:
            urban and rural alike. It&apos;s exactly this gap that a low-cost, camera-based screening tool is
            positioned to close: any clinic with a fundus camera can screen, without waiting for a specialist
            referral.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10" style={{ color: 'var(--foreground)' }}>
              <AlertTriangle className="w-4 h-4 text-[var(--brand-danger)]" /> #1 globally by prevalence
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10" style={{ color: 'var(--foreground)' }}>
              <Activity className="w-4 h-4 text-[var(--brand-secondary)]" /> ~30% adult prevalence
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="right" className="relative lg:col-span-2">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[var(--brand-danger)]/15 to-[var(--brand-secondary)]/15 blur-2xl" />
          {/* Fills its full grid column (w-full, no max-width cap) at a 387:258 ratio, rather
              than being capped to a small fixed box that leaves the rest of the column empty. */}
          <div className="relative w-full aspect-[387/258] overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-2xl">
            <img
              src="/examination.jfif"
              alt="Clinical eye examination: the kind of routine check that can catch diabetic retinopathy early"
              className="w-full h-full object-cover"
            />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ── Section 3: DR explainer + stages (deep version) ──────────────────── */

const stages = [
  { name: 'No DR', color: '#10b981', desc: 'Vessels appear normal. Regular screening is what keeps it this way.' },
  { name: 'Mild NPDR', color: '#84cc16', desc: 'The earliest visible sign: small bulges (microaneurysms) in retinal vessel walls.' },
  { name: 'Moderate NPDR', color: '#f59e0b', desc: 'More vessels are blocked, starving parts of the retina of blood.' },
  { name: 'Severe NPDR', color: '#f97316', desc: 'Widespread blockage signals the retina to grow new vessels, a critical warning stage.' },
  { name: 'PDR', color: '#ef4444', desc: 'Fragile new vessels grow and bleed, the leading cause of vision loss from diabetes.' },
];

function DRStages() {
  return (
    <section className="py-24 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-[var(--brand-secondary)]">
            <Eye className="w-3.5 h-3.5" /> The Condition, Stage by Stage
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight" style={{ color: 'var(--foreground)' }}>
            Five stages, almost always silent until it&apos;s late.
          </h2>
          <p className="mt-4 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Diabetic retinopathy is damage to the tiny blood vessels feeding the retina, caused by years of
            elevated blood sugar. It rarely causes pain or noticeable vision change in its early, most treatable
            stages. That is exactly why routine screening (not waiting for symptoms) is the only reliable way
            to catch it in time.
          </p>
        </ScrollReveal>

        <div className="mt-10 space-y-4">
          {stages.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-5 rounded-2xl p-5 backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10"
            >
              <div
                className="w-3 h-14 rounded-full flex-shrink-0"
                style={{ background: `linear-gradient(180deg, ${s.color}, ${s.color}55)` }}
              />
              <div>
                <p className="font-semibold" style={{ color: s.color }}>
                  Stage {i}: {s.name}
                </p>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  {s.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section 4: organ-by-organ effects over time ──────────────────────── */

const timeline = [
  {
    years: 'Years 1 to 5',
    label: 'Silent onset',
    points: [
      { icon: OrganEye, organ: 'Eyes', text: 'Retinal microvasculature begins weakening, usually invisible without a fundus exam.' },
      { icon: HeartOrgan, organ: 'Heart', text: 'Blood vessels stiffen; cardiovascular risk starts climbing before any symptoms.' },
    ],
  },
  {
    years: 'Years 5 to 10',
    label: 'Measurable damage',
    points: [
      { icon: OrganEye, organ: 'Eyes', text: 'Microaneurysms and early haemorrhages become detectable: this is early-stage diabetic retinopathy.' },
      { icon: Kidneys, organ: 'Kidneys', text: 'Protein begins leaking into urine as filtering vessels in the kidneys sustain damage.' },
      { icon: Neurology, organ: 'Brain & Nerves', text: 'Peripheral neuropathy sets in; circulation to the brain’s small vessels is already affected.' },
    ],
  },
  {
    years: 'Years 10 to 15+',
    label: 'Advanced complications',
    points: [
      { icon: OrganEye, organ: 'Eyes', text: 'Proliferative retinopathy risks sudden, severe vision loss without intervention.' },
      { icon: HeartOrgan, organ: 'Heart', text: 'Risk of heart attack is 2 to 4 times higher than in someone without diabetes.' },
      { icon: Kidneys, organ: 'Kidneys', text: 'Diabetic nephropathy is the leading cause of kidney failure and dialysis worldwide.' },
      { icon: Neurology, organ: 'Brain', text: 'Stroke risk rises sharply, and vascular damage is linked to accelerated cognitive decline.' },
    ],
  },
];

function OrganTimeline() {
  return (
    <section className="py-24 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto">
        <ScrollReveal className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-[var(--brand-secondary)]">
            <Clock className="w-3.5 h-3.5" /> One Disease, Whole-Body Damage
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight" style={{ color: 'var(--foreground)' }}>
            How diabetes wears down the heart, kidneys, and brain over time.
          </h2>
          <p className="mt-4 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Diabetic retinopathy isn&apos;t an isolated eye problem. The same small blood vessels damaged in the
            retina run throughout the body, which is why the eye so often shows the earliest visible sign of
            damage building up elsewhere. This is the same logic behind RetiNexus AI&apos;s multi-organ risk
            indices: cardiovascular, renal, and cerebrovascular risk, read from one retinal photograph.
          </p>
        </ScrollReveal>

        <div className="mt-14 relative">
          <div
            className="hidden md:block absolute left-[7.5rem] top-2 bottom-2 w-px bg-gradient-to-b from-[var(--brand-secondary)] via-[var(--brand-accent)] to-[var(--brand-danger)] opacity-30"
          />
          <div className="space-y-10">
            {timeline.map((t, i) => (
              <motion.div
                key={t.years}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ delay: i * 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="md:grid md:grid-cols-[7.5rem_1fr] gap-8 items-start"
              >
                <div className="flex md:flex-col md:items-end items-center gap-2 md:gap-1 mb-4 md:mb-0 md:pr-6 md:text-right">
                  <span className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{t.years}</span>
                  <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>{t.label}</span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {t.points.map((p) => (
                    <div
                      key={p.organ + t.years}
                      className="rounded-xl p-4 border h-full"
                      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                    >
                      <p.icon className="w-7 h-7 text-[var(--brand-accent)] mb-2.5" />
                      <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{p.organ}</p>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{p.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <ScrollReveal delay={0.2} className="mt-12">
          <div className="rounded-2xl p-6 sm:p-8 flex items-start gap-4 backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
            <ShieldAlert className="w-6 h-6 text-[var(--brand-secondary)] flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed" style={{ color: 'var(--foreground)' }}>
              None of this is inevitable. Every complication on this timeline is dramatically less likely with
              early detection and managed blood sugar, which is why regular retinal screening, even before any
              symptoms appear, is one of the highest-leverage checks a person with diabetes can get.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ── Section 5: closing CTA ────────────────────────────────────────────── */

function DeepDiveCTA() {
  return (
    <section className="py-20 px-6 border-t text-center" style={{ borderColor: 'var(--border)' }}>
      <ScrollReveal className="max-w-2xl mx-auto">
        <TrendingUp className="w-8 h-8 text-[var(--brand-secondary)] mx-auto mb-4" />
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
          Curious how RetiNexus AI catches this from a single photo?
        </h2>
        <p className="mt-3 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          See the five-stage pipeline that turns a fundus image into a graded, explainable clinical report.
        </p>
        <motion.a
          href="/how-it-works"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="hover-wobble inline-flex items-center gap-1.5 mt-6 px-5 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)] shadow-lg shadow-cyan-500/20"
        >
          See How RetiNexus AI Works
        </motion.a>
      </ScrollReveal>
    </section>
  );
}

export default function DiabetesDeepDive() {
  return (
    <>
      <GlobalBurden />
      <PakistanSpotlight />
      <DRStages />
      <OrganTimeline />
      <DeepDiveCTA />
    </>
  );
}
