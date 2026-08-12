'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t px-6" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto py-14 flex flex-col items-center text-center">
        <p className="font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
          RetiNexus<span className="text-[#22C6D9]"> AI</span>
        </p>
        <p className="text-sm mt-3 leading-relaxed max-w-md" style={{ color: 'var(--muted-foreground)' }}>
          A multi-organ diabetic risk screening system, reading whole-body vascular health from a single
          retinal photograph.
        </p>
      </div>

      <div className="border-t py-6 flex flex-col items-center gap-3 text-center" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>
          © {new Date().getFullYear()} Retinexus AI — Final Year Project, COMSATS University Islamabad, Lahore Campus. For research & educational use.
        </p>
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--subtle-foreground)' }}>
          <Link href="/privacy" className="hover:text-[var(--brand-secondary)] hover:underline underline-offset-4 transition-colors duration-300">Privacy</Link>
          <Link href="/terms" className="hover:text-[var(--brand-secondary)] hover:underline underline-offset-4 transition-colors duration-300">Terms</Link>
          <Link href="/cookies" className="hover:text-[var(--brand-secondary)] hover:underline underline-offset-4 transition-colors duration-300">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
