"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/page.module.scss";
import { ImageUploader, ExportControls, RangeSliderControl } from "./common";
import {
  ShapeType,
  ColorMode,
  ShapeSelectorPanel,
  ColorModePanel,
  drawShapePath,
  buildSVGShapeElement
} from "./shapeMosaic";
import { hexToRgb, blendRgb } from "../utils/colorUtils";
import { isBackgroundPixel } from "../utils/bgFilterUtils";
import { exportCanvasToPNG, exportSVGString } from "../utils/exportUtils";

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

  // Load default sample background image & IMG300 typography cutout subject on mount
  useEffect(() => {
    // Default Main Background Image
    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.onload = () => setBgImage(bgImg);
    bgImg.src = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80";

    // Default "IMG300" Typography Cutout Subject Image
    const textCanvas = document.createElement("canvas");
    textCanvas.width = 1200;
    textCanvas.height = 500;
    const textCtx = textCanvas.getContext("2d");
    if (textCtx) {
      textCtx.clearRect(0, 0, 1200, 500);
      textCtx.fillStyle = "#ffffff";
      textCtx.font = '900 240px "Space Mono", "Inter", system-ui, sans-serif';
      textCtx.textAlign = "center";
      textCtx.textBaseline = "middle";
      textCtx.fillText("IMG300", 600, 250);

      const textImg = new Image();
      textImg.onload = () => setSubjectImage(textImg);
      textImg.src = textCanvas.toDataURL("image/png");
    }
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
    exportCanvasToPNG(canvasRef.current, `shape-mosaic-composition-${selectedShape}`);
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

    const baseStep = Math.max(2, tileSize * subjectScale);
    const stepX = Math.max(2, (tileSize + gapX) * subjectScale);
    const stepY = Math.max(2, (tileSize + gapY) * subjectScale);
    const effectiveShapeSize = baseStep * shapeScale;

    let svgElements = "";
    const tintRgb = hexToRgb(customColor);

    for (let y = 0; y < finalH; y += stepY) {
      for (let x = 0; x < finalW; x += stepX) {
        const sampleX = Math.min(imgW - 1, Math.floor(((x + stepX / 2) / finalW) * imgW));
        const sampleY = Math.min(imgH - 1, Math.floor(((y + stepY / 2) / finalH) * imgH));

        const idx = (sampleY * imgW + sampleX) * 4;
        const rVal = imgData[idx];
        const gVal = imgData[idx + 1];
        const bVal = imgData[idx + 2];
        const aVal = imgData[idx + 3];

        if (isBackgroundPixel({ r: rVal, g: gVal, b: bVal, a: aVal }, bgThreshold)) {
          continue;
        }

        const cx = finalX + x + stepX / 2;
        const cy = finalY + y + stepY / 2;

        let fill = `rgb(${rVal},${gVal},${bVal})`;
        if (colorMode === "solid") {
          fill = customColor;
        } else if (colorMode === "tint") {
          const blended = blendRgb({ r: rVal, g: gVal, b: bVal }, tintRgb, tintRatio);
          fill = `rgb(${blended.r},${blended.g},${blended.b})`;
        }

        svgElements += buildSVGShapeElement(selectedShape, cx, cy, effectiveShapeSize, fill);
      }
    }

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n${svgElements}</svg>`;
    exportSVGString(svgString, `shape-mosaic-${selectedShape}`);
  };

  // Render Loop for Multi-Layer Composition
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

        const baseStep = Math.max(2, tileSize * subjectScale);
        const stepX = Math.max(2, (tileSize + gapX) * subjectScale);
        const stepY = Math.max(2, (tileSize + gapY) * subjectScale);
        const effectiveShapeSize = baseStep * shapeScale;
        const tintRgb = hexToRgb(customColor);

        // Loop through subject bounds step-by-step with scaled step sizes
        for (let y = 0; y < finalH; y += stepY) {
          for (let x = 0; x < finalW; x += stepX) {
            // Map cell center to source image pixel coordinates
            const sampleX = Math.min(imgW - 1, Math.floor(((x + stepX / 2) / finalW) * imgW));
            const sampleY = Math.min(imgH - 1, Math.floor(((y + stepY / 2) / finalH) * imgH));

            const idx = (sampleY * imgW + sampleX) * 4;
            const rVal = imgData[idx];
            const gVal = imgData[idx + 1];
            const bVal = imgData[idx + 2];
            const aVal = imgData[idx + 3];

            // Background filtering checks: detect alpha PNG or fake PNG grey/white checkerboard
            if (isBackgroundPixel({ r: rVal, g: gVal, b: bVal, a: aVal }, bgThreshold)) {
              continue;
            }

            const cx = finalX + x + stepX / 2;
            const cy = finalY + y + stepY / 2;

            let fill = `rgb(${rVal}, ${gVal}, ${bVal})`;
            if (colorMode === "solid") {
              fill = customColor;
            } else if (colorMode === "tint") {
              const blended = blendRgb({ r: rVal, g: gVal, b: bVal }, tintRgb, tintRatio);
              fill = `rgb(${blended.r}, ${blended.g}, ${blended.b})`;
            }

            ctx.save();
            ctx.fillStyle = fill;
            drawShapePath(ctx, selectedShape, cx, cy, effectiveShapeSize, fill);
            if (selectedShape !== "x_cross") {
              ctx.fill();
            }
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
            <RangeSliderControl
              label="Cutout Position X"
              value={subjectPosX}
              min={-500}
              max={500}
              step={5}
              valueDisplay={`${subjectPosX}px`}
              onChange={setSubjectPosX}
              marginBottom={12}
            />

            <RangeSliderControl
              label="Cutout Position Y"
              value={subjectPosY}
              min={-500}
              max={500}
              step={5}
              valueDisplay={`${subjectPosY}px`}
              onChange={setSubjectPosY}
              marginBottom={12}
            />

            <RangeSliderControl
              label="Cutout Subject Size"
              value={subjectScale}
              min={0.2}
              max={2.0}
              step={0.05}
              valueDisplay={`${Math.round(subjectScale * 100)}%`}
              onChange={setSubjectScale}
              marginBottom={16}
            />
          </>
        )}

        {/* 3. Mosaic Shape Selection Panel */}
        <ShapeSelectorPanel
          selectedShape={selectedShape}
          onSelectShape={setSelectedShape}
        />

        {/* 4. Color & Tint Controls Panel */}
        <ColorModePanel
          colorMode={colorMode}
          customColor={customColor}
          tintRatio={tintRatio}
          onSelectColorMode={setColorMode}
          onChangeCustomColor={setCustomColor}
          onChangeTintRatio={setTintRatio}
        />

        {/* 5. Checkerboard Background Cutout Filter Sensitivity */}
        <div className={styles.sectionHeader}>
          <span>Checkerboard Cutout Filter</span>
        </div>

        <RangeSliderControl
          label="Cutout Sensitivity"
          value={bgThreshold}
          min={120}
          max={240}
          step={2}
          onChange={setBgThreshold}
          marginBottom={16}
        />

        {/* 6. Mosaic Resolution & Spacing */}
        <div className={styles.sectionHeader}>
          <span>Mosaic Resolution &amp; Spacing</span>
        </div>

        <RangeSliderControl
          label="Tile Grid Size"
          value={tileSize}
          min={6}
          max={60}
          step={2}
          valueDisplay={`${tileSize}px`}
          onChange={setTileSize}
          marginBottom={16}
        />

        <RangeSliderControl
          label="Horizontal Distance (Gap X)"
          value={gapX}
          min={0}
          max={40}
          step={1}
          valueDisplay={`${gapX}px`}
          onChange={setGapX}
          marginBottom={16}
        />

        <RangeSliderControl
          label="Vertical Distance (Gap Y)"
          value={gapY}
          min={0}
          max={40}
          step={1}
          valueDisplay={`${gapY}px`}
          onChange={setGapY}
          marginBottom={16}
        />

        <RangeSliderControl
          label="Shape Size Scale"
          value={shapeScale}
          min={0.4}
          max={1.2}
          step={0.05}
          valueDisplay={`${Math.round(shapeScale * 100)}%`}
          onChange={setShapeScale}
          marginBottom={16}
        />

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
