"use client";

import React from "react";
import styles from "../../app/page.module.scss";
import {
  ImageUploader,
  CanvasSizeSelector,
  ExportControls
} from "../common";
import {
  ImageFilterSelector,
  OverlayFilmControl,
  ClarityMaskControl,
  TypographyControl,
  MaskLayer,
  TextLayer
} from "../blurAndReveal";

interface ToolPanelProps {
  hasImage: boolean;
  onUploadImage: (img: HTMLImageElement) => void;
  selectedFilter: string;
  onSelectFilter: (filterKey: string) => void;
  overlayEnabled: boolean;
  onToggleOverlay: (enabled: boolean) => void;
  blurAmount: number;
  onChangeBlurAmount: (blur: number) => void;
  overlayOpacity: number;
  onChangeOverlayOpacity: (opacity: number) => void;
  // Multi-Mask Props
  masks: MaskLayer[];
  selectedMaskId: string;
  onAddMask: () => void;
  onDeleteMask: (id: string) => void;
  onSelectMask: (id: string) => void;
  onUpdateMask: (id: string, updates: Partial<MaskLayer>) => void;
  // Multi-Text Props
  texts: TextLayer[];
  selectedTextId: string;
  onAddText: () => void;
  onDeleteText: (id: string) => void;
  onSelectText: (id: string) => void;
  onUpdateText: (id: string, updates: Partial<TextLayer>) => void;
  // Canvas & Export Props
  selectedFormat: string;
  onSelectFormat: (formatKey: string) => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
}

export const ToolPanel: React.FC<ToolPanelProps> = ({
  hasImage,
  onUploadImage,
  selectedFilter,
  onSelectFilter,
  overlayEnabled,
  onToggleOverlay,
  blurAmount,
  onChangeBlurAmount,
  overlayOpacity,
  onChangeOverlayOpacity,
  masks,
  selectedMaskId,
  onAddMask,
  onDeleteMask,
  onSelectMask,
  onUpdateMask,
  texts,
  selectedTextId,
  onAddText,
  onDeleteText,
  onSelectText,
  onUpdateText,
  selectedFormat,
  onSelectFormat,
  onExportPNG,
  onExportSVG
}) => {
  return (
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
              Blur &amp; Reveal Studio
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
            onSelectFilter("original");
            onToggleOverlay(true);
            onChangeBlurAmount(20);
            onChangeOverlayOpacity(0.85);
            onSelectFormat("1:1");
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

      {/* Image Uploader */}
      <ImageUploader hasImage={hasImage} onUploadImage={onUploadImage} />

      {/* Image Filter Selector */}
      <ImageFilterSelector selectedFilter={selectedFilter} onSelectFilter={onSelectFilter} />

      {/* Overlay Film & Gaussian Blur Control */}
      <OverlayFilmControl
        enabled={overlayEnabled}
        onToggleEnable={onToggleOverlay}
        blurAmount={blurAmount}
        onChangeBlurAmount={onChangeBlurAmount}
        opacity={overlayOpacity}
        onChangeOpacity={onChangeOverlayOpacity}
      />

      {/* Clarity Multi-Mask Control */}
      <ClarityMaskControl
        masks={masks}
        selectedMaskId={selectedMaskId}
        onAddMask={onAddMask}
        onDeleteMask={onDeleteMask}
        onSelectMask={onSelectMask}
        onUpdateMask={onUpdateMask}
      />

      {/* Multi-Typography Control */}
      <TypographyControl
        texts={texts}
        selectedTextId={selectedTextId}
        onAddText={onAddText}
        onDeleteText={onDeleteText}
        onSelectText={onSelectText}
        onUpdateText={onUpdateText}
      />

      {/* Canvas Size Ratio Selector */}
      <CanvasSizeSelector selectedFormat={selectedFormat} onSelectFormat={onSelectFormat} />

      {/* Vector SVG & Bitmap PNG Export Controls */}
      <ExportControls onExportPNG={onExportPNG} onExportSVG={onExportSVG} />
    </div>
  );
};
