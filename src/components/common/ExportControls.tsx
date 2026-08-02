"use client";

import React from "react";
import { BrikAccordionSection } from "./BrikAccordionSection";

interface ExportControlsProps {
  onExportPNG: () => void;
  onExportSVG: () => void;
}

export const ExportControls: React.FC<ExportControlsProps> = ({ onExportPNG, onExportSVG }) => {
  return (
    <BrikAccordionSection title="Export Options" defaultOpen={true}>
      <div style={{ display: "flex", gap: "8px", marginTop: 4 }}>
        <button
          style={{
            flex: 1,
            padding: "10px",
            fontSize: "12px",
            fontWeight: 800,
            background: "#000000",
            color: "#ffffff",
            border: "2px solid #000000",
            borderRadius: "6px",
            cursor: "pointer"
          }}
          onClick={onExportPNG}
        >
          Export PNG
        </button>
        <button
          style={{
            flex: 1,
            padding: "10px",
            fontSize: "12px",
            fontWeight: 800,
            background: "#00e5ff",
            color: "#000000",
            border: "2px solid #000000",
            borderRadius: "6px",
            cursor: "pointer"
          }}
          onClick={onExportSVG}
        >
          Export SVG
        </button>
      </div>
    </BrikAccordionSection>
  );
};
