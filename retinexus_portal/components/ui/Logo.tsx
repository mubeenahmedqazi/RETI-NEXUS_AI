'use client';

import { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: number;
  animated?: boolean;
  withWordmark?: boolean;
  withTagline?: boolean;
  className?: string;
  wordmarkClassName?: string;
  /** Override for fixed-dark surfaces (e.g. the auth brand panel) that don't follow the light/dark theme. */
  wordmarkColor?: string;
  taglineColor?: string;
}

// Matches the reference CSS keyframes: mostly open, quick close/open near 82-92% of the 4.5s cycle.
const blinkTop = {
  animate: { y: ['-100%', '-100%', '0%', '-100%', '-100%'] },
  transition: { duration: 4.5, times: [0, 0.82, 0.88, 0.92, 1], repeat: Infinity, ease: 'easeInOut' as const },
};
const blinkBot = {
  animate: { y: ['100%', '100%', '0%', '100%', '100%'] },
  transition: { duration: 4.5, times: [0, 0.82, 0.88, 0.92, 1], repeat: Infinity, ease: 'easeInOut' as const },
};

const EYE_PATH =
  'M 108 500 C 108 340, 300 235, 500 235 C 700 235, 892 340, 892 500 C 892 660, 700 765, 500 765 C 300 765, 108 660, 108 500 Z';

/**
 * RetiNexus AI's animated retina-eye mark, in its full "framed lockup" form:
 * a rounded-rect card with a solid cyan boundary wrapping the eye and,
 * when shown, the wordmark/tagline in the same bordered area.
 */
export default function Logo({
  size = 44,
  animated = true,
  withWordmark = false,
  withTagline = false,
  className,
  wordmarkClassName,
  wordmarkColor,
  taglineColor,
}: LogoProps) {
  const rawId = useId().replace(/[:]/g, '');
  const id = (name: string) => `${name}-${rawId}`;

  // Proportions lifted from the reference lockup, with rounder corners and a bolder cyan border.
  const padY = size * 0.114;
  const padX = size * 0.167;
  const inset = Math.max(1, size * 0.04);
  const radius = size * 0.16;
  const borderW = Math.max(2.5, size * 0.05);
  const gap = size * 0.095;

  return (
    <div
      className={cn('inline-flex items-center relative', className)}
      style={{ padding: `${padY}px ${padX}px` }}
    >
      {/* .frame::before — rounded-rect cyan boundary wrapping the whole lockup */}
      <div
        className="absolute pointer-events-none"
        style={{ inset, borderRadius: radius, border: `${borderW}px solid #22C6D9`, opacity: 0.95 }}
      />

      <div className="flex items-center" style={{ gap }}>
        <div style={{ width: size, height: size }} className="flex-shrink-0">
          <svg viewBox="0 0 1000 1000" width="100%" height="100%">
            <defs>
              <linearGradient id={id('lid')} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C9CED3" />
                <stop offset="100%" stopColor="#8A919A" />
              </linearGradient>
              <clipPath id={id('eyeClip')}>
                <path d={EYE_PATH} />
              </clipPath>
              <clipPath id={id('lidClipTop')}>
                <rect x="90" y="220" width="820" height="280" />
              </clipPath>
              <clipPath id={id('lidClipBot')}>
                <rect x="90" y="500" width="820" height="280" />
              </clipPath>
            </defs>

            <g clipPath={`url(#${id('eyeClip')})`}>
              <image
                href="/logo.png"
                x="57"
                y="198"
                width="886"
                height="605"
                preserveAspectRatio="xMidYMid slice"
              />

              {animated && (
                <>
                  <motion.g clipPath={`url(#${id('lidClipTop')})`} animate={blinkTop.animate} transition={blinkTop.transition}>
                    <rect x="90" y="220" width="820" height="280" fill={`url(#${id('lid')})`} />
                    <rect x="90" y="493" width="820" height="5" fill="#20242A" opacity="0.45" />
                  </motion.g>
                  <motion.g clipPath={`url(#${id('lidClipBot')})`} animate={blinkBot.animate} transition={blinkBot.transition}>
                    <rect x="90" y="500" width="820" height="280" fill={`url(#${id('lid')})`} />
                    <rect x="90" y="502" width="820" height="5" fill="#20242A" opacity="0.35" />
                  </motion.g>
                </>
              )}
            </g>
          </svg>
        </div>

        {(withWordmark || withTagline) && (
          <div className="leading-tight" style={{ whiteSpace: 'nowrap' }}>
            {withWordmark && (
              <div
                className={cn('font-bold tracking-tight', wordmarkClassName)}
                style={{ color: wordmarkColor || 'var(--foreground)', fontSize: Math.max(13, size * 0.32), whiteSpace: 'nowrap' }}
              >
                RetiNexus<span style={{ color: '#22C6D9' }}> AI</span>
              </div>
            )}
            {withTagline && (
              <div
                className="font-medium"
                style={{ color: taglineColor || 'var(--subtle-foreground)', fontSize: Math.max(7, size * 0.09), letterSpacing: '0.16em', marginTop: 2, whiteSpace: 'nowrap' }}
              >
                MULTI ORGAN RISK ANALYSIS
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
