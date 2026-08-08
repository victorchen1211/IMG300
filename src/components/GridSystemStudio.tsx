"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/page.module.scss";
import {
  CanvasViewport,
  ExportControls,
  CanvasSizeSelector,
  GridSystemControl,
  GridElementControl,
  useGridElements,
  drawGridSystem,
  DEFAULT_GRID_SETTINGS,
  GridSettings
} from "./common";
import { ASPECT_RATIOS } from "./common/CanvasSizeSelector";
import { exportCanvasToPNG, exportSVGString } from "../utils/exportUtils";

function resolveCanvasDimensions(formatKey: string) {
  const found = ASPECT_RATIOS.find(
    (ratio) => ratio.key === formatKey || ratio.label === formatKey
  );
  return found ? { w: found.w, h: found.h } : { w: 1200, h: 1600 };
}

export const GridSystemStudio: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Format & Mobile Drawer State
  const [selectedFormat, setSelectedFormat] = useState<string>("3:4");
  const [isMobileCollapsed, setIsMobileCollapsed] = useState<boolean>(false);

  // 2. Grid System State (Default 4x4 Grid)
  const [gridSettings, setGridSettings] = useState<GridSettings>(DEFAULT_GRID_SETTINGS);
  const canvasDimensions = resolveCanvasDimensions(selectedFormat);

  const handleUpdateGridSettings = (updates: Partial<GridSettings>) => {
    setGridSettings((prev) => ({ ...prev, ...updates }));
  };

  // 3. Shared Elements Manager Hook (Step 10.1: Image Fit & Crop Geometry)
  const {
    elementsWithStep4,
    compositionSolution,
    topSolutions,
    selectedSolutionIndex,
    setSelectedSolutionIndex,
    textFitResults,
    imageFitResults,
    crossModalHierarchyResult,
    imageTextBoundaryMetrics,
    typographicHierarchyInfo,
    parameters,
    baselineParams,
    hierarchyContrast,
    totalWeight,
    availableArea,
    updateParameters,
    updateBaselineParams,
    applyHierarchyContrast,
    addElement,
    updateElement,
    removeElement
  } = useGridElements(
    undefined,
    undefined,
    gridSettings.columns,
    gridSettings.rows,
    undefined,
    {
      canvasWidth: canvasDimensions.w,
      canvasHeight: canvasDimensions.h,
      marginLeft: gridSettings.marginLeft,
      marginRight: gridSettings.marginRight,
      marginTop: gridSettings.marginTop,
      marginBottom: gridSettings.marginBottom,
      columnGutter: gridSettings.columnGutter,
      rowGutter: gridSettings.rowGutter
    }
  );

  // Get Target Canvas Dimensions based on selected Aspect Ratio
  const getCanvasDimensions = useCallback(resolveCanvasDimensions, []);

  // Canvas Render Loop
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

    // Fill Blank Poster Canvas Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // Draw Josef Müller-Brockmann Grid System Overlay
    drawGridSystem(ctx, W, H, gridSettings);

    // Step 8.4 Render Global Baseline Grid Lattice (B = {y_0 + k*b})
    const { baselineUnit, baselineOrigin } = baselineParams;
    ctx.save();
    ctx.strokeStyle = "rgba(14, 165, 233, 0.15)"; // Light cyan/blue baseline guide line
    ctx.lineWidth = 1;

    for (let y = baselineOrigin; y <= H; y += baselineUnit) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();

    // Map for text and image fit results
    const textFitMap = new Map<string, (typeof textFitResults)[0]>();
    textFitResults.forEach((r) => textFitMap.set(r.elementId, r));

    const imageFitMap = new Map<string, (typeof imageFitResults)[0]>();
    imageFitResults.forEach((r) => imageFitMap.set(r.elementId, r));

    // Render Step 5.2 Optimum Solution Placements
    if (compositionSolution && compositionSolution.placements.length > 0) {
      const { columns, rows, marginTop, marginBottom, marginLeft, marginRight, columnGutter, rowGutter } = gridSettings;
      const netW = W - marginLeft - marginRight;
      const netH = H - marginTop - marginBottom;
      const colGutterTotal = (columns - 1) * columnGutter;
      const rowGutterTotal = (rows - 1) * rowGutter;
      const moduleW = (netW - colGutterTotal) / columns;
      const moduleH = (netH - rowGutterTotal) / rows;

      compositionSolution.placements.forEach((placement) => {
        const elem = elementsWithStep4.find((e) => e.id === placement.elementId);
        if (!elem) return;

        const pX = marginLeft + (placement.column - 1) * (moduleW + columnGutter);
        const pY = marginTop + (placement.row - 1) * (moduleH + rowGutter);
        const pW = placement.columnSpan * moduleW + (placement.columnSpan - 1) * columnGutter;
        const pH = placement.rowSpan * moduleH + (placement.rowSpan - 1) * rowGutter;

        ctx.save();

        if (elem.type === "text") {
          // Text Element Module Block Styling
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(pX, pY, pW, pH, 6);
          ctx.clip(); // Strict clipping: text must never overflow grid rectangle

          ctx.fillStyle = "rgba(224, 242, 254, 0.85)"; // Light Sky Blue
          ctx.fillRect(pX, pY, pW, pH);

          // Step 9.3 Typography Rendering with Auto-Fit Font Size
          const fitRes = textFitMap.get(elem.id);
          const fontSize = fitRes ? fitRes.fontSize : 24;
          const fontWeight = fitRes?.fontWeight ?? elem.fontWeight ?? 500;
          const fontFamily = elem.fontFamily || "Inter, sans-serif";

          ctx.fillStyle = "#0c4a6e";
          ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
          ctx.textBaseline = "alphabetic";

          // Render Lines aligned to baseline positions β_{i,m}
          if (fitRes && fitRes.linesInfo && fitRes.linesInfo.length > 0 && fitRes.baselinePositions) {
            fitRes.linesInfo.forEach((lineInfo, lineIdx) => {
              if (lineIdx < fitRes.baselinePositions.length) {
                const bY = fitRes.baselinePositions[lineIdx];
                if (bY <= pY + pH) {
                  const lineX = pX + lineInfo.xOffset;
                  ctx.fillText(lineInfo.text, lineX, bY);
                }
              }
            });
          }

          ctx.restore(); // Restore clip

          // Container Border
          ctx.strokeStyle = "#0284c7"; // Sky Blue Border
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(pX, pY, pW, pH, 6);
          ctx.stroke();
        } else {
          // Image Element Container & Fit Geometry Rendering
          const imgFit = imageFitMap.get(elem.id);

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(pX, pY, pW, pH, 6);
          ctx.clip(); // Clip image content to rounded container bounds

          // Fill Warm Amber Background for Container
          ctx.fillStyle = "rgba(254, 243, 199, 0.85)";
          ctx.fillRect(pX, pY, pW, pH);

          if (imgFit) {
            const { renderedWidth, renderedHeight, cropOffsetX, cropOffsetY } = imgFit;

            // Draw Scaled Image Representation Pattern
            const drawX = pX - cropOffsetX;
            const drawY = pY - cropOffsetY;

            // Image Content Fill Grid
            ctx.fillStyle = "rgba(245, 158, 11, 0.25)";
            ctx.fillRect(drawX, drawY, renderedWidth, renderedHeight);

            ctx.strokeStyle = "rgba(217, 119, 6, 0.4)";
            ctx.lineWidth = 1;
            // Draw Diagonal Cross in Rendered Image Bounds
            ctx.beginPath();
            ctx.moveTo(drawX, drawY);
            ctx.lineTo(drawX + renderedWidth, drawY + renderedHeight);
            ctx.moveTo(drawX + renderedWidth, drawY);
            ctx.lineTo(drawX, drawY + renderedHeight);
            ctx.stroke();
          }

          ctx.restore();

          // Container Border
          ctx.strokeStyle = "#d97706";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(pX, pY, pW, pH, 6);
          ctx.stroke();

          // Title & Type Badge
          ctx.fillStyle = "#b45309";
          ctx.font = "bold 16px Inter, sans-serif";
          ctx.fillText(elem.name, pX + 12, pY + 24);
        }

        ctx.restore();
      });
    }
  }, [selectedFormat, gridSettings, getCanvasDimensions, compositionSolution, elementsWithStep4, textFitResults, imageFitResults, baselineParams]);

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
    exportCanvasToPNG(canvasRef.current, "grid-system-poster");
  };

  const handleExportSVG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">`;
    const svgImage = `<image href="${canvas.toDataURL("image/png")}" width="${canvas.width}" height="${canvas.height}"/>`;
    const svgFooter = `</svg>`;
    exportSVGString(svgHeader + svgImage + svgFooter, "grid-system-poster");
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
            {isMobileCollapsed ? "Tap to Expand Controls" : "Grid System Studio"}
          </span>
        </div>

        {/* Brand Header */}
        <div className={styles.brandTitle}>IMG300</div>
        <div className={styles.brandSubtitle}>Grid System Studio (Alpha Build)</div>

        {/* Aspect Ratio Cards Selector */}
        <CanvasSizeSelector
          label="Aspect Ratio"
          selectedFormat={selectedFormat}
          onSelectFormat={setSelectedFormat}
        />

        {/* Dedicated Grid System Control Component */}
        <GridSystemControl
          gridSettings={gridSettings}
          onUpdateGridSettings={handleUpdateGridSettings}
        />

        {/* Elements Manager Tool Panel (Step 10.4: Image-Text Boundary Geometry) */}
        <GridElementControl
          elements={elementsWithStep4}
          parameters={parameters}
          baselineParams={baselineParams}
          hierarchyContrast={hierarchyContrast}
          compositionSolution={compositionSolution}
          topSolutions={topSolutions}
          selectedSolutionIndex={selectedSolutionIndex}
          textFitResults={textFitResults}
          imageFitResults={imageFitResults}
          crossModalHierarchyResult={crossModalHierarchyResult}
          imageTextBoundaryMetrics={imageTextBoundaryMetrics}
          typographicHierarchyInfo={typographicHierarchyInfo}
          onSelectSolutionIndex={setSelectedSolutionIndex}
          totalWeight={totalWeight}
          availableArea={availableArea}
          gridColumns={gridSettings.columns}
          gridRows={gridSettings.rows}
          onUpdateParameters={updateParameters}
          onUpdateBaselineParams={updateBaselineParams}
          onApplyHierarchyContrast={applyHierarchyContrast}
          onAddElement={addElement}
          onUpdateElement={updateElement}
          onRemoveElement={removeElement}
        />

        {/* Export Controls Component */}
        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <ExportControls onExportPNG={handleExportPNG} onExportSVG={handleExportSVG} />
        </div>
      </div>

      {/* Shared Canvas Viewport Component */}
      <CanvasViewport
        canvasRef={canvasRef}
        containerRef={containerRef}
        isMobileCollapsed={isMobileCollapsed}
      />
    </div>
  );
};
