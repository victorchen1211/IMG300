"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/page.module.scss";
import { ImageUploader, ExportControls } from "./common";

type ShapeType = "circle" | "square" | "triangle" | "cross" | "diamond" | "hexagon" | "star";
type ColorMode = "original" | "solid" | "tint";

const SHAPE_OPTIONS: { id: ShapeType; label: string }[] = [
  { id: "circle", label: "Circle" },
  { id: "square", label: "Square" },
  { id: "triangle", label: "Triangle" },
  { id: "cross", label: "Cross" },
  { id: "diamond", label: "Diamond" },
  { id: "hexagon", label: "Hexagon" },
  { id: "star", label: "Star" }
];

const PRESET_COLORS = [
  { name: "Pure White", value: "#ffffff" },
  { name: "Cyber Cyan", value: "#00e5ff" },
  { name: "Neon Pink", value: "#ff007f" },
  { name: "Electric Yellow", value: "#ffea00" },
  { name: "Neon Green", value: "#00ff66" },
  { name: "Sunset Orange", value: "#ff5500" },
  { name: "Pure Black", value: "#000000" }
];

// Helper to parse hex color to RGB
const hexToRgb = (hex: string) => {
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
};

export const ShapeMosaicGenerator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Multi-Layer Image State
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null); // Layer 1: Main Background Image
  const [subjectImage, setSubjectImage] = useState<HTMLImageElement | null>(null); // Layer 2: Cutout Subject Image

  // Layer 2 Subject Transform Controls
  const [subjectPosX, setSubjectPosX] = useState<number>(0); // Horizontal Offset (-500px ~ 500px)
  const [subjectPosY, setSubjectPosY] = useState<number>(0); // Vertical Offset (-500px ~ 500px)
  const [subjectScale, setSubjectScale] = useState<number>(1.0); // Scale Factor (0.2 ~ 2.0)

  // Shape Mosaic Control States
  const [selectedShape, setSelectedShape] = useState<ShapeType>("cross");
  const [tileSize, setTileSize] = useState<number>(18); // Tile Grid Step (6px to 60px)
  const [shapeScale, setShapeScale] = useState<number>(0.85); // Shape Size Scale (0.4 to 1.2)
  const [gapX, setGapX] = useState<number>(0); // Horizontal Gap Distance (0px to 40px)
  const [gapY, setGapY] = useState<number>(0); // Vertical Gap Distance (0px to 40px)

  // Color Override & Tint Controls
  const [colorMode, setColorMode] = useState<ColorMode>("original"); // "original" | "solid" | "tint"
  const [customColor, setCustomColor] = useState<string>("#00e5ff"); // Default Cyber Cyan
  const [tintRatio, setTintRatio] = useState<number>(0.5); // Blend ratio (0.1 to 1.0)

  // Smart Checkerboard Background Cutout Filter Sensitivity
  const [bgThreshold, setBgThreshold] = useState<number>(170); // Threshold for neutral grey/white checkerboard removal

  // Load default sample background image & transparent PNG cutout subject on mount
  useEffect(() => {
    // Default Main Background Image
    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.onload = () => setBgImage(bgImg);
    bgImg.src = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80";

    // Default Cutout Subject Image
    const subImg = new Image();
    subImg.crossOrigin = "anonymous";
    subImg.onload = () => setSubjectImage(subImg);
    subImg.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png";
  }, []);

  // Handle Layer 1 Main Background Image Upload
  const handleUploadBgImage = (img: HTMLImageElement) => {
    setBgImage(img);
  };

  // Handle Layer 2 Cutout Subject Image Upload
  const handleUploadSubjectImage = (img: HTMLImageElement) => {
    setSubjectImage(img);
  };

  // Export PNG Handler
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `shape-mosaic-composition-${selectedShape}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Export SVG Handler
  const handleExportSVG = () => {
    const canvas = canvasRef.current;
    if (!canvas || !subjectImage || !subjectImage.complete || subjectImage.naturalWidth === 0) return;

    const w = canvas.width;
    const h = canvas.height;
    const imgW = subjectImage.naturalWidth;
    const imgH = subjectImage.naturalHeight;
    const imgAspect = imgW / imgH;

    const maxW = w * 0.85;
    const maxH = h * 0.85;

    let subDrawW = maxW;
    let subDrawH = maxW / imgAspect;

    if (subDrawH > maxH) {
      subDrawH = maxH;
      subDrawW = maxH * imgAspect;
    }

    const finalW = subDrawW * subjectScale;
    const finalH = subDrawH * subjectScale;
    const finalX = (w - finalW) / 2 + subjectPosX;
    const finalY = (h - finalH) / 2 + subjectPosY;

    const offCanvas = document.createElement("canvas");
    offCanvas.width = imgW;
    offCanvas.height = imgH;
    const offCtx = offCanvas.getContext("2d");
    if (!offCtx) return;

    offCtx.drawImage(subjectImage, 0, 0);
    const imgData = offCtx.getImageData(0, 0, imgW, imgH).data;

    const baseStep = Math.max(4, tileSize);
    const stepX = baseStep + gapX;
    const stepY = baseStep + gapY;
    const effectiveShapeSize = baseStep * shapeScale;
    const r = effectiveShapeSize / 2;

    let svgElements = "";
    const { r: tr, g: tg, b: tb } = hexToRgb(customColor);

    for (let y = 0; y < finalH; y += stepY) {
      for (let x = 0; x < finalW; x += stepX) {
        const sampleX = Math.min(imgW - 1, Math.floor(((x + baseStep / 2) / finalW) * imgW));
        const sampleY = Math.min(imgH - 1, Math.floor(((y + baseStep / 2) / finalH) * imgH));

        const idx = (sampleY * imgW + sampleX) * 4;
        const rVal = imgData[idx];
        const gVal = imgData[idx + 1];
        const bVal = imgData[idx + 2];
        const aVal = imgData[idx + 3];

        const isTransparent = aVal < 30;
        const isMonochrome = Math.abs(rVal - gVal) < 18 && Math.abs(gVal - bVal) < 18 && Math.abs(rVal - bVal) < 18;
        const avgBrightness = (rVal + gVal + bVal) / 3;
        const isCheckerboard = isMonochrome && avgBrightness >= bgThreshold;

        if (isTransparent || isCheckerboard) continue;

        const cx = finalX + x + baseStep / 2;
        const cy = finalY + y + baseStep / 2;

        let fill = `rgb(${rVal},${gVal},${bVal})`;
        if (colorMode === "solid") {
          fill = customColor;
        } else if (colorMode === "tint") {
          const finalR = Math.round(rVal * (1 - tintRatio) + tr * tintRatio);
          const finalG = Math.round(gVal * (1 - tintRatio) + tg * tintRatio);
          const finalB = Math.round(bVal * (1 - tintRatio) + tb * tintRatio);
          fill = `rgb(${finalR},${finalG},${finalB})`;
        }

        if (selectedShape === "circle") {
          svgElements += `  <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" />\n`;
        } else if (selectedShape === "square") {
          svgElements += `  <rect x="${(cx - r).toFixed(1)}" y="${(cy - r).toFixed(1)}" width="${effectiveShapeSize.toFixed(1)}" height="${effectiveShapeSize.toFixed(1)}" fill="${fill}" />\n`;
        } else {
          svgElements += `  <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" />\n`;
        }
      }
    }

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n${svgElements}</svg>`;
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `shape-mosaic-${selectedShape}-${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
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

  // Render Loop for Multi-Layer Composition (Layer 1: Main Backdrop Image, Layer 2: Cutout Subject Geometric Mosaic)
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Studio Canvas Dark Background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#08080e");
    bgGrad.addColorStop(1, "#12121c");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Studio Grid Accent Lines
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

    // LAYER 1: Render Main Background Image
    if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
      const bgW = bgImage.naturalWidth;
      const bgH = bgImage.naturalHeight;
      const bgAspect = bgW / bgH;

      const maxW = w * 0.92;
      const maxH = h * 0.92;

      let bgDrawW = maxW;
      let bgDrawH = maxW / bgAspect;

      if (bgDrawH > maxH) {
        bgDrawH = maxH;
        bgDrawW = maxH * bgAspect;
      }

      const bgDrawX = (w - bgDrawW) / 2;
      const bgDrawY = (h - bgDrawH) / 2;

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 15;
      ctx.drawImage(bgImage, bgDrawX, bgDrawY, bgDrawW, bgDrawH);
      ctx.restore();
    }

    // LAYER 2: Render Cutout Subject Geometric Shape Mosaic
    if (subjectImage && subjectImage.complete && subjectImage.naturalWidth > 0) {
      const imgW = subjectImage.naturalWidth;
      const imgH = subjectImage.naturalHeight;
      const imgAspect = imgW / imgH;

      const maxW = w * 0.85;
      const maxH = h * 0.85;

      let subDrawW = maxW;
      let subDrawH = maxW / imgAspect;

      if (subDrawH > maxH) {
        subDrawH = maxH;
        subDrawW = maxH * imgAspect;
      }

      const finalW = subDrawW * subjectScale;
      const finalH = subDrawH * subjectScale;
      const finalX = (w - finalW) / 2 + subjectPosX;
      const finalY = (h - finalH) / 2 + subjectPosY;

      // Offscreen canvas for alpha transparent pixel color sampling
      const offCanvas = document.createElement("canvas");
      offCanvas.width = imgW;
      offCanvas.height = imgH;
      const offCtx = offCanvas.getContext("2d");

      if (offCtx) {
        offCtx.drawImage(subjectImage, 0, 0);
        const imgData = offCtx.getImageData(0, 0, imgW, imgH).data;

        const baseStep = Math.max(4, tileSize);
        const stepX = baseStep + gapX;
        const stepY = baseStep + gapY;
        const effectiveShapeSize = baseStep * shapeScale;
        const { r: tr, g: tg, b: tb } = hexToRgb(customColor);

        // Loop through subject bounds step-by-step with independent X/Y gaps
        for (let y = 0; y < finalH; y += stepY) {
          for (let x = 0; x < finalW; x += stepX) {
            // Map cell center to source image pixel coordinates
            const sampleX = Math.min(imgW - 1, Math.floor(((x + baseStep / 2) / finalW) * imgW));
            const sampleY = Math.min(imgH - 1, Math.floor(((y + baseStep / 2) / finalH) * imgH));

            const idx = (sampleY * imgW + sampleX) * 4;
            const rVal = imgData[idx];
            const gVal = imgData[idx + 1];
            const bVal = imgData[idx + 2];
            const aVal = imgData[idx + 3];

            // Background filtering checks: detect alpha PNG or fake PNG grey/white checkerboard
            const isTransparent = aVal < 30;
            const isMonochrome = Math.abs(rVal - gVal) < 18 && Math.abs(gVal - bVal) < 18 && Math.abs(rVal - bVal) < 18;
            const avgBrightness = (rVal + gVal + bVal) / 3;
            const isCheckerboard = isMonochrome && avgBrightness >= bgThreshold;

            if (isTransparent || isCheckerboard) continue;

            const cx = finalX + x + baseStep / 2;
            const cy = finalY + y + baseStep / 2;

            let fill = `rgb(${rVal}, ${gVal}, ${bVal})`;
            if (colorMode === "solid") {
              fill = customColor;
            } else if (colorMode === "tint") {
              const finalR = Math.round(rVal * (1 - tintRatio) + tr * tintRatio);
              const finalG = Math.round(gVal * (1 - tintRatio) + tg * tintRatio);
              const finalB = Math.round(bVal * (1 - tintRatio) + tb * tintRatio);
              fill = `rgb(${finalR}, ${finalG}, ${finalB})`;
            }

            ctx.save();
            ctx.fillStyle = fill;
            drawShapePath(ctx, selectedShape, cx, cy, effectiveShapeSize);
            ctx.fill();
            ctx.restore();
          }
        }
      }
    }
  }, [bgImage, subjectImage, subjectPosX, subjectPosY, subjectScale, selectedShape, tileSize, shapeScale, gapX, gapY, colorMode, customColor, tintRatio, bgThreshold]);

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

        {/* LAYER 1: Main Background Image */}
        <div className={styles.sectionHeader}>
          <span>Layer 1 • Main Background Image</span>
        </div>

        <ImageUploader
          hasImage={!!bgImage}
          onUploadImage={handleUploadBgImage}
        />

        {/* LAYER 2: Cutout Subject Image */}
        <div className={styles.sectionHeader} style={{ marginTop: 16 }}>
          <span>Layer 2 • Cutout Subject Image</span>
        </div>

        <ImageUploader
          hasImage={!!subjectImage}
          onUploadImage={handleUploadSubjectImage}
        />

        {/* Layer 2 Position & Scaling Transforms */}
        {subjectImage && (
          <>
            <div className={styles.controlGroup} style={{ marginBottom: 12 }}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Cutout Position X</span>
                <span className={styles.controlValue}>{subjectPosX}px</span>
              </div>
              <input
                type="range"
                min={-500}
                max={500}
                step={5}
                value={subjectPosX}
                onChange={(e) => setSubjectPosX(parseInt(e.target.value))}
              />
            </div>

            <div className={styles.controlGroup} style={{ marginBottom: 12 }}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Cutout Position Y</span>
                <span className={styles.controlValue}>{subjectPosY}px</span>
              </div>
              <input
                type="range"
                min={-500}
                max={500}
                step={5}
                value={subjectPosY}
                onChange={(e) => setSubjectPosY(parseInt(e.target.value))}
              />
            </div>

            <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Cutout Subject Size</span>
                <span className={styles.controlValue}>{Math.round(subjectScale * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={2.0}
                step={0.05}
                value={subjectScale}
                onChange={(e) => setSubjectScale(parseFloat(e.target.value))}
              />
            </div>
          </>
        )}

        {/* 3. Shape Selection */}
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
                  justifyContent: "center"
                }}
                onClick={() => setSelectedShape(item.id)}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Shape Color & Tint Controls */}
        <div className={styles.sectionHeader}>
          <span>Shape Color &amp; Tint</span>
        </div>

        {/* Color Mode Selection */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
            <span className={styles.controlLabel}>Color Mode</span>
            <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>{colorMode}</span>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["original", "solid", "tint"] as const).map((mode) => (
              <button
                key={mode}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  fontSize: "11px",
                  fontWeight: colorMode === mode ? 800 : 700,
                  textTransform: "capitalize",
                  background: colorMode === mode ? "#000000" : "#ffffff",
                  border: "2px solid #000000",
                  color: colorMode === mode ? "#ffffff" : "#000000",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
                onClick={() => setColorMode(mode)}
              >
                {mode === "original" ? "Original" : mode === "solid" ? "Solid" : "Tint Blend"}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Color Picker & Presets (Active when mode is solid or tint) */}
        {colorMode !== "original" && (
          <>
            <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
              <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
                <span className={styles.controlLabel}>Custom Shape Color</span>
                <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>{customColor}</span>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
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
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setCustomColor(c.value)}
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        backgroundColor: c.value,
                        border: customColor === c.value ? "2px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.2)",
                        cursor: "pointer",
                        padding: 0
                      }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Tint Blend Ratio Slider */}
            {colorMode === "tint" && (
              <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
                <div className={styles.controlHeader}>
                  <span className={styles.controlLabel}>Tint Blend Ratio</span>
                  <span className={styles.controlValue}>{Math.round(tintRatio * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={tintRatio}
                  onChange={(e) => setTintRatio(parseFloat(e.target.value))}
                />
              </div>
            )}
          </>
        )}

        {/* 5. Checkerboard Background Cutout Filter Sensitivity */}
        <div className={styles.sectionHeader}>
          <span>Checkerboard Cutout Filter</span>
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Cutout Sensitivity</span>
            <span className={styles.controlValue}>{bgThreshold}</span>
          </div>
          <input
            type="range"
            min={120}
            max={240}
            step={2}
            value={bgThreshold}
            onChange={(e) => setBgThreshold(parseInt(e.target.value))}
          />
        </div>

        {/* 6. Mosaic Resolution & Spacing */}
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

        {/* Shared Export Controls Component */}
        <ExportControls
          onExportPNG={handleExportPNG}
          onExportSVG={handleExportSVG}
        />
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
          IMG300 Studio • Shape Mosaic Studio ({selectedShape.toUpperCase()} Unit • Dual-Layer Composition)
        </div>
      </div>
    </div>
  );
};
