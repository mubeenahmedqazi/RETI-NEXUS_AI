'use client';

import { motion } from 'framer-motion';
import { Timer, HandHeart, MapPin } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const points = [
  { icon: Timer, title: 'Minutes, not weeks', desc: 'A result while the patient is still in the room, not a lab report they have to come back for.' },
  { icon: HandHeart, title: 'Nothing invasive', desc: 'No blood draw, no needles — just the same fundus photo already used to check for retinopathy.' },
  { icon: MapPin, title: 'Works without a specialist', desc: 'Any clinic with a fundus camera can run a screen, even without an ophthalmologist on site.' },
];

export default function WhyItMatters() {
  return (
    <section className="relative py-24 px-6 border-t overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full bg-[var(--brand-secondary)]/[0.05] blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative text-center">
        <ScrollReveal>
          <span className="text-xs font-semibold tracking-wide uppercase text-[var(--brand-secondary)]">Why It Matters</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight max-w-3xl mx-auto" style={{ color: 'var(--foreground)' }}>
            Diabetic retinopathy rarely announces itself until it&apos;s already done damage.
          </h2>
          <p className="mt-4 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            It tends to progress quietly, with no pain and no obvious symptoms, until the vision loss it causes
            is no longer reversible. Regular screening is what closes that gap — the problem is that regular
            screening is exactly what&apos;s hardest to get access to. That&apos;s the part we set out to fix.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid sm:grid-cols-3">
          {points.map((p, i) => (
            <div key={p.title} className={i > 0 ? 'sm:border-l' : ''} style={i > 0 ? { borderColor: 'var(--border)' } : undefined}>
              <ScrollReveal delay={i * 0.1}>
                <div className="flex flex-col items-center text-center px-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-[var(--brand-secondary)]/10 to-[var(--brand-accent)]/10"
                  >
                    <p.icon className="w-5 h-5 text-[var(--brand-secondary)]" />
                  </motion.div>
                  <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{p.title}</h3>
                  <p className="text-sm mt-1.5 leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--muted-foreground)' }}>{p.desc}</p>
                </div>
              </ScrollReveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
