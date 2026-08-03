"use client";

import React from "react";
import styles from "../../app/page.module.scss";

export interface AspectRatioOption {
  key: string;
  label: string;
  w: number;
  h: number;
}

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { key: "3:4", label: "3:4", w: 1200, h: 1600 },
  { key: "9:16", label: "9:16", w: 1080, h: 1920 },
  { key: "1:1", label: "1:1", w: 1200, h: 1200 },
  { key: "4:3", label: "4:3", w: 1600, h: 1200 },
  { key: "16:9", label: "16:9", w: 1920, h: 1080 }
];

interface CanvasSizeSelectorProps {
  selectedFormat: string;
  onSelectFormat: (formatKey: string) => void;
  label?: string;
}

export const CanvasSizeSelector: React.FC<CanvasSizeSelectorProps> = ({
  selectedFormat,
  onSelectFormat,
  label = "Aspect Ratio"
}) => {
  return (
    <div style={{ marginBottom: 18 }}>
      {/* Section Title Header */}
      <div className={styles.sectionHeader} style={{ marginBottom: 10 }}>
        <span>{label}</span>
      </div>

      {/* Aspect Ratio Buttons Grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px"
        }}
      >
        {ASPECT_RATIOS.map((item) => {
          const isSelected =
            selectedFormat === item.key ||
            selectedFormat === item.label ||
            selectedFormat.includes(item.key);

          return (
            <button
              key={item.key}
              onClick={() => onSelectFormat(item.key)}
              style={{
                flex: 1,
                minWidth: "52px",
                padding: "8px 10px",
                fontSize: "12px",
                fontWeight: 700,
                borderRadius: "6px",
                border: isSelected ? "1.5px solid #000000" : "1px solid #e2e8f0",
                background: isSelected ? "#000000" : "#ffffff",
                color: isSelected ? "#ffffff" : "#111111",
                cursor: "pointer",
                transition: "all 0.15s ease",
                textAlign: "center"
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
