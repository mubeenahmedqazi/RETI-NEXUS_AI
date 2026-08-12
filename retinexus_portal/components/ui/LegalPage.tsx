'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Logo from './Logo';
import Footer from '@/components/Common/Footer';

interface LegalPageProps {
  title: string;
  updated: string;
  children: React.ReactNode;
}

/** Shared shell for standalone content pages (Privacy, Terms, Cookies). */
export default function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm mb-8 hover:text-[var(--brand-secondary)] transition-colors" style={{ color: 'var(--muted-foreground)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Retinexus AI
        </Link>

        <Logo size={40} animated={false} withWordmark />

        <h1 className="text-3xl font-bold mt-8" style={{ color: 'var(--foreground)' }}>{title}</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--subtle-foreground)' }}>Last updated: {updated}</p>

        <div className="mt-8 space-y-6 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
