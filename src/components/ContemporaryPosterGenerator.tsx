"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/page.module.scss";
import {
  ImageControl,
  MaskControl,
  ShapeControl,
  CanvasViewport,
  ExportControls,
  CanvasSizeSelector,
  TypographyControl,
  TextLayer,
  LayerManagerControl,
  useLayerManager,
  useCanvasTextDrag,
  PosterLayer
} from "./common";
import { ASPECT_RATIOS } from "./common/CanvasSizeSelector";
import { exportCanvasToPNG, exportSVGString } from "../utils/exportUtils";

export const ContemporaryPosterGenerator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Format & Mobile Drawer State
  const [selectedFormat, setSelectedFormat] = useState<string>("3:4");
  const [isMobileCollapsed, setIsMobileCollapsed] = useState<boolean>(false);

  // 2. Multi-Layer Z-Index Manager Hook
  const {
    layers,
    selectedLayerId,
    setSelectedLayerId,
    addTextLayer,
    addImageLayer,
    addMaskLayer,
    addShapeLayer,
    removeLayer,
    updateLayer,
    reorderLayersById
  } = useLayerManager([]);

  // 3. Multi-Layer Drag & Selection Hook
  const {
    onMouseDownCanvas,
    onMouseMoveCanvas,
    onMouseUpCanvas,
    onMouseLeaveCanvas,
    cursor: dragCursor
  } = useCanvasTextDrag({
    layers,
    selectedLayerId,
    onSelectLayer: setSelectedLayerId,
    onUpdateLayer: updateLayer,
    canvasRef
  });

  // Layer Adapters
  const imageLayers = layers.filter((l) => l.type === "image");
  const maskLayers = layers.filter((l) => l.type === "mask");
  const shapeLayers = layers.filter((l) => l.type === "shape");

  const handleUploadNewImage = (img: HTMLImageElement, filename?: string) => {
    addImageLayer(img, filename || "Uploaded Image");
  };

  // Text Layer Adapter Functions for TypographyControl
  const textLayersAdapter: TextLayer[] = layers
    .filter((l) => l.type === "text")
    .map((l) => ({
      id: l.id,
      enabled: l.visible,
      text: l.text || "",
      fontSize: l.fontSize || 48,
      fontFamily: l.fontFamily || '"Telegraf", system-ui, sans-serif',
      textAlign: l.textAlign || "center",
      color: l.color || "#000000",
      posX: l.posX,
      posY: l.posY
    }));

  const handleUpdateTextAdapter = (id: string, updates: Partial<TextLayer>) => {
    updateLayer(id, updates as any);
  };

  // Get Target Canvas Dimensions based on selected Aspect Ratio
  const getCanvasDimensions = useCallback((formatKey: string) => {
    const found = ASPECT_RATIOS.find(
      (r) => r.key === formatKey || r.label === formatKey
    );
    if (found) {
      return { w: found.w, h: found.h };
    }
    return { w: 1200, h: 1600 };
  }, []);

  // Helper to draw a shape path onto a canvas 2D context
  const drawShapePath = useCallback(
    (ctx: CanvasRenderingContext2D, layer: PosterLayer, W: number, H: number) => {
      const posX = W * layer.posX;
      const posY = H * layer.posY;
      const rotRad = ((layer.rotation || 0) * Math.PI) / 180;
      const sc = layer.scale || 1.0;
      const baseW = 160 * sc;
      const baseH = 160 * sc;
      const shapeType = layer.vectorShapeType || "rectangle";

      ctx.save();
      ctx.translate(posX, posY);
      ctx.rotate(rotRad);

      const aspect = layer.aspectRatio ?? 1.0;
      const rx = (baseW / 2) * aspect;
      const ry = baseH / 2;

      ctx.beginPath();
      if (shapeType === "rectangle") {
        ctx.rect(-rx, -ry, rx * 2, ry * 2);
      } else if (shapeType === "ellipse") {
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      } else if (shapeType === "polygon") {
        const sides = Math.max(3, layer.sides || 5);
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
          const px = rx * Math.cos(angle);
          const py = ry * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      }

      ctx.fill();
      if ((layer.strokeWidth ?? 0) > 0) {
        ctx.lineWidth = (layer.strokeWidth ?? 0) * sc;
        ctx.stroke();
      }

      ctx.restore();
    },
    []
  );

  // Canvas Render Loop (Renders layers strictly in array order: [0] bottom to [last] top)
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = getCanvasDimensions(selectedFormat);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const W = w;
    const H = h;

    // 1. Fill Blank White Poster Canvas Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // Collect all cutout shapes in document
    const cutoutShapes = layers.filter(
      (l) => l.type === "shape" && l.isCutout && l.visible
    );

    // 2. Render Layers in Z-Index Order ([0] is bottommost, [last] is topmost)
    layers.forEach((layer) => {
      if (!layer.visible) return;

      const posX = W * layer.posX;
      const posY = H * layer.posY;

      // Render Image Layer
      if (layer.type === "image" && layer.imageElement && layer.imageElement.complete) {
        ctx.save();
        ctx.globalAlpha = layer.opacity ?? 1.0;

        const imgW = layer.imageElement.naturalWidth;
        const imgH = layer.imageElement.naturalHeight;
        const imgAspect = imgW / imgH;

        const margin = 40;
        const maxW = W - margin * 2;
        const maxH = H - margin * 2;
        const boxAspect = maxW / maxH;

        let drawW = maxW;
        let drawH = maxH;

        if (imgAspect > boxAspect) {
          drawW = maxW;
          drawH = maxW / imgAspect;
        } else {
          drawH = maxH;
          drawW = maxH * imgAspect;
        }

        drawW *= layer.scale || 1.0;
        drawH *= layer.scale || 1.0;

        const drawX = posX - drawW / 2;
        const drawY = posY - drawH / 2;

        ctx.drawImage(layer.imageElement, drawX, drawY, drawW, drawH);
        ctx.restore();

        // Draw Selection Bounding Outline if selected
        if (layer.id === selectedLayerId) {
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3;
          ctx.strokeRect(drawX - 4, drawY - 4, drawW + 8, drawH + 8);
        }
      }

      // Render Vector Shape Layer
      if (layer.type === "shape") {
        const sc = layer.scale || 1.0;
        const baseW = 160 * sc;
        const baseH = 160 * sc;
        const rotRad = ((layer.rotation || 0) * Math.PI) / 180;

        if (!layer.isCutout) {
          // Normal solid shape rendering
          ctx.save();
          ctx.globalAlpha = layer.opacity ?? 1.0;
          ctx.fillStyle = layer.fillColor || "#ff3b30";
          ctx.strokeStyle = layer.strokeColor || "#000000";
          drawShapePath(ctx, layer, W, H);
          ctx.restore();
        }

        // Draw Selection Bounding Outline if selected
        if (layer.id === selectedLayerId) {
          const aspect = layer.aspectRatio ?? 1.0;
          const rx = (baseW / 2) * aspect;
          const ry = baseH / 2;

          ctx.save();
          ctx.translate(posX, posY);
          ctx.rotate(rotRad);
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(-rx - 6, -ry - 6, rx * 2 + 12, ry * 2 + 12);
          ctx.restore();
        }
      }

      // Render Mask Layer with Cutout Punch-Through
      if (layer.type === "mask") {
        const maskW = W * (layer.scale || 1.0);
        const maskH = H * (layer.scale || 1.0);
        const maskX = posX - maskW / 2;
        const maskY = posY - maskH / 2;

        if (cutoutShapes.length > 0) {
          // Offscreen Canvas for punching Cutout Shapes out of Mask Layer
          const offCanvas = document.createElement("canvas");
          offCanvas.width = W;
          offCanvas.height = H;
          const offCtx = offCanvas.getContext("2d");

          if (offCtx) {
            // Draw Mask rectangle on offscreen buffer
            offCtx.fillStyle = layer.maskColor || "#000000";
            offCtx.fillRect(maskX, maskY, maskW, maskH);

            // Punch out all Cutout Shapes using destination-out
            offCtx.globalCompositeOperation = "destination-out";
            offCtx.fillStyle = "#ffffff";
            offCtx.strokeStyle = "#ffffff";

            cutoutShapes.forEach((shapeLayer) => {
              drawShapePath(offCtx, shapeLayer, W, H);
            });
          }

          ctx.save();
          ctx.globalAlpha = layer.maskOpacity ?? 0.85;
          ctx.drawImage(offCanvas, 0, 0);
          ctx.restore();
        } else {
          // Normal solid mask
          ctx.save();
          ctx.globalAlpha = layer.maskOpacity ?? 0.85;
          ctx.fillStyle = layer.maskColor || "#000000";
          ctx.fillRect(maskX, maskY, maskW, maskH);
          ctx.restore();
        }

        // Draw Selection Bounding Outline if selected
        if (layer.id === selectedLayerId) {
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(maskX - 4, maskY - 4, maskW + 8, maskH + 8);
          ctx.setLineDash([]);
        }
      }

      // Render Text Layer
      if (layer.type === "text" && layer.text && layer.text.trim()) {
        ctx.save();
        ctx.globalAlpha = layer.opacity ?? 1.0;
        ctx.fillStyle = layer.color || "#000000";
        const fontFamilyStr = layer.fontFamily || '"Telegraf", system-ui, sans-serif';
        ctx.font = `700 ${layer.fontSize || 48}px ${fontFamilyStr}`;
        ctx.textAlign = layer.textAlign || "center";
        ctx.textBaseline = "middle";

        const lines = layer.text.split("\n");
        const lineHeight = (layer.fontSize || 48) * 1.2;
        const startY = posY - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, idx) => {
          ctx.fillText(line, posX, startY + idx * lineHeight);
        });
        ctx.restore();

        // Draw Selection Bounding Outline if selected
        if (layer.id === selectedLayerId) {
          let maxW = 0;
          lines.forEach((line) => {
            const width = ctx.measureText(line).width;
            if (width > maxW) maxW = width;
          });
          const totalH = lines.length * lineHeight;
          let boxX = posX - maxW / 2;
          if (layer.textAlign === "left") boxX = posX;
          if (layer.textAlign === "right") boxX = posX - maxW;

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(boxX - 8, startY - lineHeight / 2 - 4, maxW + 16, totalH + 8);
          ctx.setLineDash([]);
        }
      }
    });
  }, [layers, selectedLayerId, selectedFormat, getCanvasDimensions, drawShapePath]);

  // Render when dependencies change and when Web Fonts finish loading
  useEffect(() => {
    renderCanvas();
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        renderCanvas();
      });
    }
  }, [renderCanvas]);

  // Export Handlers
  const handleExportPNG = () => {
    exportCanvasToPNG(canvasRef.current, "contemporary-poster");
  };

  const handleExportSVG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">`;
    const svgImage = `<image href="${canvas.toDataURL("image/png")}" width="${canvas.width}" height="${canvas.height}"/>`;
    const svgFooter = `</svg>`;
    exportSVGString(svgHeader + svgImage + svgFooter, "contemporary-poster");
  };

  return (
    <div className={styles.appContainer}>
      {/* Sidebar Controls Drawer */}
      <div className={`${styles.sidebar} ${isMobileCollapsed ? styles.collapsed : ""}`}>
        {/* Mobile Drag Handle Bar */}
        <div
          className={styles.dragHandleBar}
          onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}
        >
          <div className={styles.dragHandlePill} />
          <span className={styles.controlsHeaderTitle}>
            {isMobileCollapsed ? "Tap to Expand Controls" : "Contemporary Poster Studio"}
          </span>
        </div>

        {/* Brand Header */}
        <div className={styles.brandTitle}>IMG300</div>
        <div className={styles.brandSubtitle}>Contemporary Poster Studio</div>

        {/* 1. Aspect Ratio Cards Selector */}
        <CanvasSizeSelector
          label="Aspect Ratio"
          selectedFormat={selectedFormat}
          onSelectFormat={setSelectedFormat}
        />

        {/* 2. Multi-Layer Stack Manager Control Panel */}
        <LayerManagerControl
          layers={layers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onRemoveLayer={removeLayer}
          onReorderLayers={reorderLayersById}
        />

        {/* 3. Dedicated Multi-Image Control Component */}
        <ImageControl
          imageLayers={imageLayers}
          selectedLayerId={selectedLayerId}
          onUploadNewImage={handleUploadNewImage}
          onSelectImage={setSelectedLayerId}
          onUpdateImage={updateLayer}
        />

        {/* 4. Dedicated Vector Shape Control Component */}
        <ShapeControl
          shapeLayers={shapeLayers}
          selectedLayerId={selectedLayerId}
          onAddShape={() => addShapeLayer()}
          onDeleteShape={removeLayer}
          onSelectShape={setSelectedLayerId}
          onUpdateShape={updateLayer}
        />

        {/* 5. Shared Typography Control Component */}
        <TypographyControl
          texts={textLayersAdapter}
          selectedTextId={selectedLayerId || ""}
          onAddText={() => addTextLayer()}
          onDeleteText={removeLayer}
          onSelectText={setSelectedLayerId}
          onUpdateText={handleUpdateTextAdapter}
        />

        {/* Export Controls Component */}
        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <ExportControls onExportPNG={handleExportPNG} onExportSVG={handleExportSVG} />
        </div>
      </div>

      {/* Shared Canvas Viewport Component with Multi-Layer Selection & Dragging */}
      <CanvasViewport
        canvasRef={canvasRef}
        containerRef={containerRef}
        onMouseDownCanvas={onMouseDownCanvas}
        onMouseMoveCanvas={onMouseMoveCanvas}
        onMouseUpCanvas={onMouseUpCanvas}
        onMouseLeaveCanvas={onMouseLeaveCanvas}
        isMobileCollapsed={isMobileCollapsed}
        cursor={dragCursor}
      />
    </div>
  );
};
