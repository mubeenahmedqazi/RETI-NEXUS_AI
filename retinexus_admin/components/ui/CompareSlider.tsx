'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MoveHorizontal } from 'lucide-react';

export default function CompareSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Original',
  afterLabel = 'AI Overlay',
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateFromClientX = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square rounded-xl overflow-hidden select-none cursor-ew-resize surface"
      onMouseDown={(e) => { dragging.current = true; updateFromClientX(e.clientX); }}
      onMouseMove={(e) => { if (dragging.current) updateFromClientX(e.clientX); }}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchStart={(e) => updateFromClientX(e.touches[0].clientX)}
      onTouchMove={(e) => updateFromClientX(e.touches[0].clientX)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={beforeSrc} alt={beforeLabel} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterSrc} alt={afterLabel} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      </div>

      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.2)]" style={{ left: `${position}%` }}>
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
        >
          <MoveHorizontal className="w-4 h-4 text-slate-700" />
        </motion.div>
      </div>

      <span className="absolute top-2 left-2 text-[10px] font-medium px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">{beforeLabel}</span>
      <span className="absolute top-2 right-2 text-[10px] font-medium px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">{afterLabel}</span>
    </div>
  );
}
