"use client";

import React from "react";
import styles from "../../app/page.module.scss";
import { ShapeType, SHAPE_OPTIONS } from "./shapeVectorMath";
import { AccordionSection } from "../common";

interface ShapeSelectorPanelProps {
  selectedShape: ShapeType;
  onSelectShape: (shape: ShapeType) => void;
}

export const ShapeSelectorPanel: React.FC<ShapeSelectorPanelProps> = ({
  selectedShape,
  onSelectShape
}) => {
  return (
    <AccordionSection title="Mosaic Shape Unit" defaultOpen={true}>
      <div className={styles.controlGroup} style={{ marginBottom: 12 }}>
        <div className={styles.controlHeader} style={{ marginBottom: 8 }}>
          <span className={styles.controlLabel}>Select Shape</span>
          <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>
            {selectedShape}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {SHAPE_OPTIONS.map((item) => (
            <button
              key={item.id}
              style={{
                padding: "10px 8px",
                fontSize: "12px",
                fontWeight: selectedShape === item.id ? 800 : 700,
                background: selectedShape === item.id ? "#000000" : "#ffffff",
                border: "2px solid #000000",
                color: selectedShape === item.id ? "#ffffff" : "#000000",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onClick={() => onSelectShape(item.id)}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </AccordionSection>
  );
};
