"use client";

import React from "react";
import styles from "../../app/page.module.scss";
import { EXPORT_SIZES } from "../../constants/generatorPresets";

interface CanvasSizeSelectorProps {
  selectedFormat: string;
  onSelectFormat: (formatKey: string) => void;
}

export const CanvasSizeSelector: React.FC<CanvasSizeSelectorProps> = ({ selectedFormat, onSelectFormat }) => {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <span>Canvas Dimension</span>
      </div>
      <div style={{ marginBottom: 14 }}>
        <select value={selectedFormat} onChange={(e) => onSelectFormat(e.target.value)}>
          {Object.entries(EXPORT_SIZES).map(([key, dim]) => (
            <option key={key} value={key}>
              {key} ({dim.w}x{dim.h})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
