"use client";

import React from "react";
import styles from "../../app/page.module.scss";
import { ToggleSwitch } from "./ToggleSwitch";

export type TextAlignMode = "left" | "center" | "right";

export interface TextLayer {
  id: string;
  enabled: boolean;
  text: string;
  fontSize: number;
  fontFamily?: string;
  textAlign: TextAlignMode;
  color: string;
  posX: number; // 0 to 1
  posY: number; // 0 to 1
  behindGlass?: boolean; // Optional: for Glass Effect (true = behind glass pane)
}

export const FONT_OPTIONS = [
  { label: "Telegraf (Swiss Grotesk)", value: '"Telegraf", system-ui, sans-serif' },
  { label: "Inter (Clean Neo-Grotesque)", value: '"Inter", system-ui, sans-serif' },
  { label: "Playfair Display (Editorial Serif)", value: '"Playfair Display", Georgia, serif' },
  { label: "Cinzel (Luxury Roman Serif)", value: '"Cinzel", Times, serif' },
  { label: "Space Mono (Technical Monospace)", value: '"Space Mono", monospace' },
  { label: "Outfit (Geometric Sans)", value: '"Outfit", system-ui, sans-serif' },
  { label: "System Sans (Default)", value: 'system-ui, -apple-system, sans-serif' }
];

interface TypographyControlProps {
  texts: TextLayer[];
  selectedTextId: string;
  onAddText: () => void;
  onDeleteText: (id: string) => void;
  onSelectText: (id: string) => void;
  onUpdateText: (id: string, updates: Partial<TextLayer>) => void;
  showBehindGlassOption?: boolean;
}

export const TypographyControl: React.FC<TypographyControlProps> = ({
  texts,
  selectedTextId,
  onAddText,
  onDeleteText,
  onSelectText,
  onUpdateText,
  showBehindGlassOption = false
}) => {
  const activeText = texts.find((t) => t.id === selectedTextId) || texts[0];

  return (
    <div>
      <div className={styles.sectionHeader}>
        <span>Typography Texts ({texts.length})</span>
      </div>
      <div style={{ marginBottom: 14 }}>
        {/* Text Tabs Header & Add Button */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {texts.map((t, idx) => (
            <button
              key={t.id}
              className={t.id === selectedTextId ? "active" : ""}
              style={{
                fontSize: "11px",
                padding: "4px 8px",
                flex: "1 0 auto",
                minWidth: "60px"
              }}
              onClick={() => onSelectText(t.id)}
            >
              Text {idx + 1}
            </button>
          ))}
          <button
            className="primary"
            style={{ fontSize: "11px", padding: "4px 10px" }}
            onClick={onAddText}
          >
            + Add Text
          </button>
        </div>

        {activeText && (
          <>
            {/* Delete Active Text Button */}
            {texts.length > 1 && (
              <div style={{ marginBottom: 10 }}>
                <button
                  style={{
                    width: "100%",
                    fontSize: "10px",
                    padding: "4px",
                    color: "#ff3b30",
                    borderColor: "#ff3b30"
                  }}
                  onClick={() => onDeleteText(activeText.id)}
                >
                  Remove Text {texts.findIndex((t) => t.id === activeText.id) + 1}
                </button>
              </div>
            )}

            {/* Toggle Enable */}
            <ToggleSwitch
              label="Enable Typography Layer"
              checked={activeText.enabled}
              onChange={(val) => onUpdateText(activeText.id, { enabled: val })}
            />

            {activeText.enabled && (
              <>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 8, lineHeight: 1.4 }}>
                  Hint: Drag canvas directly to reposition active text
                </div>

                {/* Text Content Input */}
                <textarea
                  rows={3}
                  placeholder="Type custom text..."
                  value={activeText.text}
                  onChange={(e) => onUpdateText(activeText.id, { text: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px",
                    fontSize: "12px",
                    fontFamily: activeText.fontFamily || '"Telegraf", system-ui, sans-serif',
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "4px",
                    background: "rgba(0, 0, 0, 0.4)",
                    color: "#fff",
                    resize: "vertical",
                    marginBottom: 10
                  }}
                />

                {/* Font Family Selection */}
                <div className={styles.controlGroup}>
                  <div className={styles.controlHeader}>
                    <span className={styles.controlLabel}>Font Family</span>
                  </div>
                  <select
                    value={activeText.fontFamily || FONT_OPTIONS[0].value}
                    onChange={(e) => onUpdateText(activeText.id, { fontFamily: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      background: "rgba(0,0,0,0.4)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 4,
                      fontSize: "12px",
                      marginBottom: 10
                    }}
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size */}
                <div className={styles.controlGroup}>
                  <div className={styles.controlHeader}>
                    <span className={styles.controlLabel}>Font Size</span>
                    <span className={styles.controlValue}>{activeText.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={16}
                    max={200}
                    step={2}
                    value={activeText.fontSize}
                    onChange={(e) => onUpdateText(activeText.id, { fontSize: parseInt(e.target.value) })}
                  />
                </div>

                {/* Flexible Color Picker & Swatches */}
                <div className={styles.controlGroup}>
                  <div className={styles.controlHeader}>
                    <span className={styles.controlLabel}>Text Color</span>
                    <span className={styles.controlValue}>{activeText.color.toUpperCase()}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, marginBottom: 10 }}>
                    {/* Preset Swatches */}
                    {["#ffffff", "#000000", "#ff3366", "#00e5ff", "#ffcc00"].map((c) => (
                      <button
                        key={c}
                        onClick={() => onUpdateText(activeText.id, { color: c })}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          backgroundColor: c,
                          border: activeText.color.toLowerCase() === c ? "2px solid #fff" : "1px solid rgba(255,255,255,0.2)",
                          cursor: "pointer",
                          padding: 0
                        }}
                      />
                    ))}
                    {/* Native Custom Color Picker Input */}
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <input
                        type="color"
                        value={activeText.color.startsWith("#") ? activeText.color : "#ffffff"}
                        onChange={(e) => onUpdateText(activeText.id, { color: e.target.value })}
                        style={{
                          width: 26,
                          height: 26,
                          padding: 0,
                          border: "none",
                          borderRadius: "50%",
                          cursor: "pointer",
                          background: "none"
                        }}
                        title="Custom Color Picker"
                      />
                    </div>
                  </div>
                </div>

                {/* Text Alignment */}
                <div className={styles.controlGroup}>
                  <div className={styles.controlHeader}>
                    <span className={styles.controlLabel}>Text Align</span>
                  </div>
                  <select
                    value={activeText.textAlign}
                    onChange={(e) => onUpdateText(activeText.id, { textAlign: e.target.value as TextAlignMode })}
                    style={{
                      width: "100%",
                      padding: "6px",
                      background: "rgba(0,0,0,0.4)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 4,
                      marginBottom: 10
                    }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                {/* Position X */}
                <div className={styles.controlGroup}>
                  <div className={styles.controlHeader}>
                    <span className={styles.controlLabel}>Position X</span>
                    <span className={styles.controlValue}>{(activeText.posX * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={activeText.posX * 100}
                    onChange={(e) => onUpdateText(activeText.id, { posX: parseFloat(e.target.value) / 100 })}
                  />
                </div>

                {/* Position Y */}
                <div className={styles.controlGroup}>
                  <div className={styles.controlHeader}>
                    <span className={styles.controlLabel}>Position Y</span>
                    <span className={styles.controlValue}>{(activeText.posY * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={activeText.posY * 100}
                    onChange={(e) => onUpdateText(activeText.id, { posY: parseFloat(e.target.value) / 100 })}
                  />
                </div>

                {/* Optional Behind Glass Option for Glass Effect */}
                {showBehindGlassOption && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                    <span className={styles.controlLabel}>Place Behind Glass Pane</span>
                    <input
                      type="checkbox"
                      checked={activeText.behindGlass ?? true}
                      onChange={(e) => onUpdateText(activeText.id, { behindGlass: e.target.checked })}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
