"use client";

import React, { useState } from "react";
import styles from "../../app/page.module.scss";
import { PosterLayer } from "../../hooks/useLayerManager";
import { BrikAccordionSection } from "./BrikAccordionSection";
import { BrikSliderControl } from "./BrikSliderControl";
import { ColorPickerControl } from "./ColorPickerControl";

interface MaskControlProps {
  maskLayers: PosterLayer[];
  selectedLayerId: string | null;
  onAddMask: () => void;
  onDeleteMask: (id: string) => void;
  onSelectMask: (id: string) => void;
  onUpdateMask: (id: string, updates: Partial<PosterLayer>) => void;
}

export const MaskControl: React.FC<MaskControlProps> = ({
  maskLayers,
  selectedLayerId,
  onAddMask,
  onDeleteMask,
  onSelectMask,
  onUpdateMask
}) => {
  const [hoverAdd, setHoverAdd] = useState(false);

  const activeMaskIndex = maskLayers.findIndex((l) => l.id === selectedLayerId);
  const activeMask = activeMaskIndex >= 0 ? maskLayers[activeMaskIndex] : null;

  return (
    <BrikAccordionSection title={`Mask Settings (${maskLayers.length})`} defaultOpen={true}>
      <div style={{ marginBottom: 12 }}>
        {/* 1. Header Action: Tabs + "+ Add Mask" Button */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          {maskLayers.map((mask, idx) => (
            <button
              key={mask.id}
              style={{
                fontSize: "11px",
                fontWeight: mask.id === selectedLayerId ? 800 : 700,
                padding: "6px 10px",
                height: "36px",
                flex: "1 0 auto",
                minWidth: "60px",
                background: mask.id === selectedLayerId ? "#000000" : "#ffffff",
                color: mask.id === selectedLayerId ? "#ffffff" : "#000000",
                border: "2px solid #000000",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              onClick={() => onSelectMask(mask.id)}
            >
              Mask {idx + 1}
            </button>
          ))}

          {/* Unified "+ Add Mask" Button */}
          <button
            onMouseEnter={() => setHoverAdd(true)}
            onMouseLeave={() => setHoverAdd(false)}
            style={{
              height: "36px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 800,
              background: "#ffffff",
              color: "#000000",
              border: "2px solid #000000",
              borderRadius: "6px",
              cursor: "pointer",
              flex: "1 0 auto",
              transition: "all 0.15s ease",
              transform: hoverAdd ? "translateY(-1px)" : "none",
              boxShadow: hoverAdd ? "0 4px 12px rgba(0, 0, 0, 0.12)" : "none"
            }}
            onClick={onAddMask}
          >
            + Add Mask
          </button>
        </div>

        {/* 2. Active Mask Layer Controls */}
        {activeMask ? (
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#666666",
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            >
              Mask {activeMaskIndex + 1} Controls
            </div>

            {/* Mask Color Picker */}
            <ColorPickerControl
              label="Mask Color"
              value={activeMask.maskColor || "#000000"}
              onChange={(c) => onUpdateMask(activeMask.id, { maskColor: c })}
              marginBottom={10}
            />

            {/* Mask Opacity Slider */}
            <BrikSliderControl
              label="Mask Opacity"
              value={Math.round((activeMask.maskOpacity ?? 0.85) * 100)}
              min={0}
              max={100}
              step={5}
              valueDisplay={`${Math.round((activeMask.maskOpacity ?? 0.85) * 100)}%`}
              onChange={(v) => onUpdateMask(activeMask.id, { maskOpacity: v / 100 })}
              marginBottom={10}
            />

            {/* Mask Size / Scale Slider */}
            <BrikSliderControl
              label="Mask Scale"
              value={Math.round((activeMask.scale || 1.0) * 100)}
              min={20}
              max={300}
              step={5}
              valueDisplay={`${Math.round((activeMask.scale || 1.0) * 100)}%`}
              onChange={(v) => onUpdateMask(activeMask.id, { scale: v / 100 })}
              marginBottom={12}
            />

            {/* Delete Mask Button */}
            <div style={{ marginTop: 14 }}>
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
                Remove Mask {activeMaskIndex + 1}
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: "11px",
              color: "#888888",
              textAlign: "center",
              padding: "10px",
              background: "#f9f9f9",
              borderRadius: "6px"
            }}
          >
            Click &quot;+ Add Mask&quot; above to create a mask overlay layer.
          </div>
        )}
      </div>
    </BrikAccordionSection>
  );
};
