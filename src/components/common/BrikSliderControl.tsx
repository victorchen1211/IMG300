"use client";

import React from "react";

interface BrikSliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  valueDisplay?: string | number;
  onChange: (value: number) => void;
  marginBottom?: number;
}

export const BrikSliderControl: React.FC<BrikSliderControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  valueDisplay,
  onChange,
  marginBottom = 12
}) => {
  // Calculate percentage fill (0% to 100%)
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const displayText = valueDisplay !== undefined ? valueDisplay : value;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom,
        gap: "12px"
      }}
    >
      {/* Left Label */}
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "#111111",
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          whiteSpace: "nowrap"
        }}
      >
        {label}
      </span>

      {/* Right Signature Brik.space Filled Progress Slider Bar */}
      <div
        style={{
          position: "relative",
          width: "140px",
          height: "30px",
          backgroundColor: "#e8e8e8",
          borderRadius: "6px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          flexShrink: 0
        }}
      >
        {/* Solid Black Fill Bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: `${percentage}%`,
            backgroundColor: "#000000",
            borderRadius: "6px 0 0 6px",
            transition: "width 0.05s ease-out",
            pointerEvents: "none"
          }}
        />

        {/* Embedded Value Text */}
        <span
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            textAlign: "center",
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: '"SF Mono", "Menlo", monospace',
            color: percentage > 55 ? "#ffffff" : "#000000",
            pointerEvents: "none",
            userSelect: "none"
          }}
        >
          {displayText}
        </span>

        {/* Overlaid Invisible Range Input for Drag & Click Interaction */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            margin: 0,
            padding: 0,
            cursor: "pointer",
            zIndex: 3
          }}
        />
      </div>
    </div>
  );
};
