"use client";

import React, { useState, useEffect } from "react";
import styles from "../../app/page.module.scss";

interface ColorPickerControlProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  marginBottom?: number;
}

export const ColorPickerControl: React.FC<ColorPickerControlProps> = ({
  label,
  value = "#000000",
  onChange,
  marginBottom = 14
}) => {
  const [inputText, setInputText] = useState<string>(value);

  // Sync internal text state with external prop value
  useEffect(() => {
    setInputText(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setInputText(rawVal);

    // Validate hex string
    let formatted = rawVal.trim();
    if (!formatted.startsWith("#")) {
      formatted = "#" + formatted;
    }

    if (/^#([0-9A-F]{3}){1,2}$/i.test(formatted)) {
      onChange(formatted.toUpperCase());
    }
  };

  const handleInputBlur = () => {
    // Revert to valid value on blur if invalid
    let formatted = inputText.trim();
    if (!formatted.startsWith("#")) {
      formatted = "#" + formatted;
    }
    if (/^#([0-9A-F]{3}){1,2}$/i.test(formatted)) {
      setInputText(formatted.toUpperCase());
      onChange(formatted.toUpperCase());
    } else {
      setInputText(value);
    }
  };

  // Safe color for circle background fallback
  const circleColor = /^#([0-9A-F]{3}){1,2}$/i.test(value) ? value : "#000000";

  return (
    <div className={styles.controlGroup} style={{ marginBottom }}>
      {/* Header Label if provided */}
      {label && (
        <div className={styles.controlHeader} style={{ marginBottom: 6 }}>
          <span className={styles.controlLabel}>{label}</span>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Color Circle Button (Clicking opens native color picker) */}
        <div
          style={{
            position: "relative",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: circleColor,
            border: "1px solid rgba(0, 0, 0, 0.15)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            cursor: "pointer",
            flexShrink: 0,
            overflow: "hidden",
            transition: "transform 0.15s ease"
          }}
          title="Click to select color"
        >
          <input
            type="color"
            value={circleColor}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              opacity: 0,
              cursor: "pointer"
            }}
          />
        </div>

        {/* Hex Code Input Pill matching screenshot design */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            backgroundColor: "#f4f4f6",
            borderRadius: "20px",
            padding: "8px 16px",
            border: "1px solid transparent",
            transition: "all 0.15s ease"
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="#000000"
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: '"SF Mono", "Menlo", monospace',
              color: "#111111",
              letterSpacing: "0.03em"
            }}
          />
        </div>
      </div>
    </div>
  );
};
