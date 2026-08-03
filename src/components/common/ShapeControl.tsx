"use client";

import React, { useState } from "react";
import styles from "../../app/page.module.scss";
import { PosterLayer, VectorShapeType } from "../../hooks/useLayerManager";
import { BrikAccordionSection } from "./BrikAccordionSection";
import { BrikSliderControl } from "./BrikSliderControl";
import { ColorPickerControl } from "./ColorPickerControl";

export const VECTOR_SHAPE_OPTIONS: { label: string; icon: string; value: VectorShapeType }[] = [
  { label: "Rectangle", icon: "□", value: "rectangle" },
  { label: "Ellipse", icon: "◯", value: "ellipse" },
  { label: "Polygon", icon: "⬡", value: "polygon" }
];

interface ShapeControlProps {
  shapeLayers: PosterLayer[];
  selectedLayerId: string | null;
  onAddShape: () => void;
  onDeleteShape: (id: string) => void;
  onSelectShape: (id: string) => void;
  onUpdateShape: (id: string, updates: Partial<PosterLayer>) => void;
}

export const ShapeControl: React.FC<ShapeControlProps> = ({
  shapeLayers,
  selectedLayerId,
  onAddShape,
  onDeleteShape,
  onSelectShape,
  onUpdateShape
}) => {
  const [hoverAdd, setHoverAdd] = useState(false);

  const activeShapeIndex = shapeLayers.findIndex((l) => l.id === selectedLayerId);
  const activeShape = activeShapeIndex >= 0 ? shapeLayers[activeShapeIndex] : null;

  return (
    <BrikAccordionSection title={`Shape Settings (${shapeLayers.length})`} defaultOpen={true}>
      <div style={{ marginBottom: 12 }}>
        {/* 1. Header Action: Tabs + "+ Add Shape" Button */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          {shapeLayers.map((shape, idx) => (
            <button
              key={shape.id}
              style={{
                fontSize: "11px",
                fontWeight: shape.id === selectedLayerId ? 800 : 700,
                padding: "6px 10px",
                height: "36px",
                flex: "1 0 auto",
                minWidth: "60px",
                background: shape.id === selectedLayerId ? "#000000" : "#ffffff",
                color: shape.id === selectedLayerId ? "#ffffff" : "#000000",
                border: "2px solid #000000",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              onClick={() => onSelectShape(shape.id)}
            >
              Shape {idx + 1}
            </button>
          ))}

          {/* Unified "+ Add Shape" Button */}
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
            onClick={onAddShape}
          >
            + Add Shape
          </button>
        </div>

        {/* 2. Active Shape Layer Controls */}
        {activeShape ? (
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
              Shape {activeShapeIndex + 1} Controls
            </div>

            {/* Shape Geometry Selector Dropdown */}
            <div className={styles.controlGroup} style={{ marginBottom: 10 }}>
              <div className={styles.controlHeader} style={{ marginBottom: 4 }}>
                <span className={styles.controlLabel}>Shape Geometry</span>
              </div>
              <select
                value={activeShape.vectorShapeType || "rectangle"}
                onChange={(e) =>
                  onUpdateShape(activeShape.id, {
                    vectorShapeType: e.target.value as VectorShapeType
                  })
                }
                style={{ width: "100%" }}
              >
                {VECTOR_SHAPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rotate Angle Slider */}
            <BrikSliderControl
              label="Rotate Angle"
              value={activeShape.rotation ?? 0}
              min={0}
              max={360}
              step={5}
              valueDisplay={`${activeShape.rotation ?? 0}°`}
              onChange={(v) => onUpdateShape(activeShape.id, { rotation: v })}
              marginBottom={10}
            />

            {/* Proportional Scale Slider (20% to 1000%) */}
            <BrikSliderControl
              label="Scale / Size"
              value={Math.round((activeShape.scale || 1.0) * 100)}
              min={20}
              max={1000}
              step={10}
              valueDisplay={`${Math.round((activeShape.scale || 1.0) * 100)}%`}
              onChange={(v) => onUpdateShape(activeShape.id, { scale: v / 100 })}
              marginBottom={10}
            />

            {/* Shape Stretch Aspect Ratio Slider (Rectangle, Ellipse, Polygon) */}
            <BrikSliderControl
              label="Aspect Ratio"
              value={Math.round((activeShape.aspectRatio ?? 1.0) * 100)}
              min={1}
              max={1000}
              step={1}
              valueDisplay={`${Math.round((activeShape.aspectRatio ?? 1.0) * 100)}%`}
              onChange={(v) => onUpdateShape(activeShape.id, { aspectRatio: Math.max(0.01, v / 100) })}
              marginBottom={10}
            />

            {/* Opacity Slider */}
            <BrikSliderControl
              label="Opacity"
              value={Math.round((activeShape.opacity ?? 1.0) * 100)}
              min={0}
              max={100}
              step={5}
              valueDisplay={`${Math.round((activeShape.opacity ?? 1.0) * 100)}%`}
              onChange={(v) => onUpdateShape(activeShape.id, { opacity: v / 100 })}
              marginBottom={10}
            />

            {/* Polygon Sides Slider (Visible only if Polygon) */}
            {activeShape.vectorShapeType === "polygon" && (
              <BrikSliderControl
                label="Polygon Sides"
                value={activeShape.sides ?? 5}
                min={3}
                max={10}
                step={1}
                valueDisplay={`${activeShape.sides ?? 5}`}
                onChange={(v) => onUpdateShape(activeShape.id, { sides: v })}
                marginBottom={10}
              />
            )}

            {/* Mode Switch: Solid Fill vs Cutout Mode */}
            <div className={styles.controlGroup} style={{ marginBottom: 12 }}>
              <div className={styles.controlHeader} style={{ marginBottom: 4 }}>
                <span className={styles.controlLabel}>Render Mode</span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  background: "#f4f4f4",
                  padding: "4px",
                  borderRadius: "6px"
                }}
              >
                <button
                  type="button"
                  style={{
                    flex: 1,
                    fontSize: "11px",
                    fontWeight: !activeShape.isCutout ? 800 : 600,
                    padding: "6px",
                    background: !activeShape.isCutout ? "#000000" : "transparent",
                    color: !activeShape.isCutout ? "#ffffff" : "#666666",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onClick={() => onUpdateShape(activeShape.id, { isCutout: false })}
                >
                  Solid Fill
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    fontSize: "11px",
                    fontWeight: activeShape.isCutout ? 800 : 600,
                    padding: "6px",
                    background: activeShape.isCutout ? "#000000" : "transparent",
                    color: activeShape.isCutout ? "#ffffff" : "#666666",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onClick={() => onUpdateShape(activeShape.id, { isCutout: true })}
                >
                  Cutout Mode
                </button>
              </div>
            </div>

            {/* Fill Color Picker (Disabled if Cutout Mode) */}
            {!activeShape.isCutout ? (
              <ColorPickerControl
                label="Fill Color"
                value={activeShape.fillColor || "#ff3b30"}
                onChange={(c) => onUpdateShape(activeShape.id, { fillColor: c })}
                marginBottom={10}
              />
            ) : (
              <div
                style={{
                  fontSize: "11px",
                  color: "#666666",
                  background: "#f0f0f0",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  marginBottom: 10,
                  fontStyle: "italic"
                }}
              >
                ✂ Cutout Mode: Shape punches a hole through underlying layers.
              </div>
            )}

            {/* Stroke Color Picker & Width Slider (Disabled if Cutout Mode) */}
            {!activeShape.isCutout && (
              <>
                <ColorPickerControl
                  label="Stroke Color"
                  value={activeShape.strokeColor || "#000000"}
                  onChange={(c) => onUpdateShape(activeShape.id, { strokeColor: c })}
                  marginBottom={10}
                />

                <BrikSliderControl
                  label="Stroke Width"
                  value={activeShape.strokeWidth ?? 0}
                  min={0}
                  max={20}
                  step={1}
                  valueDisplay={`${activeShape.strokeWidth ?? 0}px`}
                  onChange={(v) => onUpdateShape(activeShape.id, { strokeWidth: v })}
                  marginBottom={12}
                />
              </>
            )}

            {/* Delete Shape Button */}
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
                onClick={() => onDeleteShape(activeShape.id)}
              >
                Remove Shape {activeShapeIndex + 1}
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
            Click &quot;+ Add Shape&quot; above to create a vector shape layer.
          </div>
        )}
      </div>
    </BrikAccordionSection>
  );
};
