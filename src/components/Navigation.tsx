import React from "react";
import styles from "../app/page.module.scss";

export type AppMode = "circles" | "studio" | "tool" | "hero";

interface NavigationProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentMode, onSelectMode }) => {
  return (
    <div className={styles.navigationBar}>
      <button
        className={`${styles.navButton} ${currentMode === "circles" ? styles.activeNav : ""}`}
        onClick={() => onSelectMode("circles")}
      >
        Circles
      </button>
      <button
        className={`${styles.navButton} ${currentMode === "studio" ? styles.activeNav : ""}`}
        onClick={() => onSelectMode("studio")}
      >
        Studio
      </button>
      <button
        className={`${styles.navButton} ${currentMode === "tool" ? styles.activeNav : ""}`}
        onClick={() => onSelectMode("tool")}
      >
        Geo Tool
      </button>
      <button
        className={`${styles.navButton} ${currentMode === "hero" ? styles.activeNav : ""}`}
        onClick={() => onSelectMode("hero")}
      >
        Hero
      </button>
    </div>
  );
};
