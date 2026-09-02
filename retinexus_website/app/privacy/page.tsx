import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import PageHero from '@/components/ui/PageHero';
import LegalContent from '@/components/ui/LegalContent';
import Footer from '@/components/Footer';

export const metadata: Metadata = { title: 'Privacy Policy | RetiNexus AI' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden">
      <Nav />
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="What this site and the clinical portal do with your information."
      />
      <LegalContent updated="August 2026">
        <p>
          RetiNexus AI is a final year academic project. This page covers both this presentation site and the
          clinical portal it links to.
        </p>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>This website</h2>
          <p className="mt-2">
            Browsing this site doesn&apos;t create an account or collect personal data. We don&apos;t run
            analytics or advertising trackers here.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>The clinical portal</h2>
          <p className="mt-2">
            When a doctor uses the portal, we store the account details they register with, the patient records
            they create, the fundus images uploaded for analysis, and the AI-generated reports produced from
            those images, solely to run the screening pipeline and produce a report for the doctor and patient
            involved. Nothing is sold or shared outside the system without consent.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Context</h2>
          <p className="mt-2">
            This is a research and educational system built by students at COMSATS University Islamabad, Lahore
            Campus, not a commercial product.
          </p>
        </section>
      </LegalContent>
      <Footer />
    </div>
  );
}
