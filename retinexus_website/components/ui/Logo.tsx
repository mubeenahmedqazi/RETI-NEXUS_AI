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
              <radialGradient id={id('sclera')} cx="40%" cy="34%" r="85%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="55%" stopColor="#EDEFF1" />
                <stop offset="100%" stopColor="#C9CED3" />
              </radialGradient>
              <radialGradient id={id('iris')} cx="42%" cy="36%" r="68%">
                <stop offset="0%" stopColor="#C9CED3" />
                <stop offset="30%" stopColor="#8A919A" />
                <stop offset="72%" stopColor="#4B515A" />
                <stop offset="100%" stopColor="#20242A" />
              </radialGradient>
              <radialGradient id={id('pupil')} cx="38%" cy="32%" r="75%">
                <stop offset="0%" stopColor="#4A5058" />
                <stop offset="60%" stopColor="#20242A" />
                <stop offset="100%" stopColor="#0C0E11" />
              </radialGradient>
              <linearGradient id={id('lid')} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C9CED3" />
                <stop offset="100%" stopColor="#8A919A" />
              </linearGradient>
              <radialGradient id={id('corneaShade')} cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </radialGradient>
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
              <rect x="90" y="220" width="820" height="560" fill={`url(#${id('sclera')})`} />
              <ellipse cx="500" cy="720" rx="380" ry="90" fill="#8A919A" opacity="0.16" />
              <ellipse cx="500" cy="290" rx="360" ry="70" fill="#8A919A" opacity="0.12" />
              <circle cx="500" cy="500" r="205" fill={`url(#${id('iris')})`} />
              <circle cx="500" cy="500" r="205" fill="none" stroke="#22C6D9" strokeWidth="6" strokeOpacity="0.9" />
              <circle cx="500" cy="500" r="205" fill="none" stroke="#22C6D9" strokeWidth="14" strokeOpacity="0.18" />
              <circle cx="500" cy="500" r="222" fill="none" stroke="#22C6D9" strokeWidth="2" strokeOpacity="0.4" strokeDasharray="2 10" />
              <circle cx="500" cy="500" r="92" fill={`url(#${id('pupil')})`} />
              <ellipse cx="500" cy="500" rx="205" ry="205" fill={`url(#${id('corneaShade')})`} />
              <ellipse cx="435" cy="430" rx="46" ry="30" fill="#FFFFFF" opacity="0.95" transform="rotate(-20 435 430)" />
              <ellipse cx="470" cy="470" rx="18" ry="12" fill="#FFFFFF" opacity="0.55" transform="rotate(-20 470 470)" />
              <ellipse cx="580" cy="560" rx="14" ry="9" fill="#FFFFFF" opacity="0.3" />

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

            <path d={EYE_PATH} fill="none" stroke="#22C6D9" strokeWidth="10" strokeOpacity="0.95" />
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
