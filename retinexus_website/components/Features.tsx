'use client';

import { ScanEye, Network, Brain, Gauge, HeartPulse, FileText } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import ScrollReveal from './ScrollReveal';

const features = [
  { icon: ScanEye, title: 'Lesion Detection', description: 'Pixel-level detection of microaneurysms, haemorrhages, hard & soft exudates.' },
  { icon: Network, title: 'Vessel Segmentation', description: 'Deep-learning vessel mapping for tortuosity, density and AV ratio biomarkers.' },
  { icon: Brain, title: 'Explainable AI', description: 'Grad-CAM heatmaps show exactly where the model is looking — full transparency.' },
  { icon: Gauge, title: 'Disease Grading', description: 'Automated 5-stage DR severity grading with calibrated confidence scores.' },
  { icon: HeartPulse, title: 'Multi-Organ Risk Signals', description: 'Retinal microvasculature is screened as an early proxy for cardiac & renal risk.' },
  { icon: FileText, title: 'Clinical Reports', description: 'Hospital-grade, exportable diagnostic reports ready for doctor review and sign-off.' },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 border-t bg-[var(--muted)]/40" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto">
        <ScrollReveal className="max-w-2xl mb-14">
          <span className="text-xs font-semibold tracking-wide uppercase text-[var(--brand-secondary)]">Platform</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            Everything a clinical AI screening pipeline needs
          </h2>
          <p className="mt-3" style={{ color: 'var(--muted-foreground)' }}>
            From raw fundus image to a signed clinical report — one connected pipeline.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <GlassCard
              key={f.title}
              hover
              padding="lg"
              className="!bg-[var(--card)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-[var(--brand-secondary)]/10 to-[var(--brand-accent)]/10">
                <f.icon className="w-5 h-5 text-[var(--brand-secondary)]" />
              </div>
              <h3 className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>{f.title}</h3>
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{f.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
