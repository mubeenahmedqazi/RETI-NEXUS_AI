import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Features from './components/Features';
import Pipeline from './components/Pipeline';
import Impact from './components/Impact';
import Team from './components/Team';
import CTA from './components/CTA';
import Footer from './components/Footer';

/**
 * RetiNexus AI presentation / marketing portal.
 * Isolated under retinexus_website/ (components, sections) and mounted at
 * both "/" and "/website" by thin route files in app/.
 */
export default function RetinexusWebsite() {
  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden">
      <Nav />
      <Hero />
      <About />
      <Features />
      <Pipeline />
      <Impact />
      <Team />
      <CTA />
      <Footer />
    </div>
  );
}
