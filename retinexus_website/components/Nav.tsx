'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { PORTAL_LOGIN_URL } from '@/lib/portal';

const links = [
  { href: '/', label: 'Home' },
  { href: '/what-is-dr', label: 'What is DR?' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
];

export default function Nav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  // Hidden while the full-screen 3D eye scroll sequence (#eye-journey, on
  // /what-is-dr) is in view — the floating bar would otherwise sit on top of
  // that immersive moment. Reappears once scrolled past it. No-op on pages
  // without that section.
  const [hiddenForEyeJourney, setHiddenForEyeJourney] = useState(false);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));

  useEffect(() => {
    const target = document.getElementById('eye-journey');
    if (!target) {
      setHiddenForEyeJourney(false);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setHiddenForEyeJourney(entry.intersectionRatio > 0.5),
      { threshold: [0, 0.5, 1] }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <motion.header
      className="fixed top-0 inset-x-0 z-50"
      animate={{ y: hiddenForEyeJourney ? -120 : 0, opacity: hiddenForEyeJourney ? 0 : 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ pointerEvents: hiddenForEyeJourney ? 'none' : 'auto' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="rounded-2xl backdrop-blur-md bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-900/[0.06] dark:shadow-black/20">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link href="/" className="hover-wobble">
              <Logo size={44} withWordmark withTagline />
            </Link>

            <div className="hidden lg:flex items-center gap-1 text-sm font-medium">
              {links.map((l) => {
                const active = isActive(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="relative px-3.5 py-2 transition-colors duration-200 hover:text-[var(--brand-secondary)]"
                    style={{ color: active ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                  >
                    <span>{l.label}</span>
                    {active && (
                      <motion.span
                        layoutId="nav-active-underline"
                        className="absolute left-3.5 right-3.5 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center">
              <Link
                href={PORTAL_LOGIN_URL}
                className="hover-wobble inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)] shadow-lg shadow-cyan-500/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-cyan-500/30"
              >
                Launch Clinical Portal <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setIsOpen((v) => !v)}
                className="p-2 rounded-full hover:bg-[var(--muted)] transition-colors"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
              >
                {isOpen ? (
                  <X className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
                ) : (
                  <Menu className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
                )}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 rounded-3xl overflow-hidden backdrop-blur-md bg-white/90 dark:bg-slate-900/85 border border-slate-200/80 dark:border-white/10 shadow-xl lg:hidden"
            >
              <div className="px-6 py-4 flex flex-col gap-1">
                {links.map((l) => {
                  const active = isActive(l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setIsOpen(false)}
                      className="relative px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                      style={{ color: active ? 'var(--brand-secondary)' : 'var(--muted-foreground)' }}
                    >
                      {l.label}
                      {active && (
                        <span className="absolute left-3.5 bottom-1.5 h-[2px] w-6 rounded-full bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)]" />
                      )}
                    </Link>
                  );
                })}
                <div className="mt-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <Link
                    href={PORTAL_LOGIN_URL}
                    onClick={() => setIsOpen(false)}
                    className="hover-wobble inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)] shadow-lg shadow-cyan-500/20"
                  >
                    Launch Clinical Portal <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
