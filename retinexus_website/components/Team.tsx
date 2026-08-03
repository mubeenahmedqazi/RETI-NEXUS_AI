'use client';

import { motion } from 'framer-motion';
import { GraduationCap, Users, UserCheck } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const team = [
  { name: 'Mubeen Ahmed', role: 'Project Lead & Full-Stack Engineering' },
  { name: 'Abdullah Rasheed', role: 'AI / Model Engineering' },
  { name: 'Munaeem Ahmed', role: 'Systems & Clinical Pipeline' },
];

export default function Team() {
  return (
    <section id="team" className="py-24 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-5xl mx-auto text-center">
        <ScrollReveal>
          <span className="text-xs font-semibold tracking-wide uppercase text-[var(--brand-secondary)]">Team &amp; Credits</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            A Final Year Project by
          </h2>
          <p className="mt-3 flex items-center justify-center gap-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>
            <GraduationCap className="w-4 h-4 text-[var(--brand-secondary)]" /> COMSATS University Islamabad, Lahore Campus
          </p>
        </ScrollReveal>

        <div className="mt-10 grid sm:grid-cols-3 gap-5">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-6 backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br from-[var(--brand-secondary)]/15 to-[var(--brand-accent)]/15">
                <Users className="w-5 h-5 text-[var(--brand-secondary)]" />
              </div>
              <p className="font-semibold mt-3" style={{ color: 'var(--foreground)' }}>{member.name}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--subtle-foreground)' }}>{member.role}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 text-sm font-medium"
          style={{ color: 'var(--foreground)' }}
        >
          <UserCheck className="w-4 h-4 text-[var(--brand-accent)]" /> Supervised by Lect. Yella Mehroze
        </motion.div>
      </div>
    </section>
  );
}
