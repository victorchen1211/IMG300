"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/page.module.scss";
import { COLOR_PALETTES, ColorPalette, EXPORT_SIZES, DimensionPreset } from "../constants/generatorPresets";
import { DrawingPoint, PhysicsParticle, stepPhysicsSimulation, createNoiseCanvas } from "../utils/canvasMath";

export const YSDrawingStudio: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Studio State
  const [selectedFormat, setSelectedFormat] = useState<string>("Portrait 3:4 (1200x1600)");
  const [paletteKey, setPaletteKey] = useState<string>("whiteOnDark");
  const [gridDivisions, setGridDivisions] = useState<number>(32);
  const [drawingPoints, setDrawingPoints] = useState<DrawingPoint[]>([]);
  const [origins, setOrigins] = useState<Array<{ x: number; y: number; id: number }>>([{ x: 512, y: 512, id: 0 }]);
  const [activeOriginId, setActiveOriginId] = useState<number>(0);
  const [physicsActive, setPhysicsActive] = useState<boolean>(false);
  const [viewportDim, setViewportDim] = useState<{ w: number; h: number }>({ w: 800, h: 600 });
  const [noiseTexture, setNoiseTexture] = useState<HTMLCanvasElement | null>(null);

  const particlesRef = useRef<PhysicsParticle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

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

  // Sync Drawing Points to Physics Particles
  useEffect(() => {
    particlesRef.current = drawingPoints.map((pt) => ({
      x: pt.x,
      y: pt.y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      mass: pt.type === "heavy" ? 4 : 1,
      radius: pt.type === "heavy" ? 14.4 : 8
    }));
  }, [drawingPoints]);

  const scaleW = viewportDim.w / dimension.w;
  const scaleH = viewportDim.h / dimension.h;
  const fitScale = Math.min(scaleW, scaleH);
  const displayW = Math.round(dimension.w * fitScale);
  const displayH = Math.round(dimension.h * fitScale);

  // Canvas Render Function
  const renderStudio = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = dimension.w;
    canvas.height = dimension.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const minDim = Math.min(dimension.w, dimension.h);
    const contentSize = minDim * 0.84;
    const offsetX = (dimension.w - contentSize) / 2;
    const offsetY = (dimension.h - contentSize) / 2;

    // Background
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, dimension.w, dimension.h);

    // Draw Grid Divisions
    const step = contentSize / gridDivisions;
    ctx.strokeStyle = palette.detail;
    ctx.lineWidth = Math.max(0.3, minDim * 0.0005);

    for (let i = 0; i <= gridDivisions; i++) {
      const pos = i * step;
      ctx.globalAlpha = i === 0 || i === gridDivisions ? 0.2 : 0.08;

      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(offsetX + pos, offsetY);
      ctx.lineTo(offsetX + pos, offsetY + contentSize);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + pos);
      ctx.lineTo(offsetX + contentSize, offsetY + pos);
      ctx.stroke();
    }

    // Map origins to canvas coordinates
    const mappedOrigins: Record<number, { x: number; y: number }> = {};
    origins.forEach((o) => {
      mappedOrigins[o.id] = {
        x: offsetX + (o.x / 1024) * contentSize,
        y: offsetY + (o.y / 1024) * contentSize
      };
    });

    // Draw Origins
    const originFontSize = Math.max(9, minDim * 0.012);
    origins.forEach((o) => {
      const pos = mappedOrigins[o.id];
      const isActive = o.id === activeOriginId;

      ctx.globalAlpha = isActive ? 0.6 : 0.3;
      ctx.fillStyle = palette.stroke;
      ctx.strokeStyle = palette.stroke;

      if (isActive) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, Math.max(3, minDim * 0.005), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.lineWidth = Math.max(1, minDim * 0.001);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, Math.max(3, minDim * 0.005), 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = isActive ? 0.5 : 0.25;
      ctx.font = `bold ${originFontSize}px "SF Mono", "Menlo", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(`O${o.id}`, pos.x + minDim * 0.01, pos.y - minDim * 0.008);
    });

    // Determine current point positions (Physics particles or static)
    const pointsToRender = physicsActive
      ? particlesRef.current
      : drawingPoints.map((pt) => ({ x: pt.x, y: pt.y, mass: pt.type === "heavy" ? 4 : 1, radius: 8 }));

    ctx.lineCap = "round";

    // Draw connecting lines from Origin to Points
    pointsToRender.forEach((p, idx) => {
      const ptData = drawingPoints[idx] || {};
      const px = offsetX + (p.x / 1024) * contentSize;
      const py = offsetY + (p.y / 1024) * contentSize;
      const isHeavy = ptData.type === "heavy";
      const origin = mappedOrigins[ptData.originId ?? 0] || mappedOrigins[0];

      if (origin) {
        ctx.strokeStyle = palette.stroke;
        ctx.lineWidth = isHeavy ? 2.5 : 1;
        ctx.globalAlpha = isHeavy ? 0.9 : 0.5 + 0.3 * (idx / Math.max(1, pointsToRender.length - 1));
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(px, py);
        ctx.stroke();
      }

      // Point Marker
      ctx.globalAlpha = isHeavy ? 1.0 : 0.8;
      ctx.fillStyle = palette.stroke;
      ctx.beginPath();
      ctx.arc(px, py, isHeavy ? Math.max(5, minDim * 0.008) : Math.max(2.5, minDim * 0.004), 0, Math.PI * 2);
      ctx.fill();

      if (isHeavy) {
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = palette.stroke;
        ctx.lineWidth = Math.max(0.5, minDim * 0.0008);
        ctx.setLineDash([minDim * 0.004, minDim * 0.004]);
        ctx.beginPath();
        ctx.arc(px, py, minDim * 0.04, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Point Label
      const labelFontSize = Math.max(8, minDim * 0.01);
      ctx.globalAlpha = isHeavy ? 0.7 : 0.5;
      ctx.fillStyle = palette.stroke;
      ctx.font = `${isHeavy ? "bold " : ""}${labelFontSize}px "SF Mono", "Menlo", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`${idx + 1}  ${Math.round(p.x)},${Math.round(p.y)}${isHeavy ? "  G" : ""}`, px + minDim * 0.012, py);
    });

    // Noise overlay
    if (noiseTexture) {
      ctx.globalAlpha = 0.1;
      ctx.globalCompositeOperation = "screen";
      const pattern = ctx.createPattern(noiseTexture, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, dimension.w, dimension.h);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1.0;
    }
  }, [dimension, palette, gridDivisions, drawingPoints, origins, activeOriginId, physicsActive, noiseTexture]);

  // Physics animation loop
  useEffect(() => {
    if (!physicsActive) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderStudio();
      return;
    }

    let active = true;
    const animate = () => {
      if (!active) return;
      stepPhysicsSimulation(particlesRef.current, mousePosRef.current, 0.2, 0.05, 0.96, 0.5, 1024);
      renderStudio();
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [physicsActive, renderStudio]);

  // Convert Mouse Coordinates to Grid (0 - 1024)
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * (dimension.w / rect.width);
      const clickY = (e.clientY - rect.top) * (dimension.h / rect.height);

      const minDim = Math.min(dimension.w, dimension.h);
      const contentSize = minDim * 0.84;
      const offsetX = (dimension.w - contentSize) / 2;
      const offsetY = (dimension.h - contentSize) / 2;

      const gridX = ((clickX - offsetX) / contentSize) * 1024;
      const gridY = ((clickY - offsetY) / contentSize) * 1024;

      if (gridX < 0 || gridX > 1024 || gridY < 0 || gridY > 1024) return null;

      // Snap to Grid
      const step = 1024 / gridDivisions;
      const snappedX = Math.round(gridX / step) * step;
      const snappedY = Math.round(gridY / step) * step;

      return { x: snappedX, y: snappedY };
    },
    [dimension, gridDivisions]
  );

  // Click Handlers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.altKey) {
      // Anchor new point directly
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * (dimension.w / rect.width);
      const clickY = (e.clientY - rect.top) * (dimension.h / rect.height);
      setDrawingPoints((prev) => [...prev, { x: clickX, y: clickY, id: Date.now() }]);
      return;
    }

    if (e.shiftKey) {
      // Move Active Origin
      const coords = getCanvasCoords(e);
      if (coords) {
        setOrigins((prev) => prev.map((o) => (o.id === activeOriginId ? { ...o, x: coords.x, y: coords.y } : o)));
      }
      return;
    }

    const coords = getCanvasCoords(e);
    if (coords) {
      setDrawingPoints((prev) => [...prev, { x: coords.x, y: coords.y, type: "normal", originId: activeOriginId }]);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const step = 1024 / gridDivisions;
    const radius = step * 3;
    const burstPoints: DrawingPoint[] = [];

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const bx = Math.round((coords.x + Math.cos(angle) * radius) / step) * step;
      const by = Math.round((coords.y + Math.sin(angle) * radius) / step) * step;

      if (bx >= 0 && bx <= 1024 && by >= 0 && by <= 1024) {
        burstPoints.push({ x: bx, y: by, type: "normal", originId: activeOriginId });
      }
    }

    setDrawingPoints((prev) => [...prev, ...burstPoints]);
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.shiftKey) {
      // Create New Origin
      const coords = getCanvasCoords(e);
      if (coords) {
        const nextId = origins.length;
        setOrigins((prev) => [...prev, { x: coords.x, y: coords.y, id: nextId }]);
        setActiveOriginId(nextId);
      }
      return;
    }

    // Heavy Gravity Point
    const coords = getCanvasCoords(e);
    if (coords) {
      setDrawingPoints((prev) => [...prev, { x: coords.x, y: coords.y, type: "heavy", originId: activeOriginId }]);
    }
  };

  // Export Functions
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `YS_Drawing_Studio_${dimension.w}x${dimension.h}_${Date.now()}.png`;
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
    link.download = `YS_Drawing_Studio_${dimension.w}x${dimension.h}_${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  return (
    <div className={styles.appContainer}>
      <div className={styles.sidebar}>
        <div className={styles.brandTitle}>YS Drawing Studio</div>
        <div className={styles.brandSubtitle}>INTERACTIVE CANVAS</div>

        <div className={styles.controlGroup}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Grid Divisions</span>
            <span className={styles.controlValue}>{gridDivisions}</span>
          </div>
          <input
            type="range"
            min={4}
            max={128}
            step={4}
            value={gridDivisions}
            onChange={(e) => setGridDivisions(parseInt(e.target.value))}
          />
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <button style={{ flex: 1 }} onClick={() => setDrawingPoints((prev) => prev.slice(0, -1))}>
            Undo
          </button>
          <button
            style={{ flex: 1 }}
            onClick={() => {
              setDrawingPoints([]);
              setOrigins([{ x: 512, y: 512, id: 0 }]);
              setActiveOriginId(0);
            }}
          >
            Clear
          </button>
        </div>

        <button
          className={physicsActive ? "active" : ""}
          style={{ width: "100%", marginBottom: 16 }}
          onClick={() => setPhysicsActive(!physicsActive)}
        >
          {physicsActive ? "PHYSICS MODE: ON" : "PHYSICS MODE: OFF"}
        </button>

        <div className={styles.sectionHeader}>
          <span>Palette</span>
        </div>
        <select value={paletteKey} onChange={(e) => setPaletteKey(e.target.value)} style={{ marginBottom: 14 }}>
          {Object.entries(COLOR_PALETTES).map(([key, pal]) => (
            <option key={key} value={key}>
              {pal.name}
            </option>
          ))}
        </select>

        <div className={styles.sectionHeader}>
          <span>Format Size</span>
        </div>
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
          <canvas
            ref={canvasRef}
            className={styles.canvasElement}
            onClick={handleCanvasClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            style={{ width: displayW, height: displayH }}
          />
        </div>

        <div className={styles.canvasFooter}>
          <span>Click</span> Point &nbsp; <span>Dbl</span> Burst &nbsp; <span>Right</span> Gravity &nbsp;{" "}
          <span>Shift</span> Move origin &nbsp; <span>Shift-right</span> New origin &nbsp; <span>Alt</span> Anchor
        </div>
      </div>
    </div>
  );
};
