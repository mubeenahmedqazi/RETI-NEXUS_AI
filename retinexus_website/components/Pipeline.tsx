'use client';

import { motion } from 'framer-motion';
import { SlidersHorizontal, Network, Crosshair, Gauge, GitMerge } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const pipeline = [
  {
    step: '01',
    icon: SlidersHorizontal,
    title: 'Quality Check & Preprocessing',
    description: 'Blur, brightness and field-of-view are validated, then images are enhanced with CLAHE for consistent contrast.',
  },
  {
    step: '02',
    icon: Network,
    title: 'Vessel Segmentation',
    description: 'A U-Net model trained on the DRIVE dataset maps the retinal vasculature for tortuosity, density and AV-ratio biomarkers.',
  },
  {
    step: '03',
    icon: Crosshair,
    title: 'Lesion Detection',
    description: 'A YOLOv8 detector localizes microaneurysms, haemorrhages and exudates at the pixel level.',
  },
  {
    step: '04',
    icon: Gauge,
    title: 'DR Grading & Multi-Task Organ Risk Prediction',
    description: 'An EfficientNet-B4 backbone jointly grades diabetic retinopathy severity and predicts systemic organ-risk signals.',
  },
  {
    step: '05',
    icon: GitMerge,
    title: 'Confirmatory Fusion & Longitudinal Tracking',
    description: 'Findings are fused into a single confidence-scored verdict and tracked across visits to flag emerging risk trends.',
  },
];

export default function Pipeline() {
  return (
    <section id="pipeline" className="py-24 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="max-w-2xl mb-14">
          <span className="text-xs font-semibold tracking-wide uppercase text-[var(--brand-secondary)]">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            The AI pipeline, step by step
          </h2>
          <p className="mt-3" style={{ color: 'var(--muted-foreground)' }}>
            Five connected stages transform a raw fundus photograph into a graded, explainable clinical verdict.
          </p>
        </ScrollReveal>

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
                  <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{w.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
