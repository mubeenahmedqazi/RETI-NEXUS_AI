import type { Metadata } from 'next';
import LegalPage from '@/components/ui/LegalPage';

export const metadata: Metadata = { title: 'Cookies Policy' };

export default function CookiesPage() {
  return (
    <LegalPage title="Cookies Policy" updated="August 2026">
      <p>
        We keep cookie and local-storage use to the minimum needed to run the portal — there&apos;s no
        advertising or third-party tracking here.
      </p>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Session cookies</h2>
        <p className="mt-2">
          A secure session cookie keeps you signed in as a doctor or patient. It&apos;s required for the portal
          to function and is removed when you log out.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Local preferences</h2>
        <p className="mt-2">
          Your light/dark theme choice is saved in your browser&apos;s local storage so the portal remembers it
          on your next visit. This never leaves your device.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Nothing else</h2>
        <p className="mt-2">
          We don&apos;t use analytics, advertising, or third-party tracking cookies anywhere in the portal.
        </p>
      </section>
    </LegalPage>
  );
}
