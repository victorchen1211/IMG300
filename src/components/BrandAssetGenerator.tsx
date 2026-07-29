"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/page.module.scss";
import {
  COLOR_PALETTES,
  EXPORT_SIZES,
  ColorPalette,
  DimensionPreset
} from "../constants/generatorPresets";
import { ToolPanel } from "./toolPanel";
import { IMAGE_FILTERS, MaskLayer, TextLayer } from "./blurAndReveal";

export const BrandAssetGenerator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Core State
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [selectedFilterKey, setSelectedFilterKey] = useState<string>("none");
  const [overlayEnabled, setOverlayEnabled] = useState<boolean>(false);
  const [blurAmount, setBlurAmount] = useState<number>(14);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.4);

  // Multi-Mask Layer System
  const [masks, setMasks] = useState<MaskLayer[]>([
    {
      id: "mask-1",
      enabled: false,
      width: 450,
      height: 300,
      borderColor: "palette",
      borderWidth: 2,
      showCrosshair: true,
      posX: 0.5,
      posY: 0.5
    }
  ]);
  const [selectedMaskId, setSelectedMaskId] = useState<string>("mask-1");

  // Multi-Text Layer System
  const [texts, setTexts] = useState<TextLayer[]>([
    {
      id: "text-1",
      enabled: true,
      text: "IMG300",
      fontSize: 72,
      textAlign: "center",
      color: "#ffffff",
      posX: 0.5,
      posY: 0.5
    }
  ]);
  const [selectedTextId, setSelectedTextId] = useState<string>("text-1");

  // Color & Size Controls
  const [selectedPaletteKey, setSelectedPaletteKey] = useState<string>("monochrome");
  const [selectedFormat, setSelectedFormat] = useState<string>("portrait34");

  // Responsive Viewport Bounds
  const [viewportDim, setViewportDim] = useState<{ w: number; h: number }>({ w: 800, h: 600 });

  // Dragging interaction state
  const [activeDrag, setActiveDrag] = useState<{
    type: "mask" | "text";
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const dimension: DimensionPreset = EXPORT_SIZES[selectedFormat] || EXPORT_SIZES["Portrait 3:4 (1200x1600)"];
  const currentPalette: ColorPalette = COLOR_PALETTES[selectedPaletteKey] || COLOR_PALETTES.whiteOnDark;

  // Viewport Observer
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

  // Multi-Mask Management Handlers
  const handleAddMask = () => {
    const newId = `mask-${Date.now()}`;
    const newMask: MaskLayer = {
      id: newId,
      enabled: true,
      width: 400,
      height: 280,
      borderColor: "palette",
      borderWidth: 2,
      showCrosshair: true,
      posX: 0.5 + (masks.length * 0.05) % 0.3,
      posY: 0.5 + (masks.length * 0.05) % 0.3
    };
    setMasks((prev) => [...prev, newMask]);
    setSelectedMaskId(newId);
  };

  const handleDeleteMask = (id: string) => {
    if (masks.length <= 1) return;
    setMasks((prev) => prev.filter((m) => m.id !== id));
    if (selectedMaskId === id) {
      const remaining = masks.filter((m) => m.id !== id);
      setSelectedMaskId(remaining[0].id);
    }
  };

  const handleUpdateMask = (id: string, updates: Partial<MaskLayer>) => {
    setMasks((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  // Multi-Text Management Handlers
  const handleAddText = () => {
    const newId = `text-${Date.now()}`;
    const newText: TextLayer = {
      id: newId,
      enabled: true,
      text: "NEW BRAND ASSET",
      fontSize: 54,
      textAlign: "center",
      color: "#ffffff",
      posX: 0.5 + (texts.length * 0.05) % 0.3,
      posY: 0.5 + (texts.length * 0.05) % 0.3
    };
    setTexts((prev) => [...prev, newText]);
    setSelectedTextId(newId);
  };

  const handleDeleteText = (id: string) => {
    if (texts.length <= 1) return;
    setTexts((prev) => prev.filter((t) => t.id !== id));
    if (selectedTextId === id) {
      const remaining = texts.filter((t) => t.id !== id);
      setSelectedTextId(remaining[0].id);
    }
  };

  const handleUpdateText = (id: string, updates: Partial<TextLayer>) => {
    setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  // Render Canvas Algorithm
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = dimension;
    canvas.width = w;
    canvas.height = h;

    // 1. Draw Background Base
    ctx.fillStyle = currentPalette.bg;
    ctx.fillRect(0, 0, w, h);

    if (bgImage) {
      ctx.save();
      const imgRatio = bgImage.width / bgImage.height;
      const targetRatio = w / h;
      let sw = 0, sh = 0, sx = 0, sy = 0;

      if (imgRatio > targetRatio) {
        sh = bgImage.height;
        sw = sh * targetRatio;
        sx = (bgImage.width - sw) / 2;
        sy = 0;
      } else {
        sw = bgImage.width;
        sh = sw / targetRatio;
        sx = 0;
        sy = (bgImage.height - sh) / 2;
      }

      const activeFilter = IMAGE_FILTERS[selectedFilterKey]?.filter || "none";
      ctx.filter = activeFilter;
      ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, w, h);
      ctx.restore();
    }

    // 2. Draw Gaussian Blur & Overlay Tint Film
    if (overlayEnabled) {
      ctx.save();
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.fillStyle = currentPalette.stroke;
      ctx.globalAlpha = overlayOpacity;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // 3. Render Clarity Rectangle Masks
    masks.forEach((m) => {
      if (!m.enabled) return;

      const mX = Math.round(m.posX * w - m.width / 2);
      const mY = Math.round(m.posY * h - m.height / 2);

      ctx.save();

      // Clear blur under mask to reveal sharp image underneath
      ctx.clearRect(mX, mY, m.width, m.height);
      ctx.fillStyle = currentPalette.bg;
      ctx.fillRect(mX, mY, m.width, m.height);

      if (bgImage) {
        const imgRatio = bgImage.width / bgImage.height;
        const targetRatio = w / h;
        let sw = 0, sh = 0, sx = 0, sy = 0;

        if (imgRatio > targetRatio) {
          sh = bgImage.height;
          sw = sh * targetRatio;
          sx = (bgImage.width - sw) / 2;
          sy = 0;
        } else {
          sw = bgImage.width;
          sh = sw / targetRatio;
          sx = 0;
          sy = (bgImage.height - sh) / 2;
        }

        const activeFilter = IMAGE_FILTERS[selectedFilterKey]?.filter || "none";
        ctx.filter = activeFilter;
        ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, w, h);
      }

      ctx.restore();

      // Draw Mask Bounding Border
      ctx.save();
      const bColor = m.borderColor === "palette" ? currentPalette.stroke : m.borderColor;
      ctx.strokeStyle = bColor;
      ctx.lineWidth = m.borderWidth;
      if (m.borderWidth > 0) {
        ctx.strokeRect(mX, mY, m.width, m.height);
      }

      // Draw Center Crosshair (+)
      if (m.showCrosshair) {
        ctx.strokeStyle = bColor;
        ctx.lineWidth = 1;
        const centerX = mX + m.width / 2;
        const centerY = mY + m.height / 2;
        const chSize = 14;

        ctx.beginPath();
        ctx.moveTo(centerX - chSize, centerY);
        ctx.lineTo(centerX + chSize, centerY);
        ctx.moveTo(centerX, centerY - chSize);
        ctx.lineTo(centerX, centerY + chSize);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 4. Render Multi-Typography Layers
    texts.forEach((t) => {
      if (!t.enabled || !t.text.trim()) return;

      ctx.save();
      ctx.fillStyle = currentPalette.stroke;
      ctx.font = `700 ${t.fontSize}px "Telegraf", system-ui, -apple-system, sans-serif`;
      ctx.textAlign = t.textAlign;
      ctx.textBaseline = "middle";

      const tX = t.posX * w;
      const tY = t.posY * h;
      const lines = t.text.split("\n");
      const lineHeight = t.fontSize * 1.15;
      const totalH = lines.length * lineHeight;

      lines.forEach((line, index) => {
        const lineY = tY - totalH / 2 + index * lineHeight + lineHeight / 2;
        ctx.fillText(line, tX, lineY);
      });
      ctx.restore();
    });
  }, [
    dimension,
    currentPalette,
    bgImage,
    selectedFilterKey,
    overlayEnabled,
    blurAmount,
    overlayOpacity,
    masks,
    texts
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Display Dimension Calculation
  const scaleW = viewportDim.w / dimension.w;
  const scaleH = viewportDim.h / dimension.h;
  const fitScale = Math.min(scaleW, scaleH);
  const displayW = Math.round(dimension.w * fitScale);
  const displayH = Math.round(dimension.h * fitScale);

  // Dragging Hit Test & Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    // Check hit on active text layer
    const activeText = texts.find((t) => t.id === selectedTextId);
    if (activeText && activeText.enabled) {
      const distX = Math.abs(relX - activeText.posX);
      const distY = Math.abs(relY - activeText.posY);
      if (distX < 0.15 && distY < 0.1) {
        setActiveDrag({
          type: "text",
          id: activeText.id,
          offsetX: relX - activeText.posX,
          offsetY: relY - activeText.posY
        });
        return;
      }
    }

    // Check hit on active mask layer
    const activeMask = masks.find((m) => m.id === selectedMaskId);
    if (activeMask && activeMask.enabled) {
      const normW = activeMask.width / dimension.w;
      const normH = activeMask.height / dimension.h;

      if (
        relX >= activeMask.posX - normW / 2 &&
        relX <= activeMask.posX + normW / 2 &&
        relY >= activeMask.posY - normH / 2 &&
        relY <= activeMask.posY + normH / 2
      ) {
        setActiveDrag({
          type: "mask",
          id: activeMask.id,
          offsetX: relX - activeMask.posX,
          offsetY: relY - activeMask.posY
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeDrag) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    const newPosX = Math.max(0, Math.min(1, relX - activeDrag.offsetX));
    const newPosY = Math.max(0, Math.min(1, relY - activeDrag.offsetY));

    if (activeDrag.type === "mask") {
      handleUpdateMask(activeDrag.id, { posX: newPosX, posY: newPosY });
    } else if (activeDrag.type === "text") {
      handleUpdateText(activeDrag.id, { posX: newPosX, posY: newPosY });
    }
  };

  const handleMouseUp = () => {
    setActiveDrag(null);
  };

  // Export PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `IMG300_Asset_${dimension.w}x${dimension.h}_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Export SVG
  const handleExportSVG = () => {
    const { w, h } = dimension;
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;

    // Background
    svgContent += `<rect width="${w}" height="${h}" fill="${currentPalette.bg}"/>`;

    // Render Masks in SVG
    masks.forEach((m) => {
      if (!m.enabled) return;
      const mX = Math.round(m.posX * w - m.width / 2);
      const mY = Math.round(m.posY * h - m.height / 2);
      const bColor = m.borderColor === "palette" ? currentPalette.stroke : m.borderColor;

      svgContent += `<rect x="${mX}" y="${mY}" width="${m.width}" height="${m.height}" fill="none" stroke="${bColor}" stroke-width="${m.borderWidth}"/>`;
    });

    // Render Texts in SVG
    texts.forEach((t) => {
      if (!t.enabled || !t.text.trim()) return;
      const tX = t.posX * w;
      const tY = t.posY * h;
      let anchor = "middle";
      if (t.textAlign === "left") anchor = "start";
      if (t.textAlign === "right") anchor = "end";

      const lines = t.text.split("\n");
      const lineHeight = t.fontSize * 1.15;
      const totalH = lines.length * lineHeight;

      lines.forEach((line, index) => {
        const lineY = tY - totalH / 2 + index * lineHeight + lineHeight / 2;
        svgContent += `<text x="${tX}" y="${lineY}" font-family="Telegraf, sans-serif" font-size="${t.fontSize}" font-weight="bold" fill="${currentPalette.stroke}" text-anchor="${anchor}" dominant-baseline="middle">${line}</text>`;
      });
    });

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `IMG300_Asset_${dimension.w}x${dimension.h}_${Date.now()}.svg`;
    link.href = url;
    link.click();
  };

  return (
    <div className={styles.appContainer}>
      {/* Sidebar Tool Panel Component */}
      <ToolPanel
        hasImage={!!bgImage}
        onUploadImage={(img) => setBgImage(img)}
        selectedFilter={selectedFilterKey}
        onSelectFilter={(key) => setSelectedFilterKey(key)}
        overlayEnabled={overlayEnabled}
        onToggleOverlay={(val) => setOverlayEnabled(val)}
        blurAmount={blurAmount}
        onChangeBlurAmount={(val) => setBlurAmount(val)}
        overlayOpacity={overlayOpacity}
        onChangeOverlayOpacity={(val) => setOverlayOpacity(val)}
        masks={masks}
        selectedMaskId={selectedMaskId}
        onAddMask={handleAddMask}
        onDeleteMask={handleDeleteMask}
        onSelectMask={(id) => setSelectedMaskId(id)}
        onUpdateMask={handleUpdateMask}
        texts={texts}
        selectedTextId={selectedTextId}
        onAddText={handleAddText}
        onDeleteText={handleDeleteText}
        onSelectText={(id) => setSelectedTextId(id)}
        onUpdateText={handleUpdateText}
        selectedPaletteKey={selectedPaletteKey}
        onSelectPalette={(key) => setSelectedPaletteKey(key)}
        selectedFormat={selectedFormat}
        onSelectFormat={(key) => setSelectedFormat(key)}
        onExportPNG={handleExportPNG}
        onExportSVG={handleExportSVG}
      />

      {/* Main Canvas Viewport */}
      <div className={styles.canvasViewport} ref={containerRef}>
        <div className={styles.canvasWrapper}>
          <canvas
            ref={canvasRef}
            className={styles.canvasElement}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ width: displayW, height: displayH, cursor: activeDrag ? "grabbing" : "default" }}
          />
        </div>
        <div className={styles.canvasFooter}>
          Tool created by Victor Chen
        </div>
      </div>
    </div>
  );
};
