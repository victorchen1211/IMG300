"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/page.module.scss";
import { ImageUploader, BrikSliderControl, BrikAccordionSection, CanvasViewport } from "./common";

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

  // 2. Reference Base Grid Toggle (Pure Reference Overlay)
  const [showReferenceGrid, setShowReferenceGrid] = useState<boolean>(true);

  // 3. Grid Border Thickness Control
  const [borderWidth, setBorderWidth] = useState<number>(2); // 0px to 20px (0 = No Border)

  // 4. Interactive Tile Selection (Set of "row,col" strings)
  const [selectedTiles, setSelectedTiles] = useState<Set<string>>(new Set());

  // 5. Style Controls (Clean Text Buttons: Cutout, Mosaic, Blur, Invert)
  const [isEffectEnabled, setIsEffectEnabled] = useState<boolean>(true); // Master Effect Switch
  const [selectedEffectMode, setSelectedEffectMode] = useState<"cutout" | "mosaic" | "blur" | "invert">("cutout");

  // 6. Cutout Mirror Extension Direction ("none" | "up" | "down" | "left" | "right")
  const [mirrorDirection, setMirrorDirection] = useState<"none" | "up" | "down" | "left" | "right">("none");

  // 7. Style Sub-Parameters
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

  // Render Loop to Draw Base Image, Directional Cutout Mirror Extension, Tile Effects, and Grid Lines
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!sourceImage || !sourceImage.complete || sourceImage.naturalWidth === 0) return;

    // Calculate Aspect Ratio Fit Container Bounds
    const imgW = sourceImage.naturalWidth;
    const imgH = sourceImage.naturalHeight;
    const imgAspect = imgW / imgH;

    const maxW = w * 0.85;
    const maxH = h * 0.85;

    let drawW = maxW;
    let drawH = maxW / imgAspect;

    if (drawH > maxH) {
      drawH = maxH;
      drawW = maxH * imgAspect;
    }

    const drawX = (w - drawW) / 2;
    const drawY = (h - drawH) / 2;

    imageBoundsRef.current = { drawX, drawY, drawW, drawH };

    // Offscreen Canvas for Pixel Sampling & Offscreen Effects
    const offCanvas = document.createElement("canvas");
    offCanvas.width = imgW;
    offCanvas.height = imgH;
    const offCtx = offCanvas.getContext("2d");
    if (!offCtx) return;

    offCtx.drawImage(sourceImage, 0, 0);

    // Calculate Square Tile Dimensions
    const { numCols, numRows } = getSquareGridCounts(drawW, drawH);
    const tileW_Canvas = drawW / numCols;
    const tileH_Canvas = drawH / numRows;

    const tileW_Img = imgW / numCols;
    const tileH_Img = imgH / numRows;

    // 1. Draw Base Source Image with Drop Shadow
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 15;
    ctx.drawImage(sourceImage, drawX, drawY, drawW, drawH);
    ctx.restore();

    // 2. Render In-Place Tile Effects for Selected Tiles
    if (isEffectEnabled && selectedTiles.size > 0) {
      selectedTiles.forEach((tileKey) => {
        const [rStr, cStr] = tileKey.split(",");
        const r = parseInt(rStr, 10);
        const c = parseInt(cStr, 10);

        if (r < numRows && c < numCols) {
          const destTileX = drawX + c * tileW_Canvas;
          const destTileY = drawY + r * tileH_Canvas;
          const srcTileX = c * tileW_Img;
          const srcTileY = r * tileH_Img;

          ctx.save();
          ctx.beginPath();
          ctx.rect(destTileX, destTileY, tileW_Canvas, tileH_Canvas);
          ctx.clip();

          if (selectedEffectMode === "cutout") {
            if (cutoutBgColor === "transparent") {
              ctx.clearRect(destTileX, destTileY, tileW_Canvas, tileH_Canvas);
            } else {
              ctx.fillStyle = cutoutBgColor;
              ctx.fillRect(destTileX, destTileY, tileW_Canvas, tileH_Canvas);
            }
          } else if (selectedEffectMode === "mosaic") {
            const tileImgData = offCtx.getImageData(srcTileX, srcTileY, tileW_Img, tileH_Img);
            const mOffCanvas = document.createElement("canvas");
            mOffCanvas.width = tileW_Img;
            mOffCanvas.height = tileH_Img;
            const mOffCtx = mOffCanvas.getContext("2d");

            if (mOffCtx) {
              mOffCtx.putImageData(tileImgData, 0, 0);

              const blockW = Math.max(2, Math.floor(mosaicBlockSize * (imgW / drawW)));
              const blockH = Math.max(2, Math.floor(mosaicBlockSize * (imgH / drawH)));

              for (let my = 0; my < tileH_Img; my += blockH) {
                for (let mx = 0; mx < tileW_Img; mx += blockW) {
                  const sampleX = Math.min(tileW_Img - 1, mx + Math.floor(blockW / 2));
                  const sampleY = Math.min(tileH_Img - 1, my + Math.floor(blockH / 2));

                  const pixelIndex = (sampleY * tileW_Img + sampleX) * 4;
                  const rVal = tileImgData.data[pixelIndex];
                  const gVal = tileImgData.data[pixelIndex + 1];
                  const bVal = tileImgData.data[pixelIndex + 2];
                  const aVal = tileImgData.data[pixelIndex + 3];

                  mOffCtx.fillStyle = `rgba(${rVal},${gVal},${bVal},${aVal / 255})`;
                  mOffCtx.fillRect(mx, my, blockW, blockH);
                }
              }

              ctx.drawImage(mOffCanvas, destTileX, destTileY, tileW_Canvas, tileH_Canvas);
            }
          } else if (selectedEffectMode === "blur") {
            ctx.filter = `blur(${blurRadius}px)`;
            ctx.drawImage(
              sourceImage,
              srcTileX,
              srcTileY,
              tileW_Img,
              tileH_Img,
              destTileX,
              destTileY,
              tileW_Canvas,
              tileH_Canvas
            );
            ctx.filter = "none";
          } else if (selectedEffectMode === "invert") {
            ctx.drawImage(
              sourceImage,
              srcTileX,
              srcTileY,
              tileW_Img,
              tileH_Img,
              destTileX,
              destTileY,
              tileW_Canvas,
              tileH_Canvas
            );
            const tileImgData = ctx.getImageData(destTileX, destTileY, tileW_Canvas, tileH_Canvas);
            const d = tileImgData.data;
            for (let i = 0; i < d.length; i += 4) {
              d[i] = 255 - d[i];
              d[i + 1] = 255 - d[i + 1];
              d[i + 2] = 255 - d[i + 2];
            }
            ctx.putImageData(tileImgData, destTileX, destTileY);
          }

          ctx.restore();
        }
      });
    }

    // 3. Render Directional Tile Mirror Extension ONLY for Selected Tiles at Symmetric Mirrored Position
    if (isEffectEnabled && mirrorDirection !== "none" && selectedTiles.size > 0) {
      selectedTiles.forEach((tileKey) => {
        const [rStr, cStr] = tileKey.split(",");
        const r = parseInt(rStr, 10);
        const c = parseInt(cStr, 10);

        if (r < numRows && c < numCols) {
          const srcTileX = c * tileW_Img;
          const srcTileY = r * tileH_Img;

          let targetTileX = drawX + c * tileW_Canvas;
          let targetTileY = drawY + r * tileH_Canvas;
          let scaleX = 1;
          let scaleY = 1;

          if (mirrorDirection === "up") {
            targetTileY = drawY - drawH + (numRows - 1 - r) * tileH_Canvas;
            scaleY = -1;
          } else if (mirrorDirection === "down") {
            targetTileY = drawY + drawH + (numRows - 1 - r) * tileH_Canvas;
            scaleY = -1;
          } else if (mirrorDirection === "left") {
            targetTileX = drawX - drawW + (numCols - 1 - c) * tileW_Canvas;
            scaleX = -1;
          } else if (mirrorDirection === "right") {
            targetTileX = drawX + drawW + (numCols - 1 - c) * tileW_Canvas;
            scaleX = -1;
          }

          ctx.save();
          ctx.beginPath();
          ctx.rect(targetTileX, targetTileY, tileW_Canvas, tileH_Canvas);
          ctx.clip();

          ctx.translate(targetTileX + tileW_Canvas / 2, targetTileY + tileH_Canvas / 2);
          ctx.scale(scaleX, scaleY);

          ctx.drawImage(
            sourceImage,
            srcTileX,
            srcTileY,
            tileW_Img,
            tileH_Img,
            -tileW_Canvas / 2,
            -tileH_Canvas / 2,
            tileW_Canvas,
            tileH_Canvas
          );

          ctx.restore();
        }
      });
    }

    // 4. Render Reference Base Grid Lines & Selected Tile Highlight Frames
    if (showReferenceGrid) {
      ctx.lineWidth = borderWidth > 0 ? borderWidth : 1;

      // Draw Grid Outline for Image Bounds
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.strokeRect(drawX, drawY, drawW, drawH);

      // Draw Internal Vertical Grid Lines
      for (let c = 1; c < numCols; c++) {
        const gx = drawX + c * tileW_Canvas;
        ctx.beginPath();
        ctx.moveTo(gx, drawY);
        ctx.lineTo(gx, drawY + drawH);
        ctx.stroke();
      }

      // Draw Internal Horizontal Grid Lines
      for (let r = 1; r < numRows; r++) {
        const gy = drawY + r * tileH_Canvas;
        ctx.beginPath();
        ctx.moveTo(drawX, gy);
        ctx.lineTo(drawX + drawW, gy);
        ctx.stroke();
      }

      // Highlight Selected Tiles with Bright Border Accent
      selectedTiles.forEach((tileKey) => {
        const [rStr, cStr] = tileKey.split(",");
        const r = parseInt(rStr, 10);
        const c = parseInt(cStr, 10);

        if (r < numRows && c < numCols) {
          const destTileX = drawX + c * tileW_Canvas;
          const destTileY = drawY + r * tileH_Canvas;

          ctx.save();
          ctx.strokeStyle = "#00e5ff";
          ctx.lineWidth = Math.max(2, borderWidth + 1);
          ctx.strokeRect(destTileX, destTileY, tileW_Canvas, tileH_Canvas);
          ctx.fillStyle = "rgba(0, 229, 255, 0.15)";
          ctx.fillRect(destTileX, destTileY, tileW_Canvas, tileH_Canvas);
          ctx.restore();
        }
      });
    }
  }, [sourceImage, gridCount, showReferenceGrid, borderWidth, selectedTiles, isEffectEnabled, selectedEffectMode, mirrorDirection, cutoutBgColor, mosaicBlockSize, blurRadius, getSquareGridCounts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 1920;
      canvas.height = 1080;
    }
    renderCanvas();
  }, [renderCanvas]);

  // Canvas Click Handler to Toggle Square Tile Selection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const bounds = imageBoundsRef.current;
    if (!canvas || !bounds || !sourceImage) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickCanvasX = (e.clientX - rect.left) * scaleX;
    const clickCanvasY = (e.clientY - rect.top) * scaleY;

    const { drawX, drawY, drawW, drawH } = bounds;

    if (
      clickCanvasX >= drawX &&
      clickCanvasX <= drawX + drawW &&
      clickCanvasY >= drawY &&
      clickCanvasY <= drawY + drawH
    ) {
      const { numCols, numRows } = getSquareGridCounts(drawW, drawH);
      const tileW = drawW / numCols;
      const tileH = drawH / numRows;

      const col = Math.floor((clickCanvasX - drawX) / tileW);
      const row = Math.floor((clickCanvasY - drawY) / tileH);

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
    <div className={styles.appContainer} style={{ background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Brik.space Floating White Card Sidebar */}
      <div
        className={styles.sidebar}
        style={{
          background: "#ffffff",
          color: "#111111",
          borderRadius: "16px",
          margin: "16px",
          height: "calc(100vh - 32px)",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e2e8f0",
          overflowY: "auto"
        }}
      >
        {/* Brik.space Header with Reset Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
            paddingBottom: "16px",
            borderBottom: "1px solid #eeeeee"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px", color: "#000000" }}>✦</span>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#000000",
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                IMG300
              </span>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#777777",
                marginTop: "2px",
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              by IMG300 Studio
            </div>
          </div>

          <button
            onClick={() => {
              setGridCount(8);
              setBorderWidth(2);
              setShowReferenceGrid(true);
              setIsEffectEnabled(true);
              setSelectedEffectMode("cutout");
              setMirrorDirection("none");
              setCutoutBgColor("#0a0a0f");
              setMosaicBlockSize(14);
              setBlurRadius(10);
              setSelectedTiles(new Set());
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "transparent",
              border: "none",
              fontSize: "13px",
              fontWeight: 700,
              color: "#000000",
              cursor: "pointer"
            }}
          >
            <span>↻</span> Reset
          </button>
        </div>

        {/* Image Upload Component */}
        <ImageUploader
          hasImage={!!sourceImage}
          onUploadImage={handleUploadImage}
        />

        {/* 1. Square Grid Division & Border Settings Brik Accordion */}
        <BrikAccordionSection title="Square Grid & Border" defaultOpen={true}>
          <BrikSliderControl
            label="Square Grid Quantity"
            value={gridCount}
            min={1}
            max={100}
            step={1}
            valueDisplay={`${gridCount} Cols`}
            onChange={setGridCount}
            marginBottom={10}
          />

          <BrikSliderControl
            label="Border Thickness"
            value={borderWidth}
            min={0}
            max={20}
            step={1}
            valueDisplay={`${borderWidth}px`}
            onChange={setBorderWidth}
            marginBottom={10}
          />
        </BrikAccordionSection>

        {/* 2. Reference Base Grid Overlay Brik Accordion */}
        <BrikAccordionSection title="Reference Overlay" defaultOpen={true}>
          <div className={styles.controlGroup} style={{ marginBottom: 12 }}>
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
                  border: "2px solid #000000",
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
                  border: "2px solid #000000",
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
        </BrikAccordionSection>

        {/* 3. Interactive Tile Effects Brik Accordion */}
        <BrikAccordionSection title="Interactive Tile Effects" defaultOpen={true}>
          {/* Master Effect Toggle */}
          <div className={styles.controlGroup} style={{ marginBottom: 12 }}>
            <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
              <span className={styles.controlLabel}>Tile Effect Mode</span>
              <span className={styles.controlValue}>{isEffectEnabled ? "ENABLED" : "OFF"}</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                style={{
                  flex: 1,
                  padding: "8px",
                  fontSize: "12px",
                  fontWeight: isEffectEnabled ? 800 : 700,
                  background: isEffectEnabled ? "#000000" : "#ffffff",
                  border: "2px solid #000000",
                  color: isEffectEnabled ? "#ffffff" : "#000000",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
                onClick={() => setIsEffectEnabled(true)}
              >
                ON
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "8px",
                  fontSize: "12px",
                  fontWeight: !isEffectEnabled ? 800 : 700,
                  background: !isEffectEnabled ? "#000000" : "#ffffff",
                  border: "2px solid #000000",
                  color: !isEffectEnabled ? "#ffffff" : "#000000",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
                onClick={() => setIsEffectEnabled(false)}
              >
                OFF
              </button>
            </div>
          </div>

          {isEffectEnabled && (
            <>
              {/* Tile Effect Mode Buttons */}
              <div className={styles.controlGroup} style={{ marginBottom: 12 }}>
                <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
                  <span className={styles.controlLabel}>Select Effect</span>
                  <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>
                    {selectedEffectMode}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {(["cutout", "mosaic", "blur", "invert"] as const).map((mode) => (
                    <button
                      key={mode}
                      style={{
                        padding: "8px",
                        fontSize: "11px",
                        fontWeight: selectedEffectMode === mode ? 800 : 700,
                        textTransform: "capitalize",
                        background: selectedEffectMode === mode ? "#000000" : "#ffffff",
                        border: "2px solid #000000",
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

              {/* Mirror Extension Direction Controls */}
              <div className={styles.controlGroup} style={{ marginBottom: 12 }}>
                <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
                  <span className={styles.controlLabel}>Mirror Extension</span>
                  <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>
                    {mirrorDirection}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px" }}>
                  {(["none", "up", "down", "left", "right"] as const).map((dir) => (
                    <button
                      key={dir}
                      style={{
                        padding: "6px 2px",
                        fontSize: "10px",
                        fontWeight: mirrorDirection === dir ? 800 : 700,
                        textTransform: "capitalize",
                        background: mirrorDirection === dir ? "#000000" : "#ffffff",
                        border: "2px solid #000000",
                        color: mirrorDirection === dir ? "#ffffff" : "#000000",
                        borderRadius: "6px",
                        cursor: "pointer"
                      }}
                      onClick={() => setMirrorDirection(dir)}
                    >
                      {dir === "none" ? "Off" : dir}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cutout Color Swatches */}
              {selectedEffectMode === "cutout" && (
                <div className={styles.controlGroup} style={{ marginBottom: 12 }}>
                  <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
                    <span className={styles.controlLabel}>Cutout Fill Color</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {CUTOUT_BG_COLORS.map((item) => (
                      <button
                        key={item.name}
                        title={item.name}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: item.value === "transparent" ? "#ffffff" : item.value,
                          border: cutoutBgColor === item.value ? "3px solid #00e5ff" : "1px solid #ccc",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px"
                        }}
                        onClick={() => setCutoutBgColor(item.value)}
                      >
                        {item.value === "transparent" && "✕"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mosaic Mode: Resolution Slider */}
              {selectedEffectMode === "mosaic" && (
                <BrikSliderControl
                  label="Mosaic Block Size"
                  value={mosaicBlockSize}
                  min={4}
                  max={40}
                  step={2}
                  valueDisplay={`${mosaicBlockSize}px`}
                  onChange={setMosaicBlockSize}
                  marginBottom={10}
                />
              )}

              {/* Blur Mode: Blur Radius Slider */}
              {selectedEffectMode === "blur" && (
                <BrikSliderControl
                  label="Blur Radius"
                  value={blurRadius}
                  min={4}
                  max={24}
                  step={2}
                  valueDisplay={`${blurRadius}px`}
                  onChange={setBlurRadius}
                  marginBottom={10}
                />
              )}
            </>
          )}
        </BrikAccordionSection>

        {/* Selected Tiles Indicator */}
        <div
          style={{
            background: "#f8f9fa",
            border: "1px solid #e9ecef",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginTop: "16px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#666666" }}>Click Canvas to Select</span>
            <span style={{ color: "#000000", fontWeight: 700 }}>
              {selectedTiles.size} Tiles Selected
            </span>
          </div>

          {selectedTiles.size > 0 && (
            <button
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#ff3b30",
                border: "1px solid #ff3b30",
                borderRadius: "6px",
                background: "#fff0f0",
                cursor: "pointer"
              }}
              onClick={() => setSelectedTiles(new Set())}
            >
              Clear Selection ({selectedTiles.size})
            </button>
          )}
        </div>
      </div>

      {/* Shared Canvas Viewport Component */}
      <CanvasViewport
        canvasRef={canvasRef}
        containerRef={containerRef}
        onClickCanvas={handleCanvasClick}
        cursor="pointer"
      />
    </div>
  );
};
