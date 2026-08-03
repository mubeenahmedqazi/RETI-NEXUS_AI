'use client';

import { MapPinned, Wallet, HeartPulse, TrendingUp } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import ScrollReveal from './ScrollReveal';

const impact = [
  { icon: MapPinned, title: 'Semi-Urban & Resource-Limited Reach', description: 'Designed to bring specialist-grade retinal screening to clinics without an on-site ophthalmologist.' },
  { icon: Wallet, title: 'Lower Screening Cost', description: 'A single fundus photograph replaces the need for expensive invasive baseline cardiac & renal work-ups.' },
  { icon: HeartPulse, title: 'Non-Invasive Early Warning', description: 'Flags diabetic retinopathy and systemic organ risk before symptoms appear — entirely from a retinal photo.' },
  { icon: TrendingUp, title: 'Longitudinal Risk Tracking', description: 'Every approved scan builds a patient timeline, so clinicians can see risk trends develop over time.' },
];

export default function Impact() {
  return (
    <section id="impact" className="py-24 px-6 border-t bg-[var(--muted)]/40" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto">
        <ScrollReveal className="max-w-2xl mb-14">
          <span className="text-xs font-semibold tracking-wide uppercase text-[var(--brand-secondary)]">Impact</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            Built for where specialist screening is hardest to reach
          </h2>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {impact.map((c, i) => (
            <GlassCard
              key={c.title}
              hover
              padding="lg"
              className="!bg-[var(--card)]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-[var(--brand-secondary)]/10 to-[var(--brand-accent)]/10">
                <c.icon className="w-5 h-5 text-[var(--brand-secondary)]" />
              </div>
              <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{c.title}</h3>
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{c.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
