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
      {/* Color Mode Selection */}
      <div className={styles.controlGroup} style={{ marginBottom: 14 }}>
        <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
          <span className={styles.controlLabel}>Color Mode</span>
          <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>
            {colorMode}
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["original", "solid", "tint"] as const).map((mode) => (
            <button
              key={mode}
              style={{
                flex: 1,
                padding: "8px 4px",
                fontSize: "11px",
                fontWeight: colorMode === mode ? 800 : 700,
                textTransform: "capitalize",
                background: colorMode === mode ? "#000000" : "#ffffff",
                border: "2px solid #000000",
                color: colorMode === mode ? "#ffffff" : "#000000",
                borderRadius: "6px",
                cursor: "pointer"
              }}
              onClick={() => onSelectColorMode(mode)}
            >
              {mode === "original" ? "Original" : mode === "solid" ? "Solid" : "Tint Blend"}
            </button>
          ))}
        </div>
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
