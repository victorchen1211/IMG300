"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/page.module.scss";
import { COLOR_PALETTES, ColorPalette, EXPORT_SIZES, DimensionPreset } from "../constants/generatorPresets";
import { createPRNG, createNoiseCanvas } from "../utils/canvasMath";

export const YSGeoTool: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Geo Tool State
  const [geoMode, setGeoMode] = useState<string>("orbital");
  const [paletteKey, setPaletteKey] = useState<string>("whiteOnDark");
  const [selectedFormat, setSelectedFormat] = useState<string>("Portrait 3:4 (1200x1600)");
  const [motionType, setMotionType] = useState<string>("morph");
  const [animSpeed, setAnimSpeed] = useState<string>("medium");

  const [overlays, setOverlays] = useState({
    frame: true,
    hud: true,
    annotations: true,
    grain: true
  });

  const [bannerText, setBannerText] = useState<string>("");
  const [fontSize, setFontSize] = useState<number>(120);
  const [viewportDim, setViewportDim] = useState<{ w: number; h: number }>({ w: 800, h: 600 });
  const [noiseTexture, setNoiseTexture] = useState<HTMLCanvasElement | null>(null);

  // Control Parameters
  const [params, setParams] = useState({
    count: 8,
    strokeWeight: 1,
    scale: 0.8,
    drift: 3,
    tension: 3,
    seed: 42,
    detailDensity: 5,
    pointDensity: 100
  });

  const animTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const palette: ColorPalette = COLOR_PALETTES[paletteKey] || COLOR_PALETTES.whiteOnDark;
  const dimension: DimensionPreset = EXPORT_SIZES[selectedFormat] || EXPORT_SIZES["Portrait 3:4 (1200x1600)"];

  // Initialize Noise
  useEffect(() => {
    setNoiseTexture(createNoiseCanvas(512, 512, 0.12));
  }, []);

  // Resize Viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleResize = () => {
      setViewportDim({
        w: el.clientWidth - 80,
        h: el.clientHeight - 80
      });
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scaleW = viewportDim.w / dimension.w;
  const scaleH = viewportDim.h / dimension.h;
  const fitScale = Math.min(scaleW, scaleH);
  const displayW = Math.round(dimension.w * fitScale);
  const displayH = Math.round(dimension.h * fitScale);

  // Main Render Function for YS Geo
  const renderGeo = useCallback(
    (t: number = 0) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = dimension.w;
      canvas.height = dimension.h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = dimension.w;
      const h = dimension.h;
      const minDim = Math.min(w, h);
      const cx = w / 2;
      const cy = h / 2;
      const prng = createPRNG(params.seed);

      // Background
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, w, h);

      // Render Generative Modes
      if (geoMode === "orbital") {
        const count = Math.max(3, Math.floor(params.count));
        ctx.lineCap = "round";

        for (let i = 0; i < count; i++) {
          const rBase = minDim * params.scale * (0.1 + prng() * 0.35);
          const r = rBase + Math.sin(t * 0.5 + i) * params.drift * 10;
          const startAngle = prng() * Math.PI * 2 + (motionType === "morph" ? t * 0.1 * (i % 2 === 0 ? 1 : -1) : 0);
          const arcLength = Math.PI * (0.5 + prng() * 1.5);

          ctx.strokeStyle = palette.stroke;
          ctx.lineWidth = params.strokeWeight * (i % 2 === 0 ? 1 : 0.6);
          ctx.globalAlpha = 0.35 + prng() * 0.45;

          ctx.beginPath();
          ctx.arc(cx, cy, r, startAngle, startAngle + arcLength);
          ctx.stroke();

          // Node Marker Dot
          if (prng() > 0.4) {
            const dotX = cx + Math.cos(startAngle) * r;
            const dotY = cy + Math.sin(startAngle) * r;
            ctx.fillStyle = palette.stroke;
            ctx.beginPath();
            ctx.arc(dotX, dotY, Math.max(2.5, minDim * 0.004), 0, Math.PI * 2);
            ctx.fill();

            // Annotation Label
            if (overlays.annotations) {
              ctx.font = `${Math.max(8, minDim * 0.01)}px "SF Mono", "Menlo", monospace`;
              ctx.fillText(String.fromCharCode(65 + (i % 26)), dotX + 8, dotY + 4);
            }
          }
        }
      } else if (geoMode === "radial") {
        const count = Math.max(6, Math.floor(params.count * 2));
        ctx.strokeStyle = palette.stroke;
        ctx.lineWidth = params.strokeWeight;

        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 + (motionType === "morph" ? t * 0.05 : 0);
          const radius = minDim * params.scale * (0.2 + prng() * 0.4);
          const endX = cx + Math.cos(angle) * radius;
          const endY = cy + Math.sin(angle) * radius;

          ctx.globalAlpha = 0.2 + prng() * 0.6;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          if (overlays.annotations && i % 2 === 0) {
            ctx.fillStyle = palette.stroke;
            ctx.font = `${Math.max(8, minDim * 0.01)}px "SF Mono", "Menlo", monospace`;
            ctx.fillText(`${(angle * 57.29).toFixed(0)}°`, endX + 6, endY);
          }
        }
      } else if (geoMode === "arcs") {
        const count = Math.floor(params.count);
        for (let i = 0; i < count; i++) {
          const r = minDim * params.scale * (0.15 + (i / count) * 0.35);
          const offsetAngle = t * 0.2 * (i % 2 === 0 ? 1 : -1);

          ctx.strokeStyle = palette.stroke;
          ctx.lineWidth = params.strokeWeight * (1 + (i % 3) * 0.5);
          ctx.globalAlpha = 0.4 + (i / count) * 0.5;

          ctx.beginPath();
          ctx.arc(cx, cy, r, offsetAngle, offsetAngle + Math.PI * 1.2);
          ctx.stroke();
        }
      } else if (geoMode === "lissajous") {
        const count = Math.floor(params.count);
        ctx.strokeStyle = palette.stroke;
        ctx.lineWidth = params.strokeWeight;
        ctx.globalAlpha = 0.6;

        for (let k = 0; k < count; k++) {
          const a = 1 + Math.floor(prng() * params.tension);
          const b = 1 + Math.floor(prng() * params.tension);
          const phase = t * 0.3 + k;

          ctx.beginPath();
          for (let i = 0; i <= 300; i++) {
            const rad = (i / 300) * Math.PI * 2;
            const lx = cx + Math.sin(a * rad + phase) * minDim * params.scale * 0.35;
            const ly = cy + Math.sin(b * rad) * minDim * params.scale * 0.35;
            if (i === 0) ctx.moveTo(lx, ly);
            else ctx.lineTo(lx, ly);
          }
          ctx.stroke();
        }
      } else if (geoMode === "constellation") {
        const count = Math.max(6, Math.floor(params.count * 1.5));
        const pts: Array<{ x: number; y: number; label: string }> = [];

        for (let i = 0; i < count; i++) {
          const px = cx + (prng() - 0.5) * w * params.scale;
          const py = cy + (prng() - 0.5) * h * params.scale;
          pts.push({
            x: px + (motionType === "morph" ? Math.sin(t * 0.5 + i) * params.drift * 5 : 0),
            y: py + (motionType === "morph" ? Math.cos(t * 0.4 + i) * params.drift * 5 : 0),
            label: String.fromCharCode(65 + (i % 26))
          });
        }

        ctx.strokeStyle = palette.stroke;
        ctx.lineWidth = params.strokeWeight;

        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            const dist = Math.hypot(pts[j].x - pts[i].x, pts[j].y - pts[i].y);
            if (dist < minDim * params.scale * 0.4) {
              ctx.globalAlpha = Math.max(0.1, (1 - dist / (minDim * params.scale * 0.4)) * 0.6);
              ctx.beginPath();
              ctx.moveTo(pts[i].x, pts[i].y);
              ctx.lineTo(pts[j].x, pts[j].y);
              ctx.stroke();
            }
          }
        }

        pts.forEach((pt) => {
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = palette.stroke;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(3, minDim * 0.005), 0, Math.PI * 2);
          ctx.fill();

          if (overlays.annotations) {
            ctx.font = `${Math.max(8, minDim * 0.01)}px "SF Mono", "Menlo", monospace`;
            ctx.fillText(pt.label, pt.x + 6, pt.y - 4);
          }
        });
      }

      // Banner Typography Overlay
      if (bannerText.trim()) {
        const textHeight = (minDim / 1080) * fontSize;
        ctx.save();
        ctx.fillStyle = palette.stroke;
        ctx.globalAlpha = 0.85;
        ctx.font = `700 ${textHeight}px "Telegraf", "PP Telegraf", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";

        const margin = minDim * 0.06;
        const lines = bannerText.split("\n");
        lines.forEach((line, idx) => {
          ctx.fillText(line.toUpperCase(), margin, h - margin - (lines.length - 1 - idx) * textHeight * 1.05);
        });
        ctx.restore();
      }

      // HUD Metadata Frame
      if (overlays.hud) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = palette.stroke;
        ctx.font = `10px "SF Mono", "Menlo", monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`SEED:${params.seed}  MODE:${geoMode.toUpperCase()}`, 20, 20);
        ctx.fillText(`SCALE:${params.scale.toFixed(2)}  COUNT:${params.count}`, 20, 36);
      }

      // Noise Overlay
      if (overlays.grain && noiseTexture) {
        ctx.globalAlpha = 0.12;
        ctx.globalCompositeOperation = "screen";
        const pattern = ctx.createPattern(noiseTexture, "repeat");
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, w, h);
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1.0;
      }
    },
    [geoMode, palette, dimension, motionType, overlays, bannerText, fontSize, params, noiseTexture]
  );

  // Animation Loop
  useEffect(() => {
    let active = true;
    const speedMult = animSpeed === "fast" ? 2.5 : animSpeed === "slow" ? 0.5 : 1.0;

    const animate = () => {
      if (!active) return;
      animTimeRef.current += 0.016 * speedMult;
      renderGeo(animTimeRef.current);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [animSpeed, renderGeo]);

  // Export Options
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `YS_Geo_${geoMode}_${dimension.w}x${dimension.h}_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const exportSVG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${dimension.w}" height="${dimension.h}">
      <image href="${dataUrl}" width="${dimension.w}" height="${dimension.h}"/>
    </svg>`;
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.download = `YS_Geo_${geoMode}_${dimension.w}x${dimension.h}_${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  return (
    <div className={styles.appContainer}>
      <div className={styles.sidebar}>
        <div className={styles.brandTitle}>YS Geo</div>
        <div className={styles.brandSubtitle}>PARAMETRIC ILLUSTRATION</div>

        <div className={styles.sectionHeader} style={{ borderTop: "none", paddingTop: 0 }}>
          <span>Generative Mode</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
          {["orbital", "radial", "arcs", "lissajous", "constellation"].map((m) => (
            <button key={m} className={geoMode === m ? "active" : ""} onClick={() => setGeoMode(m)}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        <div className={styles.controlGroup}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Count</span>
            <span className={styles.controlValue}>{params.count}</span>
          </div>
          <input
            type="range"
            min={2}
            max={32}
            step={1}
            value={params.count}
            onChange={(e) => setParams((p) => ({ ...p, count: parseInt(e.target.value) }))}
          />
        </div>

        <div className={styles.controlGroup}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Scale</span>
            <span className={styles.controlValue}>{params.scale.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={1.5}
            step={0.05}
            value={params.scale}
            onChange={(e) => setParams((p) => ({ ...p, scale: parseFloat(e.target.value) }))}
          />
        </div>

        <div className={styles.controlGroup}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Stroke Weight</span>
            <span className={styles.controlValue}>{params.strokeWeight}</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={params.strokeWeight}
            onChange={(e) => setParams((p) => ({ ...p, strokeWeight: parseFloat(e.target.value) }))}
          />
        </div>

        <div className={styles.sectionHeader}>
          <span>Motion & Speed</span>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {["morph", "draw", "pulse"].map((mt) => (
            <button key={mt} style={{ flex: 1 }} className={motionType === mt ? "active" : ""} onClick={() => setMotionType(mt)}>
              {mt.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {["slow", "medium", "fast"].map((sp) => (
            <button key={sp} style={{ flex: 1 }} className={animSpeed === sp ? "active" : ""} onClick={() => setAnimSpeed(sp)}>
              {sp.toUpperCase()}
            </button>
          ))}
        </div>

        <div className={styles.sectionHeader}>
          <span>Typography Text</span>
        </div>
        <input
          type="text"
          placeholder="Banner text..."
          value={bannerText}
          onChange={(e) => setBannerText(e.target.value)}
          style={{ marginBottom: 8 }}
        />

        <div className={styles.sectionHeader}>
          <span>Palette & Size</span>
        </div>
        <select value={paletteKey} onChange={(e) => setPaletteKey(e.target.value)} style={{ marginBottom: 8 }}>
          {Object.entries(COLOR_PALETTES).map(([key, pal]) => (
            <option key={key} value={key}>
              {pal.name}
            </option>
          ))}
        </select>
        <select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)} style={{ marginBottom: 14 }}>
          {Object.keys(EXPORT_SIZES).map((fmt) => (
            <option key={fmt} value={fmt}>
              {fmt}
            </option>
          ))}
        </select>

        <div className={styles.sectionHeader}>
          <span>Export Options</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="primary" style={{ flex: 1 }} onClick={exportPNG}>
            PNG
          </button>
          <button style={{ flex: 1 }} onClick={exportSVG}>
            SVG
          </button>
        </div>
      </div>

      <div className={styles.canvasViewport} ref={containerRef}>
        <div className={styles.canvasWrapper}>
          <canvas ref={canvasRef} className={styles.canvasElement} style={{ width: displayW, height: displayH }} />
        </div>
        <div className={styles.canvasFooter}>
          Tool created by{" "}
          <a href="https://www.stoyanov.works" target="_blank" rel="noopener noreferrer">
            Yordan Stoyanov
          </a>
        </div>
      </div>
    </div>
  );
};
