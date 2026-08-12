import Nav from './components/Nav';
import Hero from './components/Hero';
import WhatIsDR from './components/WhatIsDR';
import WhyItMatters from './components/WhyItMatters';
import Footer from './components/Footer';

/**
 * RetiNexus AI presentation / marketing portal.
 * Isolated under retinexus_website/ (components, sections) and mounted at
 * both "/" and "/website" by thin route files in app/.
 * The cinematic 3D eye scroll sequence (EyeJourney) now lives on the
 * dedicated /what-is-dr page instead of here.
 */
export default function RetinexusWebsite() {
  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden">
      <Nav />
      <Hero />
      <WhatIsDR />
      <WhyItMatters />
      <Footer />
    </div>
  );
}
