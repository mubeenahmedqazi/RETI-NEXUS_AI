'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Logo from '@/components/ui/Logo';
import { PORTAL_LOGIN_URL } from '@/lib/portal';

const links = [
  { href: '#about', label: 'About' },
  { href: '#pipeline', label: 'How It Works' },
  { href: '#impact', label: 'Impact' },
  { href: '#team', label: 'Team' },
];

export default function Nav() {
  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Logo size={48} withWordmark withTagline />

        <div className="hidden lg:flex items-center gap-7 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-[var(--brand-secondary)] transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href={PORTAL_LOGIN_URL}
            className="hidden sm:inline text-sm font-medium hover:text-[var(--brand-secondary)] transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Sign in
          </Link>
          <Link
            href={PORTAL_LOGIN_URL}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)] shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform"
          >
            Launch Clinical Portal <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
