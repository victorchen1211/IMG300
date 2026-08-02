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
          <span className={styles.controlLabel}>Select Shape (Dropdown Menu)</span>
          <span className={styles.controlValue} style={{ textTransform: "uppercase" }}>
            {selectedShape}
          </span>
        </div>
        <select
          value={selectedShape}
          onChange={(e) => onSelectShape(e.target.value as ShapeType)}
        >
          {SHAPE_OPTIONS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </AccordionSection>
  );
};
