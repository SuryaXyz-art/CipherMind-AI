/**
 * PixelBackground — a subtle green "ciphertext rain" pixel effect behind the app.
 * Encryption-themed (falling 0/1 glyphs), performance-throttled, and disabled
 * for users who prefer reduced motion. Sits behind all content (pointer-events
 * none), so it never interferes with the UI.
 */

import { useEffect, useRef } from "react";

export function PixelBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const FONT = 14;
    let w = 0, h = 0, cols = 0;
    let drops: number[] = [];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      cols = Math.ceil(w / FONT);
      drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -40));
    };
    resize();
    window.addEventListener("resize", resize);

    const chars = "01";
    let raf = 0;
    let last = 0;

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 75) return; // ~13fps — gentle + cheap
      last = t;

      ctx.clearRect(0, 0, w, h);
      ctx.font = `${FONT}px var(--cm-font-mono, monospace)`;
      for (let i = 0; i < cols; i++) {
        const y = drops[i] * FONT;
        if (y > 0) {
          const ch = chars[(Math.random() * chars.length) | 0];
          // occasional bright "lead" glyph, otherwise soft green
          ctx.fillStyle = Math.random() > 0.97 ? "rgba(190,255,215,0.85)" : "rgba(34,197,94,0.45)";
          ctx.fillText(ch, i * FONT, y);
        }
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="pixel-bg" aria-hidden="true" />;
}
