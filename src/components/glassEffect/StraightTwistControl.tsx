"use client";

import React from "react";
import { ToggleSwitch, BrikAccordionSection, BrikSliderControl } from "../common";

interface StraightTwistControlProps {
  enabled: boolean;
  onToggleEnable: (enabled: boolean) => void;
  fluteCount: number;
  onChangeFluteCount: (count: number) => void;
  distortionX: number;
  onChangeDistortionX: (dist: number) => void;
  highlight: number;
  onChangeHighlight: (hl: number) => void;
  shadow: number;
  onChangeShadow: (sh: number) => void;
}

export const StraightTwistControl: React.FC<StraightTwistControlProps> = ({
  enabled,
  onToggleEnable,
  fluteCount,
  onChangeFluteCount,
  distortionX,
  onChangeDistortionX,
  highlight,
  onChangeHighlight,
  shadow,
  onChangeShadow
}) => {
  return (
    <BrikAccordionSection title="Straight Glass Twist Effect" defaultOpen={true}>
      <div style={{ marginBottom: 14 }}>
        {/* Toggle Switch */}
        <ToggleSwitch
          label="Straight Twist Effect"
          checked={enabled}
          onChange={(val) => onToggleEnable(val)}
        />

        {enabled && (
          <div style={{ marginTop: 10 }}>
            {/* Flute Density Count */}
            <BrikSliderControl
              label="Flute Rib Density"
              value={fluteCount}
              min={10}
              max={120}
              step={1}
              valueDisplay={fluteCount}
              onChange={onChangeFluteCount}
              marginBottom={10}
            />

            {/* Horizontal Refraction Distortion */}
            <BrikSliderControl
              label="Horizontal Distortion"
              value={distortionX}
              min={0}
              max={0.15}
              step={0.005}
              valueDisplay={distortionX.toFixed(3)}
              onChange={onChangeDistortionX}
              marginBottom={10}
            />

            {/* Ridge Specular Highlight */}
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

            {/* Groove Shadow */}
            <BrikSliderControl
              label="Groove Shadow"
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
