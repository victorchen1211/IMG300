"use client";

import React, { useState } from "react";
import { BrikAccordionSection } from "./BrikAccordionSection";

interface ExportControlsProps {
  onExportPNG: () => void;
  onExportSVG: () => void;
}

export const ExportControls: React.FC<ExportControlsProps> = ({ onExportPNG, onExportSVG }) => {
  const [hoverPNG, setHoverPNG] = useState(false);
  const [hoverSVG, setHoverSVG] = useState(false);

  return (
    <BrikAccordionSection title="Export Options" defaultOpen={true}>
      <div style={{ display: "flex", gap: "8px", marginTop: 4 }}>
        <button
          onMouseEnter={() => setHoverPNG(true)}
          onMouseLeave={() => setHoverPNG(false)}
          style={{
            flex: 1,
            height: "36px",
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: 800,
            background: hoverPNG ? "#222222" : "#000000",
            color: "#ffffff",
            border: "2px solid #000000",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            transform: hoverPNG ? "translateY(-1px)" : "none",
            boxShadow: hoverPNG ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "none"
          }}
          onClick={onExportPNG}
        >
          Export PNG
        </button>

        <button
          onMouseEnter={() => setHoverSVG(true)}
          onMouseLeave={() => setHoverSVG(false)}
          style={{
            flex: 1,
            height: "36px",
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: 800,
            background: "#ffffff",
            color: "#000000",
            border: "2px solid #000000",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            transform: hoverSVG ? "translateY(-1px)" : "none",
            boxShadow: hoverSVG ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "none"
          }}
          onClick={onExportSVG}
        >
          Export SVG
        </button>
      </div>
    </BrikAccordionSection>
  );
};
