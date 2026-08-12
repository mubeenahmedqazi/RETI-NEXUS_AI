import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import PageHero from '@/components/ui/PageHero';
import About from '@/components/About';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'About — Retinexus AI',
  description:
    'Why Retinexus AI screens for diabetic retinopathy and multi-organ risk from a single retinal photograph.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden">
      <Nav />
      <PageHero
        eyebrow="About & Vision"
        title="A retinal photo, read for more than the eye."
        description="Why we built a screening system that treats the retina as a window into whole-body vascular health."
        backgroundImage="/consultancy.png"
      />
      <About />
      <Footer />
    </div>
  );
}
