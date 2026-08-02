"use client";

import React from "react";
import { BrikAccordionSection } from "../common";

export const IMAGE_FILTERS: Record<string, { label: string; filter: string }> = {
  none: { label: "Original", filter: "none" },
  grayscale: { label: "Black & White", filter: "grayscale(100%)" },
  contrastBW: { label: "High Contrast B&W", filter: "grayscale(100%) contrast(200%)" },
  invert: { label: "Invert", filter: "invert(100%)" },
  sepia: { label: "Sepia", filter: "sepia(100%)" },
  warm: { label: "Warm Tone", filter: "sepia(40%) saturate(160%) hue-rotate(-20deg)" },
  cool: { label: "Cool Tone", filter: "hue-rotate(180deg) saturate(140%)" },
  dramatic: { label: "Dramatic", filter: "contrast(150%) brightness(85%) saturate(120%)" },
  duotoneDark: { label: "Dark Silhouette", filter: "grayscale(100%) contrast(300%) brightness(50%)" }
};

interface ImageFilterSelectorProps {
  selectedFilter: string;
  onSelectFilter: (filterKey: string) => void;
}

export const ImageFilterSelector: React.FC<ImageFilterSelectorProps> = ({ selectedFilter, onSelectFilter }) => {
  return (
    <BrikAccordionSection title="Image Color Filter" defaultOpen={true}>
      <select value={selectedFilter} onChange={(e) => onSelectFilter(e.target.value)} style={{ marginBottom: 10 }}>
        {Object.entries(IMAGE_FILTERS).map(([key, filterObj]) => (
          <option key={key} value={key}>
            {filterObj.label}
          </option>
        ))}
      </select>
    </BrikAccordionSection>
  );
};
