"use client";

import React from "react";
import { BrikAccordionSection } from "./BrikAccordionSection";
import { BrikSliderControl } from "./BrikSliderControl";
import { ToggleSwitch } from "./ToggleSwitch";
import { GridSettings } from "../../utils/gridUtils";

interface GridSystemControlProps {
  gridSettings: GridSettings;
  onUpdateGridSettings: (updates: Partial<GridSettings>) => void;
}

export const GridSystemControl: React.FC<GridSystemControlProps> = ({
  gridSettings,
  onUpdateGridSettings
}) => {
  const handleMarginChange = (val: number) => {
    onUpdateGridSettings({
      marginTop: val,
      marginBottom: val,
      marginLeft: val,
      marginRight: val
    });
  };

  const handleGutterChange = (val: number) => {
    onUpdateGridSettings({
      columnGutter: val,
      rowGutter: val
    });
  };

  return (
    <BrikAccordionSection title="Grid System (4×4)" defaultOpen={true}>
      {/* Enable Grid System Toggle */}
      <div style={{ marginBottom: 12 }}>
        <ToggleSwitch
          label="Enable Grid System"
          checked={gridSettings.enabled}
          onChange={(checked) => onUpdateGridSettings({ enabled: checked })}
        />
      </div>

      {gridSettings.enabled && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* 1. Unified Margin Control */}
          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <BrikSliderControl
              label="Margin"
              value={gridSettings.marginTop}
              min={0}
              max={200}
              valueDisplay={`${gridSettings.marginTop}px`}
              onChange={handleMarginChange}
              marginBottom={0}
            />
          </div>

          {/* 2. Unified Gutter Control */}
          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <BrikSliderControl
              label="Gutter"
              value={gridSettings.columnGutter}
              min={0}
              max={60}
              valueDisplay={`${gridSettings.columnGutter}px`}
              onChange={handleGutterChange}
              marginBottom={0}
            />
          </div>
        </div>
      )}
    </BrikAccordionSection>
  );
};
