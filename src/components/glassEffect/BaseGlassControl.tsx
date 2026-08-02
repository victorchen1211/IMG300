"use client";

import React from "react";
import { ToggleSwitch, BrikAccordionSection, BrikSliderControl } from "../common";

interface BaseGlassControlProps {
  enabled: boolean;
  onToggleEnable: (enabled: boolean) => void;
  width: number;
  onChangeWidth: (w: number) => void;
  height: number;
  onChangeHeight: (h: number) => void;
  opacity: number;
  onChangeOpacity: (op: number) => void;
  blurAmount: number;
  onChangeBlurAmount: (b: number) => void;
  posX: number; // 0 to 100 (%)
  onChangePosX: (x: number) => void;
  posY: number; // 0 to 100 (%)
  onChangePosY: (y: number) => void;
  isFullCanvas?: boolean;
  onToggleFullCanvas?: () => void;
}

export const BaseGlassControl: React.FC<BaseGlassControlProps> = ({
  enabled,
  onToggleEnable,
  width,
  onChangeWidth,
  height,
  onChangeHeight,
  opacity,
  onChangeOpacity,
  blurAmount,
  onChangeBlurAmount,
  posX,
  onChangePosX,
  posY,
  onChangePosY,
  isFullCanvas,
  onToggleFullCanvas
}) => {
  return (
    <BrikAccordionSection title="Base Glass Pane" defaultOpen={true}>
      <div style={{ marginBottom: 14 }}>
        {/* Toggle Switch */}
        <ToggleSwitch
          label="Glass Layer Enable"
          checked={enabled}
          onChange={(val) => onToggleEnable(val)}
        />

        {enabled && (
          <>
            {/* Quick Full Canvas Toggle Button */}
            {onToggleFullCanvas && (
              <div style={{ marginBottom: 12, marginTop: 8 }}>
                <button
                  style={{
                    width: "100%",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "8px",
                    background: isFullCanvas ? "#000000" : "#ffffff",
                    color: isFullCanvas ? "#ffffff" : "#000000",
                    border: "2px solid #000000",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                  onClick={onToggleFullCanvas}
                >
                  {isFullCanvas ? "✓ Full Canvas (100%) Enabled" : "Cover Full Canvas (100%)"}
                </button>
              </div>
            )}

            <div style={{ fontSize: "11px", color: "#666666", marginBottom: 10 }}>
              Hint: Drag canvas directly to position glass pane
            </div>

            {/* Glass Width */}
            <BrikSliderControl
              label="Glass Width"
              value={width}
              min={50}
              max={2000}
              step={10}
              valueDisplay={`${width}px`}
              onChange={onChangeWidth}
              marginBottom={10}
            />

            {/* Glass Height */}
            <BrikSliderControl
              label="Glass Height"
              value={height}
              min={50}
              max={2000}
              step={10}
              valueDisplay={`${height}px`}
              onChange={onChangeHeight}
              marginBottom={10}
            />

            {/* Position X */}
            <BrikSliderControl
              label="Position X (%)"
              value={Math.round(posX)}
              min={0}
              max={100}
              step={1}
              valueDisplay={`${Math.round(posX)}%`}
              onChange={onChangePosX}
              marginBottom={10}
            />

            {/* Position Y */}
            <BrikSliderControl
              label="Position Y (%)"
              value={Math.round(posY)}
              min={0}
              max={100}
              step={1}
              valueDisplay={`${Math.round(posY)}%`}
              onChange={onChangePosY}
              marginBottom={10}
            />

            {/* Glass Opacity */}
            <BrikSliderControl
              label="Glass Opacity"
              value={opacity}
              min={0}
              max={1}
              step={0.05}
              valueDisplay={`${Math.round(opacity * 100)}%`}
              onChange={onChangeOpacity}
              marginBottom={10}
            />

            {/* Blur Amount */}
            <BrikSliderControl
              label="Frosted Blur Amount"
              value={blurAmount}
              min={0}
              max={20}
              step={1}
              valueDisplay={`${blurAmount}px`}
              onChange={onChangeBlurAmount}
              marginBottom={10}
            />
          </>
        )}
      </div>
    </BrikAccordionSection>
  );
};
