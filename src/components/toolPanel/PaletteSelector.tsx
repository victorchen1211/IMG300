"use client";

import React from "react";
import styles from "../../app/page.module.scss";
import { COLOR_PALETTES } from "../../constants/generatorPresets";

interface PaletteSelectorProps {
  selectedPaletteKey: string;
  onSelectPalette: (paletteKey: string) => void;
}

export const PaletteSelector: React.FC<PaletteSelectorProps> = ({ selectedPaletteKey, onSelectPalette }) => {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <span>Color Palette</span>
      </div>
      <select value={selectedPaletteKey} onChange={(e) => onSelectPalette(e.target.value)} style={{ marginBottom: 14 }}>
        {Object.entries(COLOR_PALETTES).map(([key, pal]) => (
          <option key={key} value={key}>
            {pal.name}
          </option>
        ))}
      </select>
    </div>
  );
};
