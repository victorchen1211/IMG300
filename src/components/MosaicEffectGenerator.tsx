"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/page.module.scss";
import { ImageUploader } from "./common";

const PRESET_COLORS = [
  { name: "Cyan", value: "#00e5ff" },
  { name: "Green", value: "#00ff22" },
  { name: "Pink", value: "#ff007f" },
  { name: "Yellow", value: "#ffea00" },
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" }
];

export const MosaicEffectGenerator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);

  // Grid Controls
  const [gridDimension, setGridDimension] = useState<number>(6); // N x N (1 to 25)
  const [lineWidth, setLineWidth] = useState<number>(3); // Line Thickness (1px to 20px)
  const [lineColor, setLineColor] = useState<string>("#00e5ff"); // Line Color (Hex)
  const [lineOpacity, setLineOpacity] = useState<number>(85); // Line Opacity (10% to 100%)

  // Load default sample image on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setSourceImage(img);
    };
    img.src = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80";
  }, []);

  // Handle Image Upload
  const handleUploadImage = (img: HTMLImageElement) => {
    setSourceImage(img);
  };

  // Convert Hex Color + Alpha to RGBA string
  const hexToRgba = (hex: string, alphaPercent: number) => {
    let c = hex.replace("#", "");
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    const num = parseInt(c, 16) || 0;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alphaPercent / 100})`;
  };

  // Render Loop to Draw Image with N x N Grid Overlay Lines
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Studio Dark Background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#08080e");
    bgGrad.addColorStop(1, "#12121c");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle Background Grid Pattern
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    const bgStep = 40;
    for (let x = 0; x < w; x += bgStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += bgStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (sourceImage && sourceImage.complete && sourceImage.naturalWidth > 0) {
      // Scale and center image inside canvas bounds with aspect ratio preservation
      const imgW = sourceImage.naturalWidth;
      const imgH = sourceImage.naturalHeight;
      const imgAspect = imgW / imgH;

      const maxW = w * 0.82;
      const maxH = h * 0.82;

      let drawW = maxW;
      let drawH = maxW / imgAspect;

      if (drawH > maxH) {
        drawH = maxH;
        drawW = maxH * imgAspect;
      }

      const drawX = (w - drawW) / 2;
      const drawY = (h - drawH) / 2;

      // Drop Shadow for Image Container
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 15;

      // Draw Clean Uploaded Image
      ctx.drawImage(sourceImage, drawX, drawY, drawW, drawH);
      ctx.restore();

      // Render N x N Grid Lines Overlay
      ctx.save();
      ctx.strokeStyle = hexToRgba(lineColor, lineOpacity);
      ctx.lineWidth = lineWidth;

      // Draw Vertical Divider Lines
      for (let c = 1; c < gridDimension; c++) {
        const lineX = drawX + (c / gridDimension) * drawW;
        ctx.beginPath();
        ctx.moveTo(lineX, drawY);
        ctx.lineTo(lineX, drawY + drawH);
        ctx.stroke();
      }

      // Draw Horizontal Divider Lines
      for (let r = 1; r < gridDimension; r++) {
        const lineY = drawY + (r / gridDimension) * drawH;
        ctx.beginPath();
        ctx.moveTo(drawX, lineY);
        ctx.lineTo(drawX + drawW, lineY);
        ctx.stroke();
      }

      // Draw Outer Frame Border Line
      ctx.strokeRect(drawX, drawY, drawW, drawH);
      ctx.restore();
    } else {
      // Prompt when image is loading
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = '600 16px "Space Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("UPLOAD AN IMAGE TO BEGIN MOSAIC GRID DIVISION", w / 2, h / 2);
    }
  }, [sourceImage, gridDimension, lineWidth, lineColor, lineOpacity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 1280;
      canvas.height = 720;
    }
    renderCanvas();
  }, [renderCanvas]);

  return (
    <div className={styles.appContainer} style={{ background: "#0a0a0f", minHeight: "100vh" }}>
      {/* Sidebar Tool Panel */}
      <div className={styles.sidebar}>
        <div className={styles.brandTitle}>IMG300</div>
        <div className={styles.brandSubtitle}>Mosaic Effect Generator</div>

        {/* Image Upload Component */}
        <ImageUploader
          hasImage={!!sourceImage}
          onUploadImage={handleUploadImage}
        />

        {/* Grid Division Settings */}
        <div className={styles.sectionHeader}>
          <span>Grid Division</span>
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Grid Matrix Dimension</span>
            <span className={styles.controlValue}>{gridDimension} x {gridDimension}</span>
          </div>
          <input
            type="range"
            min={1}
            max={25}
            step={1}
            value={gridDimension}
            onChange={(e) => setGridDimension(parseInt(e.target.value))}
          />
        </div>

        {/* Grid Line Styling */}
        <div className={styles.sectionHeader}>
          <span>Line Style Settings</span>
        </div>

        {/* Line Thickness */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Line Thickness</span>
            <span className={styles.controlValue}>{lineWidth}px</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
          />
        </div>

        {/* Line Opacity */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Line Opacity</span>
            <span className={styles.controlValue}>{lineOpacity}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={lineOpacity}
            onChange={(e) => setLineOpacity(parseInt(e.target.value))}
          />
        </div>

        {/* Line Color Picker & Swatches */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
            <span className={styles.controlLabel}>Line Color</span>
            <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>{lineColor}</span>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
            <input
              type="color"
              value={lineColor}
              onChange={(e) => setLineColor(e.target.value)}
              style={{
                width: "36px",
                height: "36px",
                padding: "0",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                background: "transparent"
              }}
            />
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 }}>
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setLineColor(color.value)}
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: color.value,
                    border: lineColor === color.value ? "2px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.2)",
                    cursor: "pointer",
                    boxShadow: lineColor === color.value ? `0 0 8px ${color.value}` : "none",
                    padding: 0
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div className={styles.canvasViewport} ref={containerRef}>
        <div className={styles.canvasWrapper} style={{ position: "relative" }}>
          {/* Real-time Canvas */}
          <canvas
            ref={canvasRef}
            className={styles.canvasElement}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              borderRadius: "8px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)"
            }}
          />
        </div>

        <div className={styles.canvasFooter}>
          IMG300 Studio • Mosaic Grid Division ({gridDimension}x{gridDimension} Grid • {lineWidth}px Lines)
        </div>
      </div>
    </div>
  );
};
