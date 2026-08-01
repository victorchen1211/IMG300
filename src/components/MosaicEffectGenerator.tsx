"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/page.module.scss";
import { ImageUploader } from "./common";

// Preset Color Swatches for Border Color (Including White Default & Transparent)
const BORDER_PRESET_COLORS = [
  { name: "White", value: "#ffffff" },
  { name: "Transparent", value: "transparent" },
  { name: "Cyan", value: "#00e5ff" },
  { name: "Green", value: "#00ff22" },
  { name: "Pink", value: "#ff007f" },
  { name: "Yellow", value: "#ffea00" },
  { name: "Black", value: "#000000" }
];

// Preset Color Swatches for Cutout Background
const CUTOUT_BG_COLORS = [
  { name: "Dark Studio", value: "#0a0a0f" },
  { name: "Pure White", value: "#ffffff" },
  { name: "Transparent", value: "transparent" },
  { name: "Neon Pink", value: "#ff007f" },
  { name: "Cyber Cyan", value: "#00e5ff" }
];

export const MosaicEffectGenerator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageBoundsRef = useRef<{ drawX: number; drawY: number; drawW: number; drawH: number } | null>(null);

  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);

  // 1. Square Grid Dimension (Strictly Square Tiles Only)
  const [gridCount, setGridCount] = useState<number>(8); // Square Grid Division Count (1 to 30)

  // 2. Reference Base Grid Toggle (Pure Reference Overlay, No Custom Color)
  const [showReferenceGrid, setShowReferenceGrid] = useState<boolean>(true);

  // 3. Selected Tile Border Controls (Default White, Includes Transparent)
  const [borderWidth, setBorderWidth] = useState<number>(2); // 0px to 20px (0 = No Border)
  const [borderColor, setBorderColor] = useState<string>("#ffffff"); // Default Pure White

  // 4. Interactive Tile Selection (Set of "row,col" strings)
  const [selectedTiles, setSelectedTiles] = useState<Set<string>>(new Set());

  // 5. Style Controls (Clean Text Buttons: Cutout, Mosaic, Blur, Invert)
  const [isEffectEnabled, setIsEffectEnabled] = useState<boolean>(true); // Master Effect Switch
  const [selectedEffectMode, setSelectedEffectMode] = useState<"cutout" | "mosaic" | "blur" | "invert">("cutout");

  // 6. Style Sub-Parameters
  const [cutoutBgColor, setCutoutBgColor] = useState<string>("#0a0a0f"); // Cutout Background Color
  const [mosaicBlockSize, setMosaicBlockSize] = useState<number>(14); // Mosaic Resolution (4px ~ 40px)
  const [blurRadius, setBlurRadius] = useState<number>(10); // Blur Radius (4px ~ 24px)

  // Load default sample image on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setSourceImage(img);
    };
    img.src = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80";
  }, []);

  // Clear Tile Selections when Grid Dimension changes
  useEffect(() => {
    setSelectedTiles(new Set());
  }, [gridCount]);

  // Handle Image Upload
  const handleUploadImage = (img: HTMLImageElement) => {
    setSourceImage(img);
    setSelectedTiles(new Set());
  };

  // Calculate Square Tile Grid Counts
  const getSquareGridCounts = useCallback((drawW: number, drawH: number) => {
    const numCols = gridCount;
    const tileWidthNorm = drawW / gridCount;
    const numRows = Math.max(1, Math.round(drawH / tileWidthNorm));
    return { numCols, numRows };
  }, [gridCount]);

  // Render Loop to Draw Base Image, Tile Effects, Selected Borders, and Reference Grid
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Studio Dark Theme Canvas Background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#08080e");
    bgGrad.addColorStop(1, "#12121c");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Studio Grid Accent Texture
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

      const { numCols, numRows } = getSquareGridCounts(drawW, drawH);

      // Drop Shadow for Main Canvas Frame
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 15;

      // Draw Base Image
      ctx.drawImage(sourceImage, drawX, drawY, drawW, drawH);
      ctx.restore();

      // Render Selected Tile Style Effects (Cutout, Mosaic, Blur, Invert)
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
              // 1. Cutout Mode: Fills with configurable background color or transparent
              ctx.save();
              ctx.clearRect(tileX, tileY, tileW, tileH);

              if (cutoutBgColor !== "transparent") {
                ctx.fillStyle = cutoutBgColor;
                ctx.fillRect(tileX, tileY, tileW, tileH);
              }
              ctx.restore();
            } else if (selectedEffectMode === "mosaic") {
              // 2. Mosaic Mode: Pixelates tile into configurable block size
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
              // 3. Blur Mode
              ctx.save();
              ctx.beginPath();
              ctx.rect(tileX, tileY, tileW, tileH);
              ctx.clip();
              ctx.filter = `blur(${Math.max(4, blurRadius)}px)`;
              ctx.drawImage(sourceImage, srcX, srcY, srcW, srcH, tileX, tileY, tileW, tileH);
              ctx.restore();
            } else if (selectedEffectMode === "invert") {
              // 4. Invert Mode
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

      // Render Selected Tile Selection Overlay Tint
      selectedTiles.forEach((tileId) => {
        const [r, c] = tileId.split(",").map(Number);
        if (r < numRows && c < numCols) {
          const tileW = drawW / numCols;
          const tileH = drawH / numRows;
          const tileX = drawX + c * tileW;
          const tileY = drawY + r * tileH;

          ctx.save();
          ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
          ctx.fillRect(tileX, tileY, tileW, tileH);
          ctx.restore();
        }
      });

      // Render Entire Grid Borders (Border Thickness & Border Color apply to ALL tiles)
      if (borderWidth > 0 && borderColor !== "transparent") {
        ctx.save();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;

        // Vertical Grid Lines across Entire Image
        for (let c = 1; c < numCols; c++) {
          const lineX = drawX + (c / numCols) * drawW;
          ctx.beginPath();
          ctx.moveTo(lineX, drawY);
          ctx.lineTo(lineX, drawY + drawH);
          ctx.stroke();
        }

        // Horizontal Grid Lines across Entire Image
        for (let r = 1; r < numRows; r++) {
          const lineY = drawY + (r / numRows) * drawH;
          ctx.beginPath();
          ctx.moveTo(drawX, lineY);
          ctx.lineTo(drawX + drawW, lineY);
          ctx.stroke();
        }

        // Outer Image Frame Border Line
        ctx.strokeRect(drawX, drawY, drawW, drawH);
        ctx.restore();
      }

      // Render Reference Base Grid Overlay (Subtle Studio Alignment Guide Lines)
      if (showReferenceGrid) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1;

        // Vertical Guide Lines
        for (let c = 1; c < numCols; c++) {
          const lineX = drawX + (c / numCols) * drawW;
          ctx.beginPath();
          ctx.moveTo(lineX, drawY);
          ctx.lineTo(lineX, drawY + drawH);
          ctx.stroke();
        }

        // Horizontal Guide Lines
        for (let r = 1; r < numRows; r++) {
          const lineY = drawY + (r / numRows) * drawH;
          ctx.beginPath();
          ctx.moveTo(drawX, lineY);
          ctx.lineTo(drawX + drawW, lineY);
          ctx.stroke();
        }

        // Outer Image Frame Guide Border
        ctx.strokeRect(drawX, drawY, drawW, drawH);
        ctx.restore();
      }
    } else {
      imageBoundsRef.current = null;
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = '600 16px "Space Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("UPLOAD AN IMAGE TO BEGIN MOSAIC GRID SELECTION", w / 2, h / 2);
    }
  }, [sourceImage, gridCount, showReferenceGrid, borderWidth, borderColor, selectedTiles, isEffectEnabled, selectedEffectMode, cutoutBgColor, mosaicBlockSize, blurRadius, getSquareGridCounts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 1920;
      canvas.height = 1080;
    }
    renderCanvas();
  }, [renderCanvas]);

  // Handle Interactive Canvas Tile Selection
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

    if (clickX >= drawX && clickX <= drawX + drawW && clickY >= drawY && clickY <= drawY + drawH) {
      const relX = clickX - drawX;
      const relY = clickY - drawY;

      const { numCols, numRows } = getSquareGridCounts(drawW, drawH);

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
        <div className={styles.brandSubtitle}>Mosaic Grid Studio</div>

        {/* Image Upload Component */}
        <ImageUploader
          hasImage={!!sourceImage}
          onUploadImage={handleUploadImage}
        />

        {/* 1. Square Grid Division & Border Settings */}
        <div className={styles.sectionHeader}>
          <span>Square Grid &amp; Border</span>
        </div>

        {/* Square Grid Quantity */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Square Grid Quantity</span>
            <span className={styles.controlValue}>{gridCount} Columns</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={gridCount}
            onChange={(e) => setGridCount(parseInt(e.target.value))}
          />
        </div>

        {/* Border Thickness Slider (Directly after Grid Quantity) */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Border Thickness</span>
            <span className={styles.controlValue}>{borderWidth}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={borderWidth}
            onChange={(e) => setBorderWidth(parseInt(e.target.value))}
          />
        </div>

        {/* Border Color Picker & Swatches */}
        {borderWidth > 0 && (
          <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
            <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
              <span className={styles.controlLabel}>Border Color</span>
              <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>
                {borderColor === "transparent" ? "TRANSPARENT" : borderColor}
              </span>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="color"
                value={borderColor === "transparent" ? "#ffffff" : borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
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
                {BORDER_PRESET_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setBorderColor(color.value)}
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      backgroundColor: color.value === "transparent" ? "rgba(255,255,255,0.1)" : color.value,
                      border: borderColor === color.value ? "2px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.2)",
                      cursor: "pointer",
                      boxShadow: borderColor === color.value ? "0 0 8px rgba(255,255,255,0.8)" : "none",
                      padding: 0,
                      position: "relative",
                      overflow: "hidden"
                    }}
                    title={color.name}
                  >
                    {color.value === "transparent" && (
                      <span style={{ fontSize: "10px", color: "#ff3b30", fontWeight: 900, display: "block" }}>✕</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. Reference Base Grid Overlay Toggle */}
        <div className={styles.sectionHeader}>
          <span>Reference Overlay</span>
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
            <span className={styles.controlLabel}>Show Reference Grid</span>
            <span className={styles.controlValue}>{showReferenceGrid ? "VISIBLE" : "HIDDEN"}</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "12px",
                fontWeight: showReferenceGrid ? 800 : 700,
                background: showReferenceGrid ? "#000000" : "#ffffff",
                border: showReferenceGrid ? "2px solid #000000" : "2px solid #000000",
                color: showReferenceGrid ? "#ffffff" : "#000000",
                borderRadius: "6px",
                cursor: "pointer"
              }}
              onClick={() => setShowReferenceGrid(true)}
            >
              ✓ Visible
            </button>
            <button
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "12px",
                fontWeight: !showReferenceGrid ? 800 : 700,
                background: !showReferenceGrid ? "#000000" : "#ffffff",
                border: !showReferenceGrid ? "2px solid #000000" : "2px solid #000000",
                color: !showReferenceGrid ? "#ffffff" : "#000000",
                borderRadius: "6px",
                cursor: "pointer"
              }}
              onClick={() => setShowReferenceGrid(false)}
            >
              ✕ Hidden
            </button>
          </div>
        </div>

        {/* 4. Style Selection & Sub-Parameters (Clean Text Buttons) */}
        <div className={styles.sectionHeader}>
          <span>Tile Effect Styles</span>
        </div>

        {/* Master Effect Switch */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
            <span className={styles.controlLabel}>Tile Effect Switch</span>
            <span className={styles.controlValue}>{isEffectEnabled ? "ENABLED" : "DISABLED"}</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "12px",
                fontWeight: isEffectEnabled ? 800 : 700,
                background: isEffectEnabled ? "#000000" : "#ffffff",
                border: isEffectEnabled ? "2px solid #000000" : "2px solid #000000",
                color: isEffectEnabled ? "#ffffff" : "#000000",
                borderRadius: "6px",
                cursor: "pointer"
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
                fontWeight: !isEffectEnabled ? 800 : 700,
                background: !isEffectEnabled ? "#000000" : "#ffffff",
                border: !isEffectEnabled ? "2px solid #000000" : "2px solid #000000",
                color: !isEffectEnabled ? "#ffffff" : "#000000",
                borderRadius: "6px",
                cursor: "pointer"
              }}
              onClick={() => setIsEffectEnabled(false)}
            >
              ✕ Disabled
            </button>
          </div>
        </div>

        {/* Clean Text Buttons for Style Mode Selection */}
        {isEffectEnabled && (
          <>
            <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
              <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
                <span className={styles.controlLabel}>Select Style</span>
                <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>{selectedEffectMode}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {(["cutout", "mosaic", "blur", "invert"] as const).map((mode) => (
                  <button
                    key={mode}
                    style={{
                      padding: "10px",
                      fontSize: "12px",
                      fontWeight: selectedEffectMode === mode ? 800 : 700,
                      textTransform: "capitalize",
                      background: selectedEffectMode === mode ? "#000000" : "#ffffff",
                      border: selectedEffectMode === mode ? "2px solid #000000" : "2px solid #000000",
                      color: selectedEffectMode === mode ? "#ffffff" : "#000000",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                    onClick={() => setSelectedEffectMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Sub-Parameters */}
            {/* Cutout Mode: Background Color Picker */}
            {selectedEffectMode === "cutout" && (
              <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
                <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
                  <span className={styles.controlLabel}>Cutout Background Color</span>
                  <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>
                    {cutoutBgColor === "transparent" ? "TRANSPARENT" : cutoutBgColor}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="color"
                    value={cutoutBgColor === "transparent" ? "#0a0a0f" : cutoutBgColor}
                    onChange={(e) => setCutoutBgColor(e.target.value)}
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
                    {CUTOUT_BG_COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setCutoutBgColor(color.value)}
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          backgroundColor: color.value === "transparent" ? "rgba(255,255,255,0.1)" : color.value,
                          border: cutoutBgColor === color.value ? "2px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.2)",
                          cursor: "pointer",
                          padding: 0
                        }}
                        title={color.name}
                      >
                        {color.value === "transparent" && (
                          <span style={{ fontSize: "10px", color: "#ff3b30", fontWeight: 900, display: "block" }}>✕</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mosaic Mode: Resolution / Block Size Slider */}
            {selectedEffectMode === "mosaic" && (
              <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
                <div className={styles.controlHeader}>
                  <span className={styles.controlLabel}>Mosaic Resolution (Block Size)</span>
                  <span className={styles.controlValue}>{mosaicBlockSize}px</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={40}
                  step={2}
                  value={mosaicBlockSize}
                  onChange={(e) => setMosaicBlockSize(parseInt(e.target.value))}
                />
              </div>
            )}

            {/* Blur Mode: Blur Radius Slider */}
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

        {/* Selected Tiles Indicator */}
        <div
          style={{
            background: selectedTiles.size > 0 ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.04)",
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
            <span style={{ color: "#ffffff", fontWeight: 700 }}>
              {selectedTiles.size} Tiles Selected
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
          IMG300 Studio • Square Grid Matrix ({gridCount} Columns • {selectedTiles.size} Selected)
        </div>
      </div>
    </div>
  );
};
