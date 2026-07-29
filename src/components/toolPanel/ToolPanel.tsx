"use client";

import React from "react";
import styles from "../../app/page.module.scss";
import {
  ImageUploader,
  PaletteSelector,
  CanvasSizeSelector,
  ExportControls
} from "../common";
import {
  ImageFilterSelector,
  OverlayFilmControl,
  ClarityMaskControl,
  TypographyControl,
  MaskLayer,
  TextLayer,
  TextAlignMode
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
  selectedPaletteKey: string;
  onSelectPalette: (paletteKey: string) => void;
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
  selectedPaletteKey,
  onSelectPalette,
  selectedFormat,
  onSelectFormat,
  onExportPNG,
  onExportSVG
}) => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.brandTitle}>IMG300</div>
      <div className={styles.brandSubtitle}>Tool created by Victor Chen</div>

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

      {/* Multi-Typography Controls */}
      <TypographyControl
        texts={texts}
        selectedTextId={selectedTextId}
        onAddText={onAddText}
        onDeleteText={onDeleteText}
        onSelectText={onSelectText}
        onUpdateText={onUpdateText}
      />

      {/* Color Palette Selector */}
      <PaletteSelector selectedPaletteKey={selectedPaletteKey} onSelectPalette={onSelectPalette} />

      {/* Canvas Size Selector */}
      <CanvasSizeSelector selectedFormat={selectedFormat} onSelectFormat={onSelectFormat} />

      {/* Export Controls */}
      <ExportControls onExportPNG={onExportPNG} onExportSVG={onExportSVG} />
    </div>
  );
};
