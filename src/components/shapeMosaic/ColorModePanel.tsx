"use client";

import React from "react";
import styles from "../../app/page.module.scss";
import { ColorPickerControl, RangeSliderControl, AccordionSection } from "../common";

export type ColorMode = "original" | "solid" | "tint";

interface ColorModePanelProps {
  colorMode: ColorMode;
  customColor: string;
  tintRatio: number;
  onSelectColorMode: (mode: ColorMode) => void;
  onChangeCustomColor: (color: string) => void;
  onChangeTintRatio: (ratio: number) => void;
}

export const ColorModePanel: React.FC<ColorModePanelProps> = ({
  colorMode,
  customColor,
  tintRatio,
  onSelectColorMode,
  onChangeCustomColor,
  onChangeTintRatio
}) => {
  return (
    <AccordionSection title="Shape Color & Tint" defaultOpen={true}>
      {/* Color Mode Dropdown */}
      <div className={styles.controlGroup} style={{ marginBottom: 14 }}>
        <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
          <span className={styles.controlLabel}>Color Mode (Dropdown Menu)</span>
          <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>
            {colorMode}
          </span>
        </div>
        <select
          value={colorMode}
          onChange={(e) => onSelectColorMode(e.target.value as ColorMode)}
        >
          <option value="original">Original Image Color</option>
          <option value="solid">Solid Color Override</option>
          <option value="tint">Tint Blend Ratio</option>
        </select>
      </div>

      {/* Custom Color Picker & Presets */}
      {colorMode !== "original" && (
        <>
          <ColorPickerControl
            label="Custom Shape Color"
            value={customColor}
            onChange={onChangeCustomColor}
            marginBottom={14}
          />

          {/* Tint Blend Ratio Slider */}
          {colorMode === "tint" && (
            <RangeSliderControl
              label="Tint Blend Ratio"
              value={tintRatio}
              min={0.1}
              max={1.0}
              step={0.05}
              valueDisplay={`${Math.round(tintRatio * 100)}%`}
              onChange={onChangeTintRatio}
              marginBottom={14}
            />
          )}
        </>
      )}
    </AccordionSection>
  );
};
