'use client';

interface LegalContentProps {
  updated: string;
  children: React.ReactNode;
}

/** Prose wrapper for standalone legal pages (Privacy, Terms, Cookies). */
export default function LegalContent({ updated, children }: LegalContentProps) {
  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-sm" style={{ color: 'var(--subtle-foreground)' }}>Last updated: {updated}</p>
        <div className="mt-6 space-y-6 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          {children}
        </div>
      </div>
    </section>
  );
}
