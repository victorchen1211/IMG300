"use client";

import React from "react";
import { ToggleSwitch, BrikAccordionSection, BrikSliderControl } from "../common";

interface HammeredRippleControlProps {
  enabled: boolean;
  onToggleEnable: (enabled: boolean) => void;
  rippleScale: number;
  onChangeRippleScale: (scale: number) => void;
  rippleDistortion: number;
  onChangeRippleDistortion: (dist: number) => void;
  highlight: number;
  onChangeHighlight: (hl: number) => void;
  shadow: number;
  onChangeShadow: (sh: number) => void;
}

export const HammeredRippleControl: React.FC<HammeredRippleControlProps> = ({
  enabled,
  onToggleEnable,
  rippleScale,
  onChangeRippleScale,
  rippleDistortion,
  onChangeRippleDistortion,
  highlight,
  onChangeHighlight,
  shadow,
  onChangeShadow
}) => {
  return (
    <BrikAccordionSection title="Hammered / Rippled Glass Effect" defaultOpen={true}>
      <div style={{ marginBottom: 14 }}>
        {/* Toggle Switch */}
        <ToggleSwitch
          label="Hammered / Rippled Effect"
          checked={enabled}
          onChange={(val) => onToggleEnable(val)}
        />

        {enabled && (
          <div style={{ marginTop: 10 }}>
            {/* Ripple Noise Scale / Density */}
            <BrikSliderControl
              label="Ripple Density Scale"
              value={rippleScale}
              min={10}
              max={100}
              step={1}
              valueDisplay={rippleScale}
              onChange={onChangeRippleScale}
              marginBottom={10}
            />

            {/* Ripple Distortion Strength */}
            <BrikSliderControl
              label="Ripple Distortion"
              value={rippleDistortion}
              min={0}
              max={0.15}
              step={0.005}
              valueDisplay={rippleDistortion.toFixed(3)}
              onChange={onChangeRippleDistortion}
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
