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
        <span>Canvas Size</span>
      </div>
      <select value={selectedFormat} onChange={(e) => onSelectFormat(e.target.value)} style={{ marginBottom: 16 }}>
        {Object.keys(EXPORT_SIZES).map((fmt) => (
          <option key={fmt} value={fmt}>
            {fmt}
          </option>
        ))}
      </select>
    </div>
  );
};
