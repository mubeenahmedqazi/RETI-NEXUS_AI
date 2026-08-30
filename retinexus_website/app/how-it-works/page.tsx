import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import PageHero from '@/components/ui/PageHero';
import Pipeline from '@/components/Pipeline';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'How It Works | Retinexus AI',
  description:
    'The five-stage AI pipeline that turns a raw fundus photograph into a graded, explainable clinical report.',
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden">
      <Nav />
      <PageHero
        eyebrow="How It Works"
        title="How does RetiNexus AI actually work?"
        titleColor="var(--brand-secondary)"
        description="From the moment a fundus camera captures a retinal photo to a signed clinical report: five connected, independently auditable stages, not one black box."
        backgroundVideo="/Medical_AI_vascular_scan_sequence_202608110340.mp4"
      />
      <Pipeline />
      <Footer />
    </div>
  );
}
