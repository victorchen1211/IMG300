"use client";

import React from "react";
import styles from "../../app/page.module.scss";
import { ToggleSwitch } from "./ToggleSwitch";
import { BrikAccordionSection } from "./BrikAccordionSection";
import { BrikSliderControl } from "./BrikSliderControl";

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
    <BrikAccordionSection title={`Typography Texts (${texts.length})`} defaultOpen={true}>
      <div style={{ marginBottom: 14 }}>
        {/* Text Tabs Header & Add Button */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {texts.map((t, idx) => (
            <button
              key={t.id}
              style={{
                fontSize: "11px",
                fontWeight: t.id === selectedTextId ? 800 : 700,
                padding: "6px 10px",
                flex: "1 0 auto",
                minWidth: "60px",
                background: t.id === selectedTextId ? "#000000" : "#ffffff",
                color: t.id === selectedTextId ? "#ffffff" : "#000000",
                border: "2px solid #000000",
                borderRadius: "6px",
                cursor: "pointer"
              }}
              onClick={() => onSelectText(t.id)}
            >
              Text {idx + 1}
            </button>
          ))}
          <button
            style={{
              fontSize: "11px",
              fontWeight: 800,
              padding: "6px 10px",
              background: "#00e5ff",
              color: "#000000",
              border: "2px solid #000000",
              borderRadius: "6px",
              cursor: "pointer"
            }}
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
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "6px",
                    color: "#ff3b30",
                    border: "1px solid #ff3b30",
                    background: "#fff0f0",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                  onClick={() => onDeleteText(activeText.id)}
                >
                  Remove Text {texts.findIndex((t) => t.id === activeText.id) + 1}
                </button>
              </div>
            )}

            {/* Toggle Enable */}
            <ToggleSwitch
              label="Enable Text Layer"
              checked={activeText.enabled}
              onChange={(val) => onUpdateText(activeText.id, { enabled: val })}
            />

            {activeText.enabled && (
              <div style={{ marginTop: 10 }}>
                {/* Text String Input */}
                <div className={styles.controlGroup} style={{ marginBottom: 10 }}>
                  <div className={styles.controlHeader} style={{ marginBottom: 6 }}>
                    <span className={styles.controlLabel}>Text Content</span>
                  </div>
                  <textarea
                    rows={2}
                    value={activeText.text}
                    onChange={(e) => onUpdateText(activeText.id, { text: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px",
                      fontSize: "12px",
                      fontFamily: activeText.fontFamily || '"Telegraf", system-ui, sans-serif',
                      border: "2px solid #000000",
                      borderRadius: "6px",
                      background: "#ffffff",
                      color: "#000000",
                      outline: "none",
                      resize: "vertical"
                    }}
                  />
                </div>

                {/* Font Family Selection */}
                <div className={styles.controlGroup} style={{ marginBottom: 10 }}>
                  <div className={styles.controlHeader} style={{ marginBottom: 6 }}>
                    <span className={styles.controlLabel}>Font Style</span>
                  </div>
                  <select
                    value={activeText.fontFamily || FONT_OPTIONS[0].value}
                    onChange={(e) => onUpdateText(activeText.id, { fontFamily: e.target.value })}
                    style={{ width: "100%" }}
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size */}
                <BrikSliderControl
                  label="Font Size"
                  value={activeText.fontSize}
                  min={16}
                  max={200}
                  step={2}
                  valueDisplay={`${activeText.fontSize}px`}
                  onChange={(val) => onUpdateText(activeText.id, { fontSize: val })}
                  marginBottom={10}
                />

                {/* Text Color */}
                <div className={styles.controlGroup} style={{ marginBottom: 10 }}>
                  <div className={styles.controlHeader} style={{ marginBottom: 6 }}>
                    <span className={styles.controlLabel}>Text Color</span>
                    <span className={styles.controlValue}>{activeText.color.toUpperCase()}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {/* Preset Swatches */}
                    {["#ffffff", "#000000", "#ff3366", "#00e5ff", "#ffcc00"].map((c) => (
                      <button
                        key={c}
                        onClick={() => onUpdateText(activeText.id, { color: c })}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          backgroundColor: c,
                          border: activeText.color.toLowerCase() === c ? "3px solid #00e5ff" : "1px solid #ccc",
                          cursor: "pointer",
                          padding: 0
                        }}
                      />
                    ))}
                    {/* Native Custom Color Picker Input */}
                    <input
                      type="color"
                      value={activeText.color.startsWith("#") ? activeText.color : "#ffffff"}
                      onChange={(e) => onUpdateText(activeText.id, { color: e.target.value })}
                      style={{
                        width: 28,
                        height: 28,
                        padding: 0,
                        border: "2px solid #000000",
                        borderRadius: "50%",
                        cursor: "pointer",
                        background: "none"
                      }}
                      title="Custom Color Picker"
                    />
                  </div>
                </div>

                {/* Text Alignment */}
                <div className={styles.controlGroup} style={{ marginBottom: 10 }}>
                  <div className={styles.controlHeader} style={{ marginBottom: 6 }}>
                    <span className={styles.controlLabel}>Text Align</span>
                  </div>
                  <select
                    value={activeText.textAlign}
                    onChange={(e) => onUpdateText(activeText.id, { textAlign: e.target.value as TextAlignMode })}
                    style={{ width: "100%" }}
                  >
                    <option value="left">Left Alignment</option>
                    <option value="center">Center Alignment</option>
                    <option value="right">Right Alignment</option>
                  </select>
                </div>

                {/* Position X */}
                <BrikSliderControl
                  label="Position X"
                  value={Math.round(activeText.posX * 100)}
                  min={0}
                  max={100}
                  step={1}
                  valueDisplay={`${(activeText.posX * 100).toFixed(0)}%`}
                  onChange={(val) => onUpdateText(activeText.id, { posX: val / 100 })}
                  marginBottom={10}
                />

                {/* Position Y */}
                <BrikSliderControl
                  label="Position Y"
                  value={Math.round(activeText.posY * 100)}
                  min={0}
                  max={100}
                  step={1}
                  valueDisplay={`${(activeText.posY * 100).toFixed(0)}%`}
                  onChange={(val) => onUpdateText(activeText.id, { posY: val / 100 })}
                  marginBottom={10}
                />

                {/* Optional Behind Glass Option for Glass Effect */}
                {showBehindGlassOption && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                    <span className={styles.controlLabel}>Place Behind Glass Pane</span>
                    <input
                      type="checkbox"
                      checked={activeText.behindGlass ?? true}
                      onChange={(e) => onUpdateText(activeText.id, { behindGlass: e.target.checked })}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </BrikAccordionSection>
  );
};
