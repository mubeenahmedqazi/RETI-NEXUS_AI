'use client';

import { ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * Ambient background field of cyan glow orbs that drift at different speeds
 * as the page scrolls, giving the hero/section backgrounds real depth
 * instead of a static gradient.
 */
export default function ParallaxField({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const ySlow = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const yMed = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const yFast = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 25]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        style={{ y: ySlow }}
        className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-[var(--brand-secondary)]/10 blur-3xl animate-blob"
      />
      <motion.div
        style={{ y: yMed }}
        className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-[var(--brand-accent)]/10 blur-3xl animate-blob"
      />
      <motion.div
        style={{ y: yFast, rotate }}
        className="absolute top-1/2 right-10 w-48 h-48 rounded-full bg-[var(--brand-accent)]/8 blur-2xl"
      />
      {children}
    </div>
  );
}
