"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { COLOR_PALETTES } from "../constants/generatorPresets";
import { createPRNG, createNoiseCanvas } from "../utils/canvasMath";

interface HeroCompositionProps {
  onBack: () => void;
}

export const HeroComposition: React.FC<HeroCompositionProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const animTimeRef = useRef<number>(0);

  const palette = COLOR_PALETTES.blackWhite; // High-contrast sleek dark theme

  const renderHero = useCallback(
    (t: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const minDim = Math.min(w, h);
      const cx = w / 2;
      const cy = h / 2;
      const prng = createPRNG(42);

      // Dark background
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, w, h);

      // Turbulence Grid Lines
      const gridDensity = 32;
      const stepX = w / gridDensity;
      const stepY = h / gridDensity;

      ctx.strokeStyle = palette.detail;
      ctx.lineWidth = 0.5;

      for (let i = 0; i <= gridDensity; i++) {
        const posX = i * stepX;
        const posY = i * stepY;

        ctx.globalAlpha = i % 4 === 0 ? 0.15 : 0.05;

        // Vertical Grid Line with slight turbulence wave
        ctx.beginPath();
        for (let y = 0; y <= h; y += 40) {
          const waveX = posX + Math.sin(t * 0.5 + y * 0.01) * 3;
          if (y === 0) ctx.moveTo(waveX, y);
          else ctx.lineTo(waveX, y);
        }
        ctx.stroke();

        // Horizontal Grid Line
        ctx.beginPath();
        for (let x = 0; x <= w; x += 40) {
          const waveY = posY + Math.cos(t * 0.4 + x * 0.01) * 3;
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }

      // Generative Central Circle Mapping
      const circleCount = 12;
      for (let i = 0; i < circleCount; i++) {
        const rBase = minDim * 0.35 * Math.pow(0.78, i);
        const pulseR = rBase + Math.sin(t * 0.8 + i * 0.5) * 8;
        const angle = t * 0.15 * (i % 2 === 0 ? 1 : -1);

        ctx.globalAlpha = 0.4 + (1 - i / circleCount) * 0.5;
        ctx.strokeStyle = palette.stroke;
        ctx.lineWidth = i === 0 ? 1.5 : 1;

        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        // Orbiting Crosshair Node
        const orbX = cx + Math.cos(angle + i) * pulseR;
        const orbY = cy + Math.sin(angle + i) * pulseR;

        ctx.globalAlpha = 0.8;
        ctx.fillStyle = palette.stroke;
        ctx.beginPath();
        ctx.arc(orbX, orbY, Math.max(3, minDim * 0.004), 0, Math.PI * 2);
        ctx.fill();

        // Crosshair Lines around orb
        const cSize = 12;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(orbX - cSize, orbY);
        ctx.lineTo(orbX + cSize, orbY);
        ctx.moveTo(orbX, orbY - cSize);
        ctx.lineTo(orbX, orbY + cSize);
        ctx.stroke();

        // Label Metadata
        if (i < 6) {
          ctx.globalAlpha = 0.6;
          ctx.font = `9px "SF Mono", "Menlo", monospace`;
          ctx.fillText(`NODE_${i + 1} (${Math.round(orbX)},${Math.round(orbY)})`, orbX + 14, orbY + 3);
        }
      }

      // Title & Branding Text
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = palette.stroke;
      ctx.font = `700 ${Math.max(16, minDim * 0.02)}px "Telegraf", system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText("BRAND ASSET GENERATOR // HERO COMPOSITION", 40, h - 50);

      ctx.font = `10px "SF Mono", "Menlo", monospace`;
      ctx.globalAlpha = 0.4;
      ctx.fillText(`SYSTEM_STATUS: ACTIVE  |  FPS: 60  |  GRID: 32x32`, 40, h - 30);
    },
    [palette]
  );

  useEffect(() => {
    let active = true;
    const animate = () => {
      if (!active) return;
      animTimeRef.current += 0.016;
      renderHero(animTimeRef.current);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderHero]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
      <button
        onClick={onBack}
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          padding: "8px 16px",
          fontSize: 11,
          fontFamily: "'SF Mono', 'Menlo', monospace",
          background: "rgba(255, 255, 255, 0.1)",
          color: "#ffffff",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          cursor: "pointer",
          borderRadius: 0,
          zIndex: 10,
          backdropFilter: "blur(4px)"
        }}
      >
        ← Back to App
      </button>
    </div>
  );
};
