'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const FRAME_COUNT = 300;
const frameSrc = (i: number) => `/eye-sequence/frame-${String(i).padStart(3, '0')}.webp`;

const CAPTIONS = [
  { from: 0, to: 0.18, eyebrow: 'Inside the eye', title: 'A single retinal photograph holds the whole story.' },
  { from: 0.22, to: 0.44, eyebrow: 'Layer by layer', title: 'The retina sits at the very back of the eye — where blood vessels are easiest to examine, and earliest to show damage.' },
  { from: 0.48, to: 0.7, eyebrow: 'Through the iris', title: 'Diabetes silently weakens these vessels years before any symptoms appear.' },
  { from: 0.74, to: 1, eyebrow: 'Diabetic Retinopathy', title: 'Leaking vessels, hemorrhages, and fluid buildup — the damage RetiNexus AI is trained to catch in seconds.' },
];

/** Draws the given frame image into the canvas, letterboxed to fit like object-fit: contain. */
function drawFrame(canvas: HTMLCanvasElement, img: HTMLImageElement) {
  if (!img.complete || img.naturalWidth === 0) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (cssW === 0 || cssH === 0) return;
  if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, cssW, cssH);

  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = cssW / cssH;
  let dw: number;
  let dh: number;
  if (imgRatio > boxRatio) {
    dw = cssW;
    dh = cssW / imgRatio;
  } else {
    dh = cssH;
    dw = cssH * imgRatio;
  }
  ctx.drawImage(img, (cssW - dw) / 2, (cssH - dh) / 2, dw, dh);
}

/** Crossfade opacity for a caption active over [from, to], with a short ease in/out margin. */
function captionOpacity(progress: number, from: number, to: number) {
  const margin = Math.min(0.03, (to - from) / 3);
  if (progress < from || progress > to) return 0;
  if (progress < from + margin) return (progress - from) / margin;
  if (progress > to - margin) return (to - progress) / margin;
  return 1;
}

/**
 * Cinematic scroll-scrubbed sequence: a 3D eye model rotates apart, the camera
 * pushes through the iris, and settles on a fundus scan showing diabetic
 * retinopathy — pinned and scrubbed frame-by-frame via GSAP ScrollTrigger as
 * the visitor scrolls, like a product page video. Falls back to a single
 * static frame for prefers-reduced-motion.
 */
export default function EyeJourney() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railDotRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = frameSrc(i);
      if (i === 1) {
        img.onload = () => {
          setFirstFrameReady(true);
          if (canvasRef.current) drawFrame(canvasRef.current, img);
        };
      }
      imgs.push(img);
    }
    imagesRef.current = imgs;
  }, []);

  useEffect(() => {
    if (reducedMotion || !firstFrameReady || !sectionRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const renderFrame = (frame: number) => {
      const canvas = canvasRef.current;
      const img = imagesRef.current[Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(frame) - 1))];
      if (canvas && img) drawFrame(canvas, img);
    };

    const updateCaptions = (progress: number) => {
      CAPTIONS.forEach((c, i) => {
        const el = captionRefs.current[i];
        if (!el) return;
        const opacity = captionOpacity(progress, c.from, c.to);
        el.style.opacity = String(opacity);
        el.style.transform = `translateY(${16 * (1 - opacity)}px)`;
      });
    };

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * 4.5),
        pin: true,
        scrub: 0.5,
        onUpdate: (self) => {
          const progress = self.progress;
          renderFrame(1 + progress * (FRAME_COUNT - 1));
          updateCaptions(progress);
          if (railDotRef.current) railDotRef.current.style.top = `${progress * 100}%`;
          if (scrollHintRef.current) scrollHintRef.current.style.opacity = String(Math.max(0, 1 - progress / 0.05));
        },
      });

      renderFrame(1);
      updateCaptions(0);

      const onResize = () => {
        renderFrame(1 + trigger.progress * (FRAME_COUNT - 1));
      };
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, sectionRef);

    return () => ctx.revert();
  }, [firstFrameReady, reducedMotion]);

  if (reducedMotion) {
    return (
      <section className="relative py-20 px-6 bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
          <p className="mt-6 text-center text-sm text-white/60 max-w-xl mx-auto">
            Diabetic retinopathy develops deep inside the retina — RetiNexus AI reads a single fundus photo to catch it early.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="eye-journey" ref={sectionRef} className="relative bg-black h-screen w-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {!firstFrameReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {/* Legibility gradient so captions stay readable over the imagery */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/30 pointer-events-none" />

      {/* Scroll progress rail */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:block pointer-events-none">
        <div className="relative w-px h-32 bg-white/15">
          <div
            ref={railDotRef}
            className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,198,217,0.8)]"
            style={{ top: '0%' }}
          />
        </div>
      </div>

      <div ref={scrollHintRef} className="absolute inset-x-0 top-8 sm:top-10 text-center pointer-events-none">
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/50">Scroll to explore</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 px-6 pb-16 sm:pb-24">
        <div className="relative max-w-2xl mx-auto text-center min-h-[110px] sm:min-h-[96px]">
          {CAPTIONS.map((c, i) => (
            <div
              key={c.eyebrow}
              ref={(el) => {
                captionRefs.current[i] = el;
              }}
              className="absolute inset-x-0 bottom-0 px-6"
              style={{ opacity: 0, transform: 'translateY(16px)' }}
            >
              <span className="text-xs font-semibold tracking-wide uppercase text-cyan-400">{c.eyebrow}</span>
              <p className="mt-2 text-xl sm:text-2xl font-semibold leading-snug text-white">{c.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
