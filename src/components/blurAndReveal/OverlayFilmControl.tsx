"use client";

import React from "react";
import { ToggleSwitch, BrikAccordionSection, BrikSliderControl } from "../common";

interface OverlayFilmControlProps {
  enabled: boolean;
  onToggleEnable: (enabled: boolean) => void;
  blurAmount: number;
  onChangeBlurAmount: (blur: number) => void;
  opacity: number;
  onChangeOpacity: (opacity: number) => void;
}

export const OverlayFilmControl: React.FC<OverlayFilmControlProps> = ({
  enabled,
  onToggleEnable,
  blurAmount,
  onChangeBlurAmount,
  opacity,
  onChangeOpacity
}) => {
  return (
    <BrikAccordionSection title="Gaussian Blur & Film" defaultOpen={true}>
      <div style={{ marginBottom: 14 }}>
        <ToggleSwitch
          label="Gaussian Blur Layer"
          checked={enabled}
          onChange={(val) => onToggleEnable(val)}
        />

        {enabled && (
          <div style={{ marginTop: 10 }}>
            <BrikSliderControl
              label="Gaussian Blur"
              value={blurAmount}
              min={0}
              max={40}
              step={1}
              valueDisplay={`${blurAmount}px`}
              onChange={onChangeBlurAmount}
              marginBottom={10}
            />

            <BrikSliderControl
              label="Film Tint Opacity"
              value={opacity}
              min={0}
              max={1}
              step={0.05}
              valueDisplay={`${Math.round(opacity * 100)}%`}
              onChange={onChangeOpacity}
              marginBottom={10}
            />
          </div>
        )}
      </div>
    </BrikAccordionSection>
  );
};
