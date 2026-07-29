"use client";

import React from "react";
import styles from "../../app/page.module.scss";

interface ExportControlsProps {
  onExportPNG: () => void;
  onExportSVG: () => void;
}

export const ExportControls: React.FC<ExportControlsProps> = ({ onExportPNG, onExportSVG }) => {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <span>Export Options</span>
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: 14 }}>
        <button className="primary" style={{ flex: 1 }} onClick={onExportPNG}>
          Export PNG
        </button>
        <button className="button" style={{ flex: 1 }} onClick={onExportSVG}>
          Export SVG
        </button>
      </div>
    </div>
  );
};
