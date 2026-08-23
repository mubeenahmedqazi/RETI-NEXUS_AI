import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import PageHero from '@/components/ui/PageHero';
import EyeJourney from '@/components/EyeJourney';
import DiabetesDeepDive from '@/components/DiabetesDeepDive';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'What is Diabetic Retinopathy? — Retinexus AI',
  description:
    'Diabetic retinopathy explained in depth: the global diabetes epidemic, why Pakistan has the world\'s highest prevalence rate, the five DR stages, and how diabetes damages the heart, kidneys and brain over time.',
};

export default function WhatIsDRPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden">
      <Nav />
      <PageHero
        eyebrow="Understanding the Condition"
        title="What is diabetic retinopathy and why does it matter this much?"
        titleColor="var(--brand-secondary)"
        description="A single retinal photograph can reveal damage that took years of high blood sugar to build up. Here's the full picture: how big this problem is, why Pakistan is at its center, and what it does to the body over time."
      />
      <EyeJourney />
      <DiabetesDeepDive />
      <Footer />
    </div>
  );
}
