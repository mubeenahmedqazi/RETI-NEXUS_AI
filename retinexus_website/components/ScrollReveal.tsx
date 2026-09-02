'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
  /** Skips the scroll/viewport gate and plays on mount instead — for content that's
   * always above the fold (hero copy), where there's no scrolling for whileInView to
   * react to, and where a layout-shifting ancestor (e.g. a flex-centered container)
   * can make the one-shot intersection check fire before the layout has settled,
   * permanently missing the reveal since `viewport once: true` never re-checks. */
  immediate?: boolean;
}

/**
 * Sliding "curtain" reveal: content rises from behind a clipped mask as it
 * scrolls into view, rather than a plain fade — used for section headers and
 * hero copy across the presentation site.
 */
export default function ScrollReveal({ children, className, delay = 0, direction = 'up', immediate = false }: ScrollRevealProps) {
  const clipFrom =
    direction === 'up' ? 'inset(100% 0% 0% 0%)' : direction === 'left' ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)';
  const target = { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 };

  return (
    <motion.div
      initial={{ clipPath: clipFrom, opacity: 0 }}
      {...(immediate ? { animate: target } : { whileInView: target, viewport: { once: true, margin: '-10% 0px' } })}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
