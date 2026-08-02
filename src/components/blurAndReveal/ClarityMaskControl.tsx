"use client";

import React from "react";
import styles from "../../app/page.module.scss";
import { ToggleSwitch, BrikAccordionSection, BrikSliderControl } from "../common";

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
    <BrikAccordionSection title={`Rectangle Masks (${masks.length})`} defaultOpen={true}>
      <div style={{ marginBottom: 14 }}>
        {/* Mask Tabs Header & Add Button */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {masks.map((m, idx) => (
            <button
              key={m.id}
              style={{
                fontSize: "11px",
                fontWeight: m.id === selectedMaskId ? 800 : 700,
                padding: "6px 10px",
                flex: "1 0 auto",
                minWidth: "60px",
                background: m.id === selectedMaskId ? "#000000" : "#ffffff",
                color: m.id === selectedMaskId ? "#ffffff" : "#000000",
                border: "2px solid #000000",
                borderRadius: "6px",
                cursor: "pointer"
              }}
              onClick={() => onSelectMask(m.id)}
            >
              Mask {idx + 1}
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
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "6px",
                    color: "#ff3b30",
                    border: "1px solid #ff3b30",
                    background: "#fff0f0",
                    borderRadius: "6px",
                    cursor: "pointer"
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
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: "11px", color: "#666666", marginBottom: 10 }}>
                  Hint: Drag or click canvas directly to position mask
                </div>

                {/* Mask Width */}
                <BrikSliderControl
                  label="Mask Width"
                  value={activeMask.width}
                  min={50}
                  max={1200}
                  step={10}
                  valueDisplay={`${activeMask.width}px`}
                  onChange={(val) => onUpdateMask(activeMask.id, { width: val })}
                  marginBottom={10}
                />

                {/* Mask Height */}
                <BrikSliderControl
                  label="Mask Height"
                  value={activeMask.height}
                  min={50}
                  max={1200}
                  step={10}
                  valueDisplay={`${activeMask.height}px`}
                  onChange={(val) => onUpdateMask(activeMask.id, { height: val })}
                  marginBottom={10}
                />

                {/* Border Color */}
                <div className={styles.controlGroup} style={{ marginBottom: 10 }}>
                  <div className={styles.controlHeader} style={{ marginBottom: 6 }}>
                    <span className={styles.controlLabel}>Border Color</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
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
                        border: "2px solid #000000",
                        borderRadius: "6px",
                        cursor: "pointer",
                        background: "none"
                      }}
                      title="Custom Color Picker"
                    />
                  </div>
                </div>

                {/* Border Width */}
                <BrikSliderControl
                  label="Border Width"
                  value={activeMask.borderWidth}
                  min={0}
                  max={12}
                  step={1}
                  valueDisplay={`${activeMask.borderWidth}px`}
                  onChange={(val) => onUpdateMask(activeMask.id, { borderWidth: val })}
                  marginBottom={10}
                />

                {/* Crosshair Toggle */}
                <ToggleSwitch
                  label="Center Crosshair (+)"
                  checked={activeMask.showCrosshair}
                  onChange={(val) => onUpdateMask(activeMask.id, { showCrosshair: val })}
                />

                {/* Position X */}
                <BrikSliderControl
                  label="Position X"
                  value={Math.round(activeMask.posX * 100)}
                  min={0}
                  max={100}
                  step={1}
                  valueDisplay={`${(activeMask.posX * 100).toFixed(0)}%`}
                  onChange={(val) => onUpdateMask(activeMask.id, { posX: val / 100 })}
                  marginBottom={10}
                />

                {/* Position Y */}
                <BrikSliderControl
                  label="Position Y"
                  value={Math.round(activeMask.posY * 100)}
                  min={0}
                  max={100}
                  step={1}
                  valueDisplay={`${(activeMask.posY * 100).toFixed(0)}%`}
                  onChange={(val) => onUpdateMask(activeMask.id, { posY: val / 100 })}
                  marginBottom={10}
                />
              </div>
            )}
          </>
        )}
      </div>
    </BrikAccordionSection>
  );
};
