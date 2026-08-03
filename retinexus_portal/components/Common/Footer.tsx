'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t mt-auto" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <motion.p className="text-sm" style={{ color: 'var(--muted-foreground)' }} whileHover={{ scale: 1.02 }}>
            © {currentYear} Retinexus AI. All Rights Reserved.
          </motion.p>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--subtle-foreground)' }}>
            <Link href="#privacy" className="hover:text-[var(--brand-secondary)] transition-colors duration-300">Privacy</Link>
            <Link href="#terms" className="hover:text-[var(--brand-secondary)] transition-colors duration-300">Terms</Link>
            <Link href="#cookies" className="hover:text-[var(--brand-secondary)] transition-colors duration-300">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
