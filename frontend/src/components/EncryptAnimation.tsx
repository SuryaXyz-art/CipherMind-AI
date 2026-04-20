/**
 * EncryptAnimation — High-end encryption visualization
 *
 * Shows a real-time animation of the FHE encryption process to
 * reduce user anxiety while their data is being encrypted locally.
 */

import React, { useEffect, useRef, useMemo } from 'react';

interface EncryptAnimationProps {
  isActive: boolean;
  progress: number;
  currentStep: string;
}

// Particle for the background grid
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
}

export function EncryptAnimation({ isActive, progress, currentStep }: EncryptAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);

  // Generate random hex segments for the "data stream" effect
  const hexSegments = useMemo(() => {
    return Array.from({ length: 12 }, () => {
      const bytes = new Uint8Array(4);
      crypto.getRandomValues(bytes);
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;

    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    // Initialize particles
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 80; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width / dpr,
          y: Math.random() * canvas.height / dpr,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.1,
          hue: Math.random() * 60 + 180, // Cyan to violet range
        });
      }
    }

    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    const animate = () => {
      timeRef.current += 0.016;
      ctx.clearRect(0, 0, w, h);

      // Background glow
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.4);
      gradient.addColorStop(0, `hsla(190, 100%, 50%, ${0.03 + progress * 0.0005})`);
      gradient.addColorStop(0.5, `hsla(270, 100%, 50%, ${0.02 + progress * 0.0003})`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Draw particles
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Pulse alpha based on progress
        const pulseAlpha = p.alpha * (0.5 + 0.5 * Math.sin(timeRef.current * 2 + p.hue));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${pulseAlpha})`;
        ctx.fill();
      });

      // Draw connection lines between close particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const dx = particlesRef.current[i].x - particlesRef.current[j].x;
          const dy = particlesRef.current[i].y - particlesRef.current[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y);
            ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y);
            ctx.strokeStyle = `hsla(200, 100%, 60%, ${(1 - dist / 80) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Center lock icon effect
      const centerX = w / 2;
      const centerY = h / 2;
      const lockRadius = 30 + progress * 0.3;

      // Outer ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, lockRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(190, 100%, 50%, ${0.3 + Math.sin(timeRef.current * 3) * 0.1})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Progress arc
      const progressAngle = (progress / 100) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, lockRadius, -Math.PI / 2, progressAngle);
      const arcGradient = ctx.createLinearGradient(
        centerX - lockRadius, centerY,
        centerX + lockRadius, centerY
      );
      arcGradient.addColorStop(0, 'hsl(190, 100%, 50%)');
      arcGradient.addColorStop(1, 'hsl(270, 100%, 70%)');
      ctx.strokeStyle = arcGradient;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner glow
      const innerGlow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, lockRadius * 0.7
      );
      innerGlow.addColorStop(0, `hsla(200, 100%, 60%, ${0.08 + progress * 0.001})`);
      innerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = innerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, lockRadius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, progress]);

  if (!isActive) return null;

  return (
    <div
      className="encrypt-anim-wrapper animate-fade-in"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '460px',
        margin: '0 auto',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '260px',
          borderRadius: 'var(--cm-radius-lg)',
          background: 'var(--cm-bg-secondary)',
          border: '1px solid var(--cm-border)',
        }}
      />

      {/* Status overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          background: 'linear-gradient(transparent, rgba(10,11,15,0.9))',
          borderRadius: '0 0 var(--cm-radius-lg) var(--cm-radius-lg)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ fontWeight: 600 }}>{currentStep}</span>
          <span className="text-xs font-mono" style={{ color: 'var(--cm-accent-1)' }}>
            {progress}%
          </span>
        </div>
        <div className="meter">
          <div
            className="meter-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Hex data stream */}
        <div
          className="font-mono text-xs"
          style={{
            marginTop: '8px',
            color: 'var(--cm-text-muted)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            opacity: progress > 0 && progress < 100 ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        >
          {hexSegments.slice(0, Math.ceil(progress / 10)).map((hex, i) => (
            <span key={i} style={{ marginRight: '8px', opacity: 0.5 + (i / hexSegments.length) * 0.5 }}>
              0x{hex}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
