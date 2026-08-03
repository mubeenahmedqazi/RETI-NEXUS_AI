'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Activity } from 'lucide-react';
import { PORTAL_LOGIN_URL, PORTAL_SIGNUP_URL } from '@/lib/portal';

export default function CTA() {
  return (
    <section className="py-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl p-12 text-center bg-[var(--brand-primary)]"
      >
        <div className="absolute inset-0 bg-dot-grid opacity-10" />
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[var(--brand-secondary)]/30 blur-3xl animate-blob" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-[var(--brand-accent)]/25 blur-3xl animate-blob" style={{ animationDelay: '2.5s' }} />
        <div className="relative">
          <Activity className="w-9 h-9 text-cyan-300 mx-auto mb-5" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to screen your first patient?</h2>
          <p className="text-white/60 mt-3 max-w-xl mx-auto">
            Launch the clinical portal and run your first AI-assisted retinal analysis in minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href={PORTAL_LOGIN_URL} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-[var(--brand-primary)] bg-white hover:scale-105 transition-transform">
              Launch Clinical Portal <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href={PORTAL_SIGNUP_URL} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-white border border-white/20 hover:bg-white/10 transition-colors">
              Create Free Account
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
