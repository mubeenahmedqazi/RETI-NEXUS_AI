import type { Metadata } from 'next';
import LegalPage from '@/components/ui/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="August 2026">
      <p>
        Retinexus AI is a final year academic project built to demonstrate AI-assisted diabetic retinopathy
        screening. This page explains, plainly, what information the portal handles and how.
      </p>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>What we collect</h2>
        <p className="mt-2">
          When a doctor uses the portal, we store the account details they register with, the patient records
          they create (name, phone number, age, gender, contact details), the fundus images uploaded for analysis, and
          the AI-generated reports produced from those images. Patient accounts see only the data tied to their
          own record.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>How it&apos;s used</h2>
        <p className="mt-2">
          This data exists solely to run the screening pipeline and produce a report for the doctor and patient
          involved — nothing is used for advertising, sold to third parties, or shared outside the system without
          consent.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Where it&apos;s stored</h2>
        <p className="mt-2">
          Patient and report data live in our application database. Uploaded images are processed by our AI
          backend to generate the analysis images and report shown in the portal.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Your rights</h2>
        <p className="mt-2">
          Doctors can edit or remove the patient records they manage. Patients can request their data be
          reviewed or deleted by contacting the doctor or institution that created their account.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Context</h2>
        <p className="mt-2">
          This is a research and educational system built by students at COMSATS University Islamabad, Lahore
          Campus — not a commercial product, and not a substitute for a licensed clinician&apos;s judgment.
        </p>
      </section>
    </LegalPage>
  );
}
