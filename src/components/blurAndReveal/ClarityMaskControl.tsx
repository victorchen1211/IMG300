"use client";

import React from "react";
import styles from "../../app/page.module.scss";
import { ToggleSwitch } from "../common/ToggleSwitch";

export interface MaskLayer {
  id: string;
  enabled: boolean;
  width: number;
  height: number;
  borderColor: string;
  borderWidth: number;
  showCrosshair: boolean;
  posX: number; // 0 to 1
  posY: number; // 0 to 1
}

interface ClarityMaskControlProps {
  masks: MaskLayer[];
  selectedMaskId: string;
  onAddMask: () => void;
  onDeleteMask: (id: string) => void;
  onSelectMask: (id: string) => void;
  onUpdateMask: (id: string, updates: Partial<MaskLayer>) => void;
}

export const COLOR_PRESETS = [
  { label: "Palette Accent", value: "palette" },
  { label: "White", value: "#ffffff" },
  { label: "Black", value: "#000000" },
  { label: "Red", value: "#ff3b30" },
  { label: "Yellow", value: "#ffcc00" },
  { label: "Blue", value: "#007aff" },
  { label: "Green", value: "#34c759" }
];

export const ClarityMaskControl: React.FC<ClarityMaskControlProps> = ({
  masks,
  selectedMaskId,
  onAddMask,
  onDeleteMask,
  onSelectMask,
  onUpdateMask
}) => {
  const activeMask = masks.find((m) => m.id === selectedMaskId) || masks[0];

  return (
    <div>
      <div className={styles.sectionHeader}>
        <span>Rectangle Masks ({masks.length})</span>
      </div>
      <div style={{ marginBottom: 14 }}>
        {/* Mask Tabs Header & Add Button */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {masks.map((m, idx) => (
            <button
              key={m.id}
              className={m.id === selectedMaskId ? "active" : ""}
              style={{
                fontSize: "11px",
                padding: "4px 8px",
                flex: "1 0 auto",
                minWidth: "60px"
              }}
              onClick={() => onSelectMask(m.id)}
            >
              Mask {idx + 1}
            </button>
          ))}
          <button
            className="primary"
            style={{ fontSize: "11px", padding: "4px 10px" }}
            onClick={onAddMask}
          >
            + Add Mask
          </button>
        </div>

        {activeMask && (
          <>
            {/* Delete Active Mask Button */}
            {masks.length > 1 && (
              <div style={{ marginBottom: 10 }}>
                <button
                  style={{
                    width: "100%",
                    fontSize: "10px",
                    padding: "4px",
                    color: "#ff3b30",
                    borderColor: "#ff3b30"
                  }}
                  onClick={() => onDeleteMask(activeMask.id)}
                >
                  Remove Mask {masks.findIndex((m) => m.id === activeMask.id) + 1}
                </button>
              </div>
            )}

            {/* Toggle Enable */}
            <ToggleSwitch
              label="Enable Mask Layer"
              checked={activeMask.enabled}
              onChange={(val) => onUpdateMask(activeMask.id, { enabled: val })}
            />

            {activeMask.enabled && (
              <>
                <div style={{ fontSize: 8, color: "#aaa", marginBottom: 8, lineHeight: 1.4 }}>
                  Hint: Drag or click canvas directly to position mask
                </div>

                {/* Mask Width */}
                <div className={styles.controlGroup}>
                  <div className={styles.controlHeader}>
                    <span className={styles.controlLabel}>Mask Width</span>
                    <span className={styles.controlValue}>{activeMask.width}px</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={1200}
                    step={10}
                    value={activeMask.width}
                    onChange={(e) => onUpdateMask(activeMask.id, { width: parseInt(e.target.value) })}
                  />
                </div>

                {/* Mask Height */}
                <div className={styles.controlGroup}>
                  <div className={styles.controlHeader}>
                    <span className={styles.controlLabel}>Mask Height</span>
                    <span className={styles.controlValue}>{activeMask.height}px</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={1200}
                    step={10}
                    value={activeMask.height}
                    onChange={(e) => onUpdateMask(activeMask.id, { height: parseInt(e.target.value) })}
                  />
                </div>

                {/* Border Color */}
                <div className={styles.controlGroup}>
                  <div className={styles.controlHeader}>
                    <span className={styles.controlLabel}>Border Color</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <select
                      value={activeMask.borderColor}
                      onChange={(e) => onUpdateMask(activeMask.id, { borderColor: e.target.value })}
                      style={{ flex: 1 }}
                    >
                      {COLOR_PRESETS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="color"
                      value={activeMask.borderColor === "palette" ? "#ffffff" : activeMask.borderColor}
                      onChange={(e) => onUpdateMask(activeMask.id, { borderColor: e.target.value })}
                      style={{
                        width: 32,
                        height: 32,
                        padding: 0,
                        border: "1px solid #ddd",
                        cursor: "pointer",
                        background: "none"
                      }}
                      title="Custom Color Picker"
                    />
                  </div>
                </div>

                {/* Border Width */}
                <div className={styles.controlGroup}>
                  <div className={styles.controlHeader}>
                    <span className={styles.controlLabel}>Border Width</span>
                    <span className={styles.controlValue}>{activeMask.borderWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    step={1}
                    value={activeMask.borderWidth}
                    onChange={(e) => onUpdateMask(activeMask.id, { borderWidth: parseInt(e.target.value) })}
                  />
                </div>

                {/* Crosshair Toggle */}
                <ToggleSwitch
                  label="Center Crosshair (+)"
                  checked={activeMask.showCrosshair}
                  onChange={(val) => onUpdateMask(activeMask.id, { showCrosshair: val })}
                />

                {/* Position X */}
                <div className={styles.controlGroup}>
                  <div className={styles.controlHeader}>
                    <span className={styles.controlLabel}>Position X</span>
                    <span className={styles.controlValue}>{(activeMask.posX * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={activeMask.posX * 100}
                    onChange={(e) => onUpdateMask(activeMask.id, { posX: parseFloat(e.target.value) / 100 })}
                  />
                </div>

                {/* Position Y */}
                <div className={styles.controlGroup}>
                  <div className={styles.controlHeader}>
                    <span className={styles.controlLabel}>Position Y</span>
                    <span className={styles.controlValue}>{(activeMask.posY * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={activeMask.posY * 100}
                    onChange={(e) => onUpdateMask(activeMask.id, { posY: parseFloat(e.target.value) / 100 })}
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
