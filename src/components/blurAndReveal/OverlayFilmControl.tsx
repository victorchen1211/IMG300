"use client";

import React from "react";
import styles from "../../app/page.module.scss";
import { ToggleSwitch } from "../common/ToggleSwitch";

interface OverlayFilmControlProps {
  enabled: boolean;
  onToggleEnable: (enabled: boolean) => void;
  blurAmount: number;
  onChangeBlurAmount: (blur: number) => void;
  opacity: number;
  onChangeOpacity: (opacity: number) => void;
}

export const OverlayFilmControl: React.FC<OverlayFilmControlProps> = ({
  enabled,
  onToggleEnable,
  blurAmount,
  onChangeBlurAmount,
  opacity,
  onChangeOpacity
}) => {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <span>Gaussian Blur & Film</span>
      </div>
      <div style={{ marginBottom: 14 }}>
        <ToggleSwitch
          label="Gaussian Blur Layer"
          checked={enabled}
          onChange={(val) => onToggleEnable(val)}
        />

        {enabled && (
          <>
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Gaussian Blur</span>
                <span className={styles.controlValue}>{blurAmount}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                step={1}
                value={blurAmount}
                onChange={(e) => onChangeBlurAmount(parseInt(e.target.value))}
              />
            </div>

            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Film Tint Opacity</span>
                <span className={styles.controlValue}>{opacity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
