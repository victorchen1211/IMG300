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
  textAlign: TextAlignMode;
  posX: number; // 0 to 1
  posY: number; // 0 to 1
}

interface TypographyControlProps {
  texts: TextLayer[];
  selectedTextId: string;
  onAddText: () => void;
  onDeleteText: (id: string) => void;
  onSelectText: (id: string) => void;
  onUpdateText: (id: string, updates: Partial<TextLayer>) => void;
}

export const TypographyControl: React.FC<TypographyControlProps> = ({
  texts,
  selectedTextId,
  onAddText,
  onDeleteText,
  onSelectText,
  onUpdateText
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
                <div style={{ fontSize: 8, color: "#aaa", marginBottom: 8, lineHeight: 1.4 }}>
                  Hint: Drag canvas directly to position text
                </div>

                <textarea
                  rows={3}
                  placeholder="Type custom text..."
                  value={activeText.text}
                  onChange={(e) => onUpdateText(activeText.id, { text: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px",
                    fontSize: "12px",
                    fontFamily: '"Telegraf", system-ui, sans-serif',
                    border: "1px solid #ddd",
                    borderRadius: "0",
                    background: "#ffffff",
                    color: "#222",
                    resize: "vertical",
                    marginBottom: 10
                  }}
                />

                {/* Font Size */}
                <div className={styles.controlGroup}>
                  <div className={styles.controlHeader}>
                    <span className={styles.controlLabel}>Font Size</span>
                    <span className={styles.controlValue}>{activeText.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={16}
                    max={160}
                    step={2}
                    value={activeText.fontSize}
                    onChange={(e) => onUpdateText(activeText.id, { fontSize: parseInt(e.target.value) })}
                  />
                </div>

                {/* Text Alignment */}
                <div className={styles.controlGroup}>
                  <div className={styles.controlHeader}>
                    <span className={styles.controlLabel}>Text Align</span>
                  </div>
                  <select
                    value={activeText.textAlign}
                    onChange={(e) => onUpdateText(activeText.id, { textAlign: e.target.value as TextAlignMode })}
                    style={{ marginBottom: 10 }}
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
