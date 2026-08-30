'use client';

import { useEffect } from 'react';

// Assets used on secondary pages (not the entry page), warmed into the browser's HTTP
// cache after the current page is done with its own critical load — so navigating to
// them next feels instant instead of waiting on a fresh video/image fetch. next/link
// already prefetches each route's JS/RSC payload automatically; this fills the one gap
// that leaves — the actual media files those routes reference, which Next has no way to
// know about ahead of time since they're plain <video src>/<img src> strings.
const PREFETCH_ASSETS = ['/Medical_AI_vascular_scan_sequence_202608110340.mp4'];

/** Mounted once in the root layout. Fires after the browser is idle (or a short fallback
 * delay), so it never competes with the current page's own resources for bandwidth. */
export default function AssetPrefetcher() {
  useEffect(() => {
    const prefetch = () => {
      for (const href of PREFETCH_ASSETS) {
        if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) continue;
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = href.endsWith('.mp4') ? 'video' : 'fetch';
        link.href = href;
        document.head.appendChild(link);
      }
    };

    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const usingIdleCallback = Boolean(w.requestIdleCallback);
    const idleId = usingIdleCallback ? w.requestIdleCallback!(prefetch) : window.setTimeout(prefetch, 2500);

    return () => {
      if (usingIdleCallback) w.cancelIdleCallback?.(idleId as number);
      else window.clearTimeout(idleId as number);
    };
  }, []);

  return null;
}
