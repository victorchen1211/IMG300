"use client";

import React from "react";
import { ToggleSwitch, BrikAccordionSection, BrikSliderControl } from "../common";

interface GridPrismControlProps {
  enabled: boolean;
  onToggleEnable: (enabled: boolean) => void;
  gridScale: number;
  onChangeGridScale: (scale: number) => void;
  gridDistortion: number;
  onChangeGridDistortion: (dist: number) => void;
  roundness: number;
  onChangeRoundness: (rnd: number) => void;
  highlight: number;
  onChangeHighlight: (hl: number) => void;
  shadow: number;
  onChangeShadow: (sh: number) => void;
}

export const GridPrismControl: React.FC<GridPrismControlProps> = ({
  enabled,
  onToggleEnable,
  gridScale,
  onChangeGridScale,
  gridDistortion,
  onChangeGridDistortion,
  roundness,
  onChangeRoundness,
  highlight,
  onChangeHighlight,
  shadow,
  onChangeShadow
}) => {
  return (
    <BrikAccordionSection title="Diamond Faceted Prism Glass" defaultOpen={true}>
      <div style={{ marginBottom: 14 }}>
        {/* Toggle Switch */}
        <ToggleSwitch
          label="Diamond Prism Effect"
          checked={enabled}
          onChange={(val) => onToggleEnable(val)}
        />

        {enabled && (
          <div style={{ marginTop: 10 }}>
            {/* Diamond Grid Density Scale */}
            <BrikSliderControl
              label="Diamond Grid Density"
              value={gridScale}
              min={10}
              max={100}
              step={1}
              valueDisplay={gridScale}
              onChange={onChangeGridScale}
              marginBottom={10}
            />

            {/* Facet Corner Roundness (Diamond -> Circle) */}
            <BrikSliderControl
              label="Facet Roundness"
              value={roundness}
              min={0}
              max={1}
              step={0.02}
              valueDisplay={roundness.toFixed(2)}
              onChange={onChangeRoundness}
              marginBottom={10}
            />

            {/* Refraction Distortion Power */}
            <BrikSliderControl
              label="Refraction Distortion"
              value={gridDistortion}
              min={0}
              max={0.15}
              step={0.005}
              valueDisplay={gridDistortion.toFixed(3)}
              onChange={onChangeGridDistortion}
              marginBottom={10}
            />

            {/* Specular Highlight */}
            <BrikSliderControl
              label="Specular Highlight"
              value={highlight}
              min={0}
              max={1}
              step={0.05}
              valueDisplay={`${Math.round(highlight * 100)}%`}
              onChange={onChangeHighlight}
              marginBottom={10}
            />

            {/* Shadow Depth */}
            <BrikSliderControl
              label="Shadow Depth"
              value={shadow}
              min={0}
              max={1}
              step={0.05}
              valueDisplay={`${Math.round(shadow * 100)}%`}
              onChange={onChangeShadow}
              marginBottom={10}
            />
          </div>
        )}
      </div>
    </BrikAccordionSection>
  );
};
