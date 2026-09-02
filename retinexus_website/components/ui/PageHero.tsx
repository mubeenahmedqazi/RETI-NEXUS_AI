'use client';

import { useEffect, useRef } from 'react';
import ScrollReveal from '@/components/ScrollReveal';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  /** Optional photo background (e.g. for About) — dot-grid/blobs still render on top. */
  backgroundImage?: string;
  /** Optional slow-motion looping video background (e.g. for How It Works) instead of a static photo. */
  backgroundVideo?: string;
  /** Overrides the title color (defaults to --foreground). */
  titleColor?: string;
}

/** Compact banner used at the top of standalone sub-pages (About, How It Works). */
export default function PageHero({ title, description, backgroundImage, backgroundVideo, titleColor }: PageHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    video.muted = true;
    video.defaultMuted = true;

    const start = () => {
      video.playbackRate = 0.45;
      if (!mq.matches) video.play().catch(() => {});
    };

    if (video.readyState >= 2) start();
    else video.addEventListener('loadeddata', start, { once: true });

    return () => video.removeEventListener('loadeddata', start);
  }, []);

  const isImmersive = Boolean(backgroundVideo || backgroundImage);

  return (
    <section
      className={`relative z-0 isolate px-6 overflow-hidden border-b ${isImmersive ? 'pt-52 sm:pt-56 pb-28 min-h-[70vh] sm:min-h-[85vh] flex items-center' : 'pt-44 sm:pt-48 pb-20'}`}
      style={{ borderColor: 'var(--border)' }}
    >
      {backgroundVideo && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover opacity-60 dark:opacity-50"
            src={backgroundVideo}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            tabIndex={-1}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-transparent to-[var(--background)]" />
        </div>
      )}
      {backgroundImage && (
        // Inset on all four sides (not full-bleed) so the photo reads as a card sitting
        // inside the section, clear of the fixed Nav pill above it — top-24/28 roughly
        // matches the Nav's own height + its top offset, bottom/sides match the section's
        // own px-6 so the margins are consistent all the way around. Sharp rectangle, not
        // rounded. The title/description live INSIDE this same box, anchored to its
        // bottom edge (a caption bar, not a floating card mid-photo).
        <div className="absolute inset-x-6 top-24 sm:top-28 bottom-2 sm:bottom-3 z-0 overflow-hidden border border-white/15">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${backgroundImage}')` }} />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 z-10 text-center px-6 py-8 sm:px-10 sm:py-10">
            <ScrollReveal immediate>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white">
                {title}
              </h1>
              <p className="mt-4 text-lg max-w-2xl mx-auto leading-relaxed text-white/80">
                {description}
              </p>
            </ScrollReveal>
          </div>
        </div>
      )}
      <div className="absolute inset-0 z-[1] bg-dot-grid opacity-60 pointer-events-none" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[var(--brand-secondary)]/[0.04] via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-32 -right-24 z-[1] w-96 h-96 rounded-full bg-[var(--brand-secondary)]/15 blur-3xl animate-blob pointer-events-none" />
      <div className="absolute -bottom-32 -left-24 z-[1] w-80 h-80 rounded-full bg-[var(--brand-accent)]/12 blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '3s' }} />

      {!backgroundImage && (
        // Covers both the plain (no video/image) case and the backgroundVideo case — only
        // backgroundImage gets the bottom-anchored caption treatment above; a video hero
        // (e.g. How It Works) keeps this original centered layout.
        <div className="max-w-4xl mx-auto relative z-10 text-center w-full">
          <ScrollReveal immediate>
            <div
              className={isImmersive ? 'px-6 py-8 sm:px-10 sm:py-10 backdrop-blur-md bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 shadow-2xl' : ''}
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight" style={{ color: titleColor || 'var(--foreground)' }}>
                {title}
              </h1>
              <p className="mt-4 text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                {description}
              </p>
            </div>
          </ScrollReveal>
        </div>
      )}
    </section>
  );
}
