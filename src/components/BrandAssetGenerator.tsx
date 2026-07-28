"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/page.module.scss";
import {
  EXPORT_SIZES,
  COLOR_PALETTES,
  ColorPalette,
  DimensionPreset
} from "../constants/generatorPresets";
import { ToolPanel, IMAGE_FILTERS, MaskLayer, TextLayer } from "./toolPanel";

export const BrandAssetGenerator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Core State
  const [selectedFormat, setSelectedFormat] = useState<string>("Portrait 3:4 (1200x1600)");
  const [selectedPaletteKey, setSelectedPaletteKey] = useState<string>("whiteOnDark");
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [imageFilter, setImageFilter] = useState<string>("none");

  // Overlay Film & Gaussian Blur State
  const [overlayEnabled, setOverlayEnabled] = useState<boolean>(false);
  const [blurAmount, setBlurAmount] = useState<number>(12);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.35);

  // Multi-Mask State
  const [masks, setMasks] = useState<MaskLayer[]>([
    {
      id: "mask-1",
      enabled: false,
      width: 400,
      height: 250,
      borderColor: "palette",
      borderWidth: 2,
      showCrosshair: true,
      posX: 0.5,
      posY: 0.5
    }
  ]);
  const [selectedMaskId, setSelectedMaskId] = useState<string>("mask-1");

  // Multi-Text State
  const [texts, setTexts] = useState<TextLayer[]>([
    {
      id: "text-1",
      enabled: true,
      text: "IMG300",
      fontSize: 64,
      textAlign: "left",
      posX: 0.08,
      posY: 0.88
    }
  ]);
  const [selectedTextId, setSelectedTextId] = useState<string>("text-1");

  // Interactive Dragging Target with Relative Mouse Grab Offsets
  const [activeDrag, setActiveDrag] = useState<{
    type: "mask" | "text";
    id: string;
    offsetX: number; // Mouse relX minus element posX
    offsetY: number; // Mouse relY minus element posY
  } | null>(null);

  const [viewportDim, setViewportDim] = useState<{ w: number; h: number }>({ w: 800, h: 600 });

  const palette: ColorPalette = COLOR_PALETTES[selectedPaletteKey] || COLOR_PALETTES.whiteOnDark;
  const dimension: DimensionPreset = EXPORT_SIZES[selectedFormat] || EXPORT_SIZES["Portrait 3:4 (1200x1600)"];

  // Resize Viewport Observer
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

  // Multi-Mask Handlers
  const handleAddMask = () => {
    const newId = `mask-${Date.now()}`;
    const newMask: MaskLayer = {
      id: newId,
      enabled: true,
      width: 380,
      height: 240,
      borderColor: "palette",
      borderWidth: 2,
      showCrosshair: true,
      posX: 0.3 + Math.random() * 0.4,
      posY: 0.3 + Math.random() * 0.4
    };
    setMasks((prev) => [...prev, newMask]);
    setSelectedMaskId(newId);
  };

  const handleDeleteMask = (id: string) => {
    if (masks.length <= 1) return;
    const remaining = masks.filter((m) => m.id !== id);
    setMasks(remaining);
    if (selectedMaskId === id) {
      setSelectedMaskId(remaining[0].id);
    }
  };

  const handleUpdateMask = (id: string, updates: Partial<MaskLayer>) => {
    setMasks((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  // Multi-Text Handlers
  const handleAddText = () => {
    const newId = `text-${Date.now()}`;
    const newText: TextLayer = {
      id: newId,
      enabled: true,
      text: "NEW TEXT",
      fontSize: 48,
      textAlign: "left",
      posX: 0.2 + Math.random() * 0.5,
      posY: 0.2 + Math.random() * 0.5
    };
    setTexts((prev) => [...prev, newText]);
    setSelectedTextId(newId);
  };

  const handleDeleteText = (id: string) => {
    if (texts.length <= 1) return;
    const remaining = texts.filter((t) => t.id !== id);
    setTexts(remaining);
    if (selectedTextId === id) {
      setSelectedTextId(remaining[0].id);
    }
  };

  const handleUpdateText = (id: string, updates: Partial<TextLayer>) => {
    setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  // Display Dimension Calculation
  const scaleW = viewportDim.w / dimension.w;
  const scaleH = viewportDim.h / dimension.h;
  const fitScale = Math.min(scaleW, scaleH);
  const displayW = Math.round(dimension.w * fitScale);
  const displayH = Math.round(dimension.h * fitScale);

  // Helper for Precise Text Bounding Box Calculation
  const getTextBounds = (ctx: CanvasRenderingContext2D, t: TextLayer) => {
    const scaledFontSize = (dimension.h / 1000) * t.fontSize;
    ctx.font = `700 ${scaledFontSize}px "Telegraf", system-ui, -apple-system, sans-serif`;

    const textX = t.posX * dimension.w;
    const textY = t.posY * dimension.h;
    const lines = t.text.split("\n");
    const lineHeight = scaledFontSize * 1.15;

    let maxW = 0;
    lines.forEach((line) => {
      const w = ctx.measureText(line.toUpperCase()).width;
      if (w > maxW) maxW = w;
    });

    const totalH = Math.max(scaledFontSize, lines.length * lineHeight);

    let left = textX;
    if (t.textAlign === "center") left = textX - maxW / 2;
    else if (t.textAlign === "right") left = textX - maxW;

    const top = textY - totalH / 2;
    const right = left + maxW;
    const bottom = top + totalH;

    return { left, right, top, bottom, width: maxW, height: totalH, textX, textY };
  };

  // Render Canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = dimension.w;
    canvas.height = dimension.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background fill
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, dimension.w, dimension.h);

    let sw = 0, sh = 0, sx = 0, sy = 0;
    if (bgImage) {
      const imgRatio = bgImage.width / bgImage.height;
      const targetRatio = dimension.w / dimension.h;

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

      // Draw Base Background Image with Color Filter & Gaussian Blur
      ctx.save();
      let filterStr = IMAGE_FILTERS[imageFilter]?.filter || "none";
      if (overlayEnabled && blurAmount > 0) {
        const blurStr = `blur(${blurAmount}px)`;
        filterStr = filterStr !== "none" ? `${filterStr} ${blurStr}` : blurStr;
      }

      ctx.filter = filterStr;
      ctx.globalAlpha = 1.0;
      ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, dimension.w, dimension.h);
      ctx.restore();
    }

    // Render Semi-transparent Overlay Film Layer
    if (overlayEnabled && overlayOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = overlayOpacity;
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, dimension.w, dimension.h);
      ctx.restore();
    }

    // Render Sharp Unblurred Rectangle Clarity Masks
    masks.forEach((m) => {
      if (!m.enabled) return;
      const maskX = m.posX * dimension.w;
      const maskY = m.posY * dimension.h;

      ctx.save();
      ctx.beginPath();
      ctx.rect(maskX - m.width / 2, maskY - m.height / 2, m.width, m.height);
      ctx.clip();

      if (bgImage) {
        ctx.filter = IMAGE_FILTERS[imageFilter]?.filter || "none";
        ctx.globalAlpha = 1.0;
        ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, dimension.w, dimension.h);
      }

      const strokeColor = m.borderColor === "palette" ? palette.stroke : m.borderColor;

      if (m.borderWidth > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = m.borderWidth;
        ctx.globalAlpha = 0.9;
        ctx.stroke();
      }

      if (m.showCrosshair) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(1, m.borderWidth > 0 ? Math.min(m.borderWidth, 3) : 1.5);
        ctx.globalAlpha = 0.85;

        const crossSize = Math.min(24, Math.min(m.width, m.height) * 0.2);
        ctx.beginPath();
        ctx.moveTo(maskX - crossSize, maskY);
        ctx.lineTo(maskX + crossSize, maskY);
        ctx.moveTo(maskX, maskY - crossSize);
        ctx.lineTo(maskX, maskY + crossSize);
        ctx.stroke();
      }

      ctx.restore();
    });

    // Render Custom Movable Text Layers
    texts.forEach((t) => {
      if (!t.enabled || !t.text.trim()) return;
      ctx.save();
      ctx.fillStyle = palette.stroke;
      ctx.globalAlpha = 0.95;

      const scaledFontSize = (dimension.h / 1000) * t.fontSize;
      ctx.font = `700 ${scaledFontSize}px "Telegraf", system-ui, -apple-system, sans-serif`;
      ctx.textAlign = t.textAlign;
      ctx.textBaseline = "middle";

      const textX = t.posX * dimension.w;
      const textY = t.posY * dimension.h;

      const lines = t.text.split("\n");
      const lineHeight = scaledFontSize * 1.15;
      const totalHeight = (lines.length - 1) * lineHeight;
      const startY = textY - totalHeight / 2;

      lines.forEach((line, idx) => {
        const lineY = startY + idx * lineHeight;
        ctx.fillText(line.toUpperCase(), textX, lineY);
      });

      ctx.restore();
    });

    // Minimal Metadata Details (Bottom Right)
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = palette.stroke;
    ctx.font = `10px "SF Mono", "Menlo", monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${dimension.w} × ${dimension.h} PX`, dimension.w - 20, dimension.h - 20);
  }, [dimension, palette, bgImage, imageFilter, overlayEnabled, blurAmount, overlayOpacity, masks, texts]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Interactive Relative Dragging Handlers
  const updatePositionFromMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeDrag) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const newPosX = Math.max(0, Math.min(1, relX - activeDrag.offsetX));
    const newPosY = Math.max(0, Math.min(1, relY - activeDrag.offsetY));

    if (activeDrag.type === "mask") {
      handleUpdateMask(activeDrag.id, { posX: newPosX, posY: newPosY });
    } else if (activeDrag.type === "text") {
      handleUpdateText(activeDrag.id, { posX: newPosX, posY: newPosY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const pxX = relX * dimension.w;
    const pxY = relY * dimension.h;

    // 1. Precise Bounding Box Hit Testing for Text Layers (prioritized)
    const padding = 12; // Extra grab buffer around text
    let hitText: TextLayer | null = null;

    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      if (!t.enabled || !t.text.trim()) continue;
      const bounds = getTextBounds(ctx, t);
      if (
        pxX >= bounds.left - padding &&
        pxX <= bounds.right + padding &&
        pxY >= bounds.top - padding &&
        pxY <= bounds.bottom + padding
      ) {
        hitText = t;
        break;
      }
    }

    if (hitText) {
      setSelectedTextId(hitText.id);
      setActiveDrag({
        type: "text",
        id: hitText.id,
        offsetX: relX - hitText.posX,
        offsetY: relY - hitText.posY
      });
      return;
    }

    // 2. Precise Bounding Box Hit Testing for Mask Layers
    let hitMask: MaskLayer | null = null;
    for (let i = masks.length - 1; i >= 0; i--) {
      const m = masks[i];
      if (!m.enabled) continue;
      const maskX = m.posX * dimension.w;
      const maskY = m.posY * dimension.h;
      if (
        pxX >= maskX - m.width / 2 - padding &&
        pxX <= maskX + m.width / 2 + padding &&
        pxY >= maskY - m.height / 2 - padding &&
        pxY <= maskY + m.height / 2 + padding
      ) {
        hitMask = m;
        break;
      }
    }

    if (hitMask) {
      setSelectedMaskId(hitMask.id);
      setActiveDrag({
        type: "mask",
        id: hitMask.id,
        offsetX: relX - hitMask.posX,
        offsetY: relY - hitMask.posY
      });
      return;
    }

    // 3. Fallback: Select and move active text layer if clicked elsewhere
    const activeText = texts.find((t) => t.id === selectedTextId) || texts[0];
    if (activeText && activeText.enabled) {
      setSelectedTextId(activeText.id);
      setActiveDrag({
        type: "text",
        id: activeText.id,
        offsetX: relX - activeText.posX,
        offsetY: relY - activeText.posY
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeDrag) {
      updatePositionFromMouse(e);
    }
  };

  const handleMouseUp = () => {
    setActiveDrag(null);
  };

  // Export PNG
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `IMG300_${dimension.w}x${dimension.h}_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Export SVG
  const exportSVG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${dimension.w}" height="${dimension.h}">
      <image href="${dataUrl}" width="${dimension.w}" height="${dimension.h}"/>
    </svg>`;
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.download = `IMG300_${dimension.w}x${dimension.h}_${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  return (
    <div className={styles.appContainer}>
      {/* Modularized Tool Panel Sidebar */}
      <ToolPanel
        hasImage={!!bgImage}
        onUploadImage={(img) => setBgImage(img)}
        selectedFilter={imageFilter}
        onSelectFilter={(filterKey) => setImageFilter(filterKey)}
        overlayEnabled={overlayEnabled}
        onToggleOverlay={(enabled) => setOverlayEnabled(enabled)}
        blurAmount={blurAmount}
        onChangeBlurAmount={(b) => setBlurAmount(b)}
        overlayOpacity={overlayOpacity}
        onChangeOverlayOpacity={(op) => setOverlayOpacity(op)}
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
        onSelectPalette={(paletteKey) => setSelectedPaletteKey(paletteKey)}
        selectedFormat={selectedFormat}
        onSelectFormat={(formatKey) => setSelectedFormat(formatKey)}
        onExportPNG={exportPNG}
        onExportSVG={exportSVG}
      />

      {/* Canvas Viewport with Movable Text and Mask Drag Interactivity */}
      <div className={styles.canvasViewport} ref={containerRef}>
        <div className={styles.canvasWrapper}>
          <canvas
            ref={canvasRef}
            className={styles.canvasElement}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ width: displayW, height: displayH, cursor: activeDrag ? "grabbing" : "move" }}
          />
        </div>
        <div className={styles.canvasFooter}>
          Tool created by Victor Chen
        </div>
      </div>
    </div>
  );
};
