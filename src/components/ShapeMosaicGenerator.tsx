"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/page.module.scss";
import { ImageUploader } from "./common";

type ShapeType = "circle" | "square" | "triangle" | "cross" | "diamond" | "hexagon" | "star";

const SHAPE_OPTIONS: { id: ShapeType; label: string; icon: string }[] = [
  { id: "circle", label: "Circle", icon: "●" },
  { id: "square", label: "Square", icon: "■" },
  { id: "triangle", label: "Triangle", icon: "▲" },
  { id: "cross", label: "Cross", icon: "┼" },
  { id: "diamond", label: "Diamond", icon: "◆" },
  { id: "hexagon", label: "Hexagon", icon: "⬡" },
  { id: "star", label: "Star", icon: "★" }
];

export const ShapeMosaicGenerator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);

  // Shape Mosaic Control States
  const [selectedShape, setSelectedShape] = useState<ShapeType>("circle");
  const [tileSize, setTileSize] = useState<number>(18); // Tile Grid Step (6px to 60px)
  const [shapeScale, setShapeScale] = useState<number>(0.85); // Shape Size Scale (0.4 to 1.2)
  const [gapX, setGapX] = useState<number>(0); // Horizontal Gap Distance (0px to 40px)
  const [gapY, setGapY] = useState<number>(0); // Vertical Gap Distance (0px to 40px)

  // Load default sample transparent PNG/image on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setSourceImage(img);
    };
    img.src = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80";
  }, []);

  // Handle Image Upload
  const handleUploadImage = (img: HTMLImageElement) => {
    setSourceImage(img);
  };

  // Draw Specific Geometric Shape Path
  const drawShapePath = (
    ctx: CanvasRenderingContext2D,
    shape: ShapeType,
    cx: number,
    cy: number,
    size: number
  ) => {
    const r = size / 2;

    ctx.beginPath();
    if (shape === "circle") {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    } else if (shape === "square") {
      ctx.rect(cx - r, cy - r, size, size);
    } else if (shape === "triangle") {
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy + r);
      ctx.lineTo(cx - r, cy + r);
      ctx.closePath();
    } else if (shape === "cross") {
      const arm = size / 3;
      ctx.rect(cx - arm / 2, cy - r, arm, size);
      ctx.rect(cx - r, cy - arm / 2, size, arm);
    } else if (shape === "diamond") {
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
    } else if (shape === "hexagon") {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    } else if (shape === "star") {
      const points = 5;
      const innerR = r * 0.4;
      for (let i = 0; i < points * 2; i++) {
        const currentR = i % 2 === 0 ? r : innerR;
        const angle = (Math.PI / points) * i - Math.PI / 2;
        const x = cx + currentR * Math.cos(angle);
        const y = cy + currentR * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }
  };

  // Render Loop to Pixelate Image into Geometric Mosaic Shapes
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (sourceImage && sourceImage.complete && sourceImage.naturalWidth > 0) {
      const imgW = sourceImage.naturalWidth;
      const imgH = sourceImage.naturalHeight;
      const imgAspect = imgW / imgH;

      const maxW = w * 0.92;
      const maxH = h * 0.92;

      let drawW = maxW;
      let drawH = maxW / imgAspect;

      if (drawH > maxH) {
        drawH = maxH;
        drawW = maxH * imgAspect;
      }

      const drawX = (w - drawW) / 2;
      const drawY = (h - drawH) / 2;

      // Offscreen canvas for alpha transparent pixel color sampling
      const offCanvas = document.createElement("canvas");
      offCanvas.width = imgW;
      offCanvas.height = imgH;
      const offCtx = offCanvas.getContext("2d");

      if (offCtx) {
        offCtx.drawImage(sourceImage, 0, 0);
        const imgData = offCtx.getImageData(0, 0, imgW, imgH).data;

        const baseStep = Math.max(4, tileSize);
        const stepX = baseStep + gapX;
        const stepY = baseStep + gapY;
        const effectiveShapeSize = baseStep * shapeScale;

        // Loop through image bounds step-by-step with independent X/Y gaps
        for (let y = 0; y < drawH; y += stepY) {
          for (let x = 0; x < drawW; x += stepX) {
            // Map cell center to source image pixel coordinates
            const sampleX = Math.min(imgW - 1, Math.floor(((x + baseStep / 2) / drawW) * imgW));
            const sampleY = Math.min(imgH - 1, Math.floor(((y + baseStep / 2) / drawH) * imgH));

            const idx = (sampleY * imgW + sampleX) * 4;
            const rVal = imgData[idx];
            const gVal = imgData[idx + 1];
            const bVal = imgData[idx + 2];
            const aVal = imgData[idx + 3];

            // Skip transparent PNG background pixels
            if (aVal < 20) continue;

            const cx = drawX + x + baseStep / 2;
            const cy = drawY + y + baseStep / 2;

            ctx.save();
            ctx.fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;
            drawShapePath(ctx, selectedShape, cx, cy, effectiveShapeSize);
            ctx.fill();
            ctx.restore();
          }
        }
      }
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = '600 16px "Space Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("UPLOAD AN IMAGE TO BEGIN SHAPE MOSAIC CREATION", w / 2, h / 2);
    }
  }, [sourceImage, selectedShape, tileSize, shapeScale, gapX, gapY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 1920;
      canvas.height = 1080;
    }
    renderCanvas();
  }, [renderCanvas]);

  return (
    <div className={styles.appContainer} style={{ background: "#0a0a0f", minHeight: "100vh" }}>
      {/* Sidebar Tool Panel */}
      <div className={styles.sidebar}>
        <div className={styles.brandTitle}>IMG300</div>
        <div className={styles.brandSubtitle}>Shape Mosaic Studio</div>

        {/* Image Upload Component */}
        <ImageUploader
          hasImage={!!sourceImage}
          onUploadImage={handleUploadImage}
        />

        {/* 1. Shape Selection */}
        <div className={styles.sectionHeader}>
          <span>Mosaic Shape Unit</span>
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
            <span className={styles.controlLabel}>Select Shape</span>
            <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>{selectedShape}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {SHAPE_OPTIONS.map((item) => (
              <button
                key={item.id}
                style={{
                  padding: "10px 8px",
                  fontSize: "12px",
                  fontWeight: selectedShape === item.id ? 800 : 700,
                  background: selectedShape === item.id ? "#000000" : "#ffffff",
                  border: "2px solid #000000",
                  color: selectedShape === item.id ? "#ffffff" : "#000000",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
                onClick={() => setSelectedShape(item.id)}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Mosaic Resolution & Spacing */}
        <div className={styles.sectionHeader}>
          <span>Mosaic Resolution &amp; Spacing</span>
        </div>

        {/* Tile Size Slider */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Tile Grid Size</span>
            <span className={styles.controlValue}>{tileSize}px</span>
          </div>
          <input
            type="range"
            min={6}
            max={60}
            step={2}
            value={tileSize}
            onChange={(e) => setTileSize(parseInt(e.target.value))}
          />
        </div>

        {/* Horizontal Spacing Slider (Gap X) */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Horizontal Distance (Gap X)</span>
            <span className={styles.controlValue}>{gapX}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={40}
            step={1}
            value={gapX}
            onChange={(e) => setGapX(parseInt(e.target.value))}
          />
        </div>

        {/* Vertical Spacing Slider (Gap Y) */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Vertical Distance (Gap Y)</span>
            <span className={styles.controlValue}>{gapY}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={40}
            step={1}
            value={gapY}
            onChange={(e) => setGapY(parseInt(e.target.value))}
          />
        </div>

        {/* Shape Scale Slider */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Shape Size Scale</span>
            <span className={styles.controlValue}>{Math.round(shapeScale * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.4}
            max={1.2}
            step={0.05}
            value={shapeScale}
            onChange={(e) => setShapeScale(parseFloat(e.target.value))}
          />
        </div>
      </div>

      {/* Main Viewport */}
      <div className={styles.canvasViewport} ref={containerRef}>
        <div className={styles.canvasWrapper} style={{ position: "relative" }}>
          {/* Real-time Canvas with Transparent Pattern Background */}
          <canvas
            ref={canvasRef}
            className={styles.canvasElement}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              borderRadius: "8px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
              backgroundImage: "linear-gradient(45deg, #141420 25%, transparent 25%), linear-gradient(-45deg, #141420 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #141420 75%), linear-gradient(-45deg, transparent 75%, #141420 75%)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
              backgroundColor: "#08080e"
            }}
          />
        </div>

        <div className={styles.canvasFooter}>
          IMG300 Studio • Shape Mosaic Studio ({selectedShape.toUpperCase()} Unit • {tileSize}px Tile Size)
        </div>
      </div>
    </div>
  );
};
