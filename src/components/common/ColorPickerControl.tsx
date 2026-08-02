"use client";

import React from "react";
import styles from "../../app/page.module.scss";

export interface ColorPreset {
  name: string;
  value: string;
}

export const DEFAULT_PRESET_COLORS: ColorPreset[] = [
  { name: "Pure White", value: "#ffffff" },
  { name: "Cyber Cyan", value: "#00e5ff" },
  { name: "Neon Pink", value: "#ff007f" },
  { name: "Electric Yellow", value: "#ffea00" },
  { name: "Neon Green", value: "#00ff66" },
  { name: "Sunset Orange", value: "#ff5500" },
  { name: "Pure Black", value: "#000000" }
];

interface ColorPickerControlProps {
  label?: string;
  value: string;
  presets?: ColorPreset[];
  onChange: (color: string) => void;
  marginBottom?: number;
}

export const ColorPickerControl: React.FC<ColorPickerControlProps> = ({
  label = "Custom Color",
  value,
  presets = DEFAULT_PRESET_COLORS,
  onChange,
  marginBottom = 16
}) => {
  return (
    <div className={styles.controlGroup} style={{ marginBottom }}>
      <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
        <span className={styles.controlLabel}>{label}</span>
        <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>
          {value}
        </span>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "36px",
            height: "36px",
            padding: "0",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            background: "transparent"
          }}
        />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 }}>
          {presets.map((c) => (
            <button
              key={c.name}
              onClick={() => onChange(c.value)}
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                backgroundColor: c.value,
                border: value === c.value ? "2px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.2)",
                cursor: "pointer",
                padding: 0
              }}
              title={c.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
