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
  const imageBoundsRef = useRef<{ drawX: number; drawY: number; drawW: number; drawH: number } | null>(null);

  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);

  // Tile Shape Mode ("square" | "rectangle")
  const [tileShapeMode, setTileShapeMode] = useState<"square" | "rectangle">("square");

  // Grid Controls
  const [gridCols, setGridCols] = useState<number>(8); // Columns (1 to 30)
  const [gridRows, setGridRows] = useState<number>(8); // Rows (1 to 30)

  // Line Style Controls
  const [showGridLines, setShowGridLines] = useState<boolean>(true); // Show Lines ON / OFF
  const [lineWidth, setLineWidth] = useState<number>(3); // Line Thickness (1px to 20px)
  const [lineColor, setLineColor] = useState<string>("#00e5ff"); // Line Color (Hex)

  // Interactive Tile Selection (Set of "row,col" strings)
  const [selectedTiles, setSelectedTiles] = useState<Set<string>>(new Set());

  // Tile Effect Controls (Master Toggle + Mode Selection)
  const [isEffectEnabled, setIsEffectEnabled] = useState<boolean>(true); // Master Effect Toggle
  const [selectedEffectMode, setSelectedEffectMode] = useState<"cutout" | "mosaic" | "blur" | "invert">("cutout");
  const [mosaicBlockSize, setMosaicBlockSize] = useState<number>(12); // Mosaic pixel block size (4px ~ 32px)
  const [blurRadius, setBlurRadius] = useState<number>(10); // Blur radius (4px ~ 24px)

  // Load default sample image on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setSourceImage(img);
    };
    img.src = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80";
  }, []);

  // Clear Tile Selections when Grid Dimension or Shape Mode changes
  useEffect(() => {
    setSelectedTiles(new Set());
  }, [gridCols, gridRows, tileShapeMode]);

  // Handle Image Upload
  const handleUploadImage = (img: HTMLImageElement) => {
    setSourceImage(img);
    setSelectedTiles(new Set());
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

  // Helper to calculate effective column and row count based on tile shape mode
  const getEffectiveGridCounts = useCallback((drawW: number, drawH: number) => {
    let numCols = gridCols;
    let numRows = gridRows;

    if (tileShapeMode === "square") {
      const tileWidthNorm = drawW / gridCols;
      numRows = Math.max(1, Math.round(drawH / tileWidthNorm));
    }

    return { numCols, numRows };
  }, [gridCols, gridRows, tileShapeMode]);

  // Render Loop to Draw Image, Tile Effects, Selected Tile Highlights, and Grid Lines
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

      const maxW = w * 0.94;
      const maxH = h * 0.94;

      let drawW = maxW;
      let drawH = maxW / imgAspect;

      if (drawH > maxH) {
        drawH = maxH;
        drawW = maxH * imgAspect;
      }

      const drawX = (w - drawW) / 2;
      const drawY = (h - drawH) / 2;

      imageBoundsRef.current = { drawX, drawY, drawW, drawH };

      const { numCols, numRows } = getEffectiveGridCounts(drawW, drawH);

      // Drop Shadow for Image Container
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 15;

      // Draw Base Clean Uploaded Image
      ctx.drawImage(sourceImage, drawX, drawY, drawW, drawH);
      ctx.restore();

      // Render Selected Tile Generative Effects (Cutout, Mosaic, Blur, Invert)
      if (isEffectEnabled && selectedTiles.size > 0) {
        selectedTiles.forEach((tileId) => {
          const [r, c] = tileId.split(",").map(Number);
          if (r < numRows && c < numCols) {
            const tileW = drawW / numCols;
            const tileH = drawH / numRows;
            const tileX = drawX + c * tileW;
            const tileY = drawY + r * tileH;

            const srcX = (c / numCols) * sourceImage.naturalWidth;
            const srcY = (r / numRows) * sourceImage.naturalHeight;
            const srcW = sourceImage.naturalWidth / numCols;
            const srcH = sourceImage.naturalHeight / numRows;

            if (selectedEffectMode === "cutout") {
              // Mode 1: Cutout / Transparent Punch
              ctx.save();
              ctx.clearRect(tileX, tileY, tileW, tileH);
              ctx.fillStyle = "#0c0c14";
              ctx.fillRect(tileX, tileY, tileW, tileH);

              // Subdued hatched pattern for cutout tile
              ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
              ctx.lineWidth = 1;
              for (let i = -tileW; i < tileW + tileH; i += 12) {
                ctx.beginPath();
                ctx.moveTo(tileX + i, tileY);
                ctx.lineTo(tileX + i + tileH, tileY + tileH);
                ctx.stroke();
              }
              ctx.restore();
            } else if (selectedEffectMode === "mosaic") {
              // Mode 2: Pixelated Mosaic
              ctx.save();
              const blockSize = Math.max(4, mosaicBlockSize);
              const tempW = Math.max(1, Math.floor(tileW / blockSize));
              const tempH = Math.max(1, Math.floor(tileH / blockSize));

              const tempCanvas = document.createElement("canvas");
              tempCanvas.width = tempW;
              tempCanvas.height = tempH;
              const tempCtx = tempCanvas.getContext("2d");

              if (tempCtx) {
                tempCtx.imageSmoothingEnabled = false;
                tempCtx.drawImage(sourceImage, srcX, srcY, srcW, srcH, 0, 0, tempW, tempH);

                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(tempCanvas, 0, 0, tempW, tempH, tileX, tileY, tileW, tileH);
              }
              ctx.restore();
            } else if (selectedEffectMode === "blur") {
              // Mode 3: Blur / Frosted
              ctx.save();
              ctx.beginPath();
              ctx.rect(tileX, tileY, tileW, tileH);
              ctx.clip();
              ctx.filter = `blur(${Math.max(4, blurRadius)}px)`;
              ctx.drawImage(sourceImage, srcX, srcY, srcW, srcH, tileX, tileY, tileW, tileH);
              ctx.restore();
            } else if (selectedEffectMode === "invert") {
              // Mode 4: Color Invert / Negative
              ctx.save();
              ctx.beginPath();
              ctx.rect(tileX, tileY, tileW, tileH);
              ctx.clip();
              ctx.filter = "invert(100%)";
              ctx.drawImage(sourceImage, srcX, srcY, srcW, srcH, tileX, tileY, tileW, tileH);
              ctx.restore();
            }
          }
        });
      }

      // Render Selected Grid Tile Highlight Outlines
      selectedTiles.forEach((tileId) => {
        const [r, c] = tileId.split(",").map(Number);
        if (r < numRows && c < numCols) {
          const tileW = drawW / numCols;
          const tileH = drawH / numRows;
          const tileX = drawX + c * tileW;
          const tileY = drawY + r * tileH;

          // Highlight Overlay
          ctx.save();
          ctx.fillStyle = hexToRgba(lineColor, 25);
          ctx.fillRect(tileX, tileY, tileW, tileH);

          // Glowing Outline for Selected Tile
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = Math.max(3, lineWidth + 1);
          ctx.strokeRect(tileX, tileY, tileW, tileH);
          ctx.restore();
        }
      });

      // Render Grid Lines Overlay (Only when showGridLines is ON)
      if (showGridLines) {
        ctx.save();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;

        // Draw Vertical Divider Lines
        for (let c = 1; c < numCols; c++) {
          const lineX = drawX + (c / numCols) * drawW;
          ctx.beginPath();
          ctx.moveTo(lineX, drawY);
          ctx.lineTo(lineX, drawY + drawH);
          ctx.stroke();
        }

        // Draw Horizontal Divider Lines
        for (let r = 1; r < numRows; r++) {
          const lineY = drawY + (r / numRows) * drawH;
          ctx.beginPath();
          ctx.moveTo(drawX, lineY);
          ctx.lineTo(drawX + drawW, lineY);
          ctx.stroke();
        }

        // Draw Outer Frame Border Line
        ctx.strokeRect(drawX, drawY, drawW, drawH);
        ctx.restore();
      }
    } else {
      imageBoundsRef.current = null;
      // Prompt when image is loading
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = '600 16px "Space Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("UPLOAD AN IMAGE TO BEGIN MOSAIC GRID SELECTION", w / 2, h / 2);
    }
  }, [sourceImage, gridCols, gridRows, tileShapeMode, showGridLines, lineWidth, lineColor, selectedTiles, isEffectEnabled, selectedEffectMode, mosaicBlockSize, blurRadius, getEffectiveGridCounts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 1920;
      canvas.height = 1080;
    }
    renderCanvas();
  }, [renderCanvas]);

  // Handle Interactive Click Selection on Canvas Image Grid
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const bounds = imageBoundsRef.current;
    if (!canvas || !bounds) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const { drawX, drawY, drawW, drawH } = bounds;

    // Check if click is inside the image viewport bounds
    if (clickX >= drawX && clickX <= drawX + drawW && clickY >= drawY && clickY <= drawY + drawH) {
      const relX = clickX - drawX;
      const relY = clickY - drawY;

      const { numCols, numRows } = getEffectiveGridCounts(drawW, drawH);

      const col = Math.floor((relX / drawW) * numCols);
      const row = Math.floor((relY / drawH) * numRows);

      const tileId = `${row},${col}`;

      setSelectedTiles((prev) => {
        const next = new Set(prev);
        if (next.has(tileId)) {
          next.delete(tileId);
        } else {
          next.add(tileId);
        }
        return next;
      });
    }
  };

  return (
    <div className={styles.appContainer} style={{ background: "#0a0a0f", minHeight: "100vh" }}>
      {/* Sidebar Tool Panel */}
      <div className={styles.sidebar}>
        <div className={styles.brandTitle}>IMG300</div>
        <div className={styles.brandSubtitle}>Mosaic Grid Selector</div>

        {/* Image Upload Component */}
        <ImageUploader
          hasImage={!!sourceImage}
          onUploadImage={handleUploadImage}
        />

        {/* Tile Shape Mode */}
        <div className={styles.sectionHeader}>
          <span>Tile Aspect Ratio</span>
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
            <span className={styles.controlLabel}>Tile Shape Mode</span>
            <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>{tileShapeMode}</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "12px",
                fontWeight: 700,
                background: tileShapeMode === "square" ? "rgba(0, 229, 255, 0.2)" : "rgba(255, 255, 255, 0.05)",
                borderColor: tileShapeMode === "square" ? "#00e5ff" : "rgba(255, 255, 255, 0.15)",
                color: tileShapeMode === "square" ? "#00e5ff" : "#ffffff"
              }}
              onClick={() => setTileShapeMode("square")}
            >
              🔳 Square (1:1)
            </button>
            <button
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "12px",
                fontWeight: 700,
                background: tileShapeMode === "rectangle" ? "rgba(0, 229, 255, 0.2)" : "rgba(255, 255, 255, 0.05)",
                borderColor: tileShapeMode === "rectangle" ? "#00e5ff" : "rgba(255, 255, 255, 0.15)",
                color: tileShapeMode === "rectangle" ? "#00e5ff" : "#ffffff"
              }}
              onClick={() => setTileShapeMode("rectangle")}
            >
              ▮ Rectangle
            </button>
          </div>
        </div>

        {/* Grid Division Controls */}
        <div className={styles.sectionHeader}>
          <span>Grid Division</span>
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>
              {tileShapeMode === "square" ? "Square Tile Grid Columns" : "Grid Columns"}
            </span>
            <span className={styles.controlValue}>{gridCols} Cols</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={gridCols}
            onChange={(e) => setGridCols(parseInt(e.target.value))}
          />
        </div>

        {tileShapeMode === "rectangle" && (
          <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
            <div className={styles.controlHeader}>
              <span className={styles.controlLabel}>Grid Rows</span>
              <span className={styles.controlValue}>{gridRows} Rows</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={gridRows}
              onChange={(e) => setGridRows(parseInt(e.target.value))}
            />
          </div>
        )}

        {/* Tile Effect Settings (Master Toggle + Mode Selection) */}
        <div className={styles.sectionHeader}>
          <span>Tile Effect Settings</span>
        </div>

        {/* Master Effect Toggle Switch */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
            <span className={styles.controlLabel}>Apply Tile Effects</span>
            <span className={styles.controlValue}>{isEffectEnabled ? "ENABLED" : "DISABLED"}</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "12px",
                fontWeight: 700,
                background: isEffectEnabled ? "rgba(0, 255, 34, 0.2)" : "rgba(255, 255, 255, 0.05)",
                borderColor: isEffectEnabled ? "#00ff22" : "rgba(255, 255, 255, 0.15)",
                color: isEffectEnabled ? "#00ff22" : "#ffffff"
              }}
              onClick={() => setIsEffectEnabled(true)}
            >
              ✓ Enabled
            </button>
            <button
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "12px",
                fontWeight: 700,
                background: !isEffectEnabled ? "rgba(255, 59, 48, 0.2)" : "rgba(255, 255, 255, 0.05)",
                borderColor: !isEffectEnabled ? "#ff3b30" : "rgba(255, 255, 255, 0.15)",
                color: !isEffectEnabled ? "#ff3b30" : "#ffffff"
              }}
              onClick={() => setIsEffectEnabled(false)}
            >
              ✕ Disabled
            </button>
          </div>
        </div>

        {/* Effect Mode Selection (Cutout, Mosaic, Blur, Invert) */}
        {isEffectEnabled && (
          <>
            <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
              <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
                <span className={styles.controlLabel}>Effect Mode</span>
                <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>{selectedEffectMode}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button
                  style={{
                    padding: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: selectedEffectMode === "cutout" ? "rgba(0, 229, 255, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    borderColor: selectedEffectMode === "cutout" ? "#00e5ff" : "rgba(255, 255, 255, 0.15)",
                    color: selectedEffectMode === "cutout" ? "#00e5ff" : "#ffffff"
                  }}
                  onClick={() => setSelectedEffectMode("cutout")}
                >
                  🕳️ Cutout
                </button>
                <button
                  style={{
                    padding: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: selectedEffectMode === "mosaic" ? "rgba(0, 229, 255, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    borderColor: selectedEffectMode === "mosaic" ? "#00e5ff" : "rgba(255, 255, 255, 0.15)",
                    color: selectedEffectMode === "mosaic" ? "#00e5ff" : "#ffffff"
                  }}
                  onClick={() => setSelectedEffectMode("mosaic")}
                >
                  👾 Mosaic
                </button>
                <button
                  style={{
                    padding: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: selectedEffectMode === "blur" ? "rgba(0, 229, 255, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    borderColor: selectedEffectMode === "blur" ? "#00e5ff" : "rgba(255, 255, 255, 0.15)",
                    color: selectedEffectMode === "blur" ? "#00e5ff" : "#ffffff"
                  }}
                  onClick={() => setSelectedEffectMode("blur")}
                >
                  🌀 Blur
                </button>
                <button
                  style={{
                    padding: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: selectedEffectMode === "invert" ? "rgba(0, 229, 255, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    borderColor: selectedEffectMode === "invert" ? "#00e5ff" : "rgba(255, 255, 255, 0.15)",
                    color: selectedEffectMode === "invert" ? "#00e5ff" : "#ffffff"
                  }}
                  onClick={() => setSelectedEffectMode("invert")}
                >
                  🔄 Invert
                </button>
              </div>
            </div>

            {/* Mosaic Block Size Slider */}
            {selectedEffectMode === "mosaic" && (
              <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
                <div className={styles.controlHeader}>
                  <span className={styles.controlLabel}>Mosaic Block Size</span>
                  <span className={styles.controlValue}>{mosaicBlockSize}px</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={32}
                  step={2}
                  value={mosaicBlockSize}
                  onChange={(e) => setMosaicBlockSize(parseInt(e.target.value))}
                />
              </div>
            )}

            {/* Blur Radius Slider */}
            {selectedEffectMode === "blur" && (
              <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
                <div className={styles.controlHeader}>
                  <span className={styles.controlLabel}>Blur Radius</span>
                  <span className={styles.controlValue}>{blurRadius}px</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={24}
                  step={2}
                  value={blurRadius}
                  onChange={(e) => setBlurRadius(parseInt(e.target.value))}
                />
              </div>
            )}
          </>
        )}

        {/* Grid Line Display Toggle */}
        <div className={styles.sectionHeader}>
          <span>Line Display Settings</span>
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
            <span className={styles.controlLabel}>Show Grid Lines</span>
            <span className={styles.controlValue}>{showGridLines ? "VISIBLE" : "HIDDEN"}</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "12px",
                fontWeight: 700,
                background: showGridLines ? "rgba(0, 229, 255, 0.2)" : "rgba(255, 255, 255, 0.05)",
                borderColor: showGridLines ? "#00e5ff" : "rgba(255, 255, 255, 0.15)",
                color: showGridLines ? "#00e5ff" : "#ffffff"
              }}
              onClick={() => setShowGridLines(true)}
            >
              ✓ Visible
            </button>
            <button
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "12px",
                fontWeight: 700,
                background: !showGridLines ? "rgba(255, 59, 48, 0.2)" : "rgba(255, 255, 255, 0.05)",
                borderColor: !showGridLines ? "#ff3b30" : "rgba(255, 255, 255, 0.15)",
                color: !showGridLines ? "#ff3b30" : "#ffffff"
              }}
              onClick={() => setShowGridLines(false)}
            >
              ✕ Hidden
            </button>
          </div>
        </div>

        {/* Line Thickness */}
        {showGridLines && (
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
        )}

        {/* Line Color Picker & Swatches */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
            <span className={styles.controlLabel}>Line &amp; Highlight Color</span>
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

        {/* Selected Tiles Indicator */}
        <div
          style={{
            background: selectedTiles.size > 0 ? "rgba(0, 229, 255, 0.08)" : "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "6px",
            padding: "12px",
            fontSize: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Click Canvas to Select</span>
            <span style={{ color: lineColor, fontWeight: 700 }}>
              {selectedTiles.size} Selected
            </span>
          </div>

          {selectedTiles.size > 0 && (
            <button
              style={{
                width: "100%",
                padding: "6px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#ff3b30",
                borderColor: "#ff3b30",
                background: "rgba(255, 59, 48, 0.1)"
              }}
              onClick={() => setSelectedTiles(new Set())}
            >
              Clear Selection ({selectedTiles.size})
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport */}
      <div className={styles.canvasViewport} ref={containerRef}>
        <div className={styles.canvasWrapper} style={{ position: "relative" }}>
          {/* Real-time Canvas */}
          <canvas
            ref={canvasRef}
            className={styles.canvasElement}
            onClick={handleCanvasClick}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              borderRadius: "8px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
              cursor: "pointer"
            }}
          />
        </div>

        <div className={styles.canvasFooter}>
          IMG300 Studio • {selectedEffectMode.toUpperCase()} Effect ({selectedTiles.size} Tiles Affected)
        </div>
      </div>
    </div>
  );
};
