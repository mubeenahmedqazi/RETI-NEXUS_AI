'use client';

import { motion } from 'framer-motion';
import { SlidersHorizontal, Network, Crosshair, Gauge, GitMerge } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const pipeline = [
  {
    step: '01',
    icon: SlidersHorizontal,
    title: 'Quality Check & Preprocessing',
    description: 'Blur, brightness and field-of-view are validated before anything else runs — a poor image is rejected here rather than producing an unreliable result downstream. Accepted images are then enhanced with CLAHE for consistent contrast across different cameras and lighting conditions.',
  },
  {
    step: '02',
    icon: Network,
    title: 'Vessel Segmentation',
    description: 'A U-Net model trained on the DRIVE dataset traces the retinal vasculature pixel by pixel, producing a clean vessel map used to compute tortuosity, density and AV-ratio biomarkers — the same signals clinicians look for when assessing microvascular health.',
  },
  {
    step: '03',
    icon: Crosshair,
    title: 'Lesion Detection',
    description: 'A YOLOv8 detector scans the image for microaneurysms, haemorrhages and exudates, localizing each finding at the pixel level rather than just flagging the image as a whole — so the report can show exactly what was found and where.',
  },
  {
    step: '04',
    icon: Gauge,
    title: 'DR Grading & Multi-Task Organ Risk Prediction',
    description: 'An EfficientNet-B4 backbone jointly grades diabetic retinopathy severity on the standard 5-stage scale and, from the same vascular features, predicts early-warning risk signals for cardiovascular and renal health.',
  },
  {
    step: '05',
    icon: GitMerge,
    title: 'Confirmatory Fusion & Longitudinal Tracking',
    description: 'Every model’s output is fused into a single confidence-scored verdict rather than left as five disconnected numbers, and — once a doctor approves a scan — it’s added to that patient’s timeline so emerging trends are visible across visits, not just in one snapshot.',
  },
];

export default function Pipeline() {
  return (
    <>
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-14 items-center">
          <ScrollReveal direction="left" className="lg:col-span-2">
            <span className="text-xs font-semibold tracking-wide uppercase text-[var(--brand-secondary)]">The Pipeline</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight" style={{ color: 'var(--foreground)' }}>
              Five connected stages, one clinical verdict
            </h2>
            <p className="mt-4 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              Nothing here is a single black-box model. A raw fundus photograph passes through five purpose-built
              stages — quality control, vessel mapping, lesion localization, disease grading, and risk fusion —
              each one auditable on its own, before the final report is assembled.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="right" className="relative lg:col-span-3">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[var(--brand-secondary)]/15 to-[var(--brand-accent)]/15 blur-2xl" />
            <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-2xl">
              <img
                src="/process-image.jfif"
                alt="Retinal image moving through the Retinexus AI analysis pipeline"
                className="w-full h-full object-cover aspect-[16/10]"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-16 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            <motion.div
              className="hidden md:block absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-[var(--brand-secondary)] to-[var(--brand-accent)] opacity-30 origin-top"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            />
            <div className="space-y-6">
              {pipeline.map((w, i) => (
                <motion.div
                  key={w.step}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative flex gap-5 items-start"
                >
                  <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 flex-shrink-0 text-[var(--brand-secondary)]">
                    <w.icon className="w-5 h-5" />
                  </div>
                  <div className="rounded-2xl p-5 flex-1 backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-[var(--brand-accent)]">{w.step}</span>
                      <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{w.title}</h3>
                    </div>
                    <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{w.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
