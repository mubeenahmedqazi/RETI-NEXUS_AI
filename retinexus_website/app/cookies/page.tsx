import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import PageHero from '@/components/ui/PageHero';
import LegalContent from '@/components/ui/LegalContent';
import Footer from '@/components/Footer';

export const metadata: Metadata = { title: 'Cookies Policy | RetiNexus AI' };

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden">
      <Nav />
      <PageHero
        eyebrow="Legal"
        title="Cookies Policy"
        description="What we store in your browser, and why it's very little."
      />
      <LegalContent updated="August 2026">
        <section>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>This website</h2>
          <p className="mt-2">
            This presentation site only saves your light/dark theme preference in your browser&apos;s local
            storage. No advertising or third-party tracking cookies are used.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>The clinical portal</h2>
          <p className="mt-2">
            The portal uses a secure session cookie to keep doctors and patients signed in, required for the
            portal to function and removed on logout. It also remembers your theme preference the same way.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Nothing else</h2>
          <p className="mt-2">
            No analytics, no advertising, no third-party tracking anywhere in this project.
          </p>
        </section>
      </LegalContent>
      <Footer />
    </div>
  );
}
