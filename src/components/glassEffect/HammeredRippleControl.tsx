"use client";

import React from "react";
import styles from "../../app/page.module.scss";
import { ToggleSwitch } from "../common/ToggleSwitch";

interface HammeredRippleControlProps {
  enabled: boolean;
  onToggleEnable: (enabled: boolean) => void;
  rippleScale: number;
  onChangeRippleScale: (scale: number) => void;
  rippleDistortion: number;
  onChangeRippleDistortion: (dist: number) => void;
  highlight: number;
  onChangeHighlight: (hl: number) => void;
  shadow: number;
  onChangeShadow: (sh: number) => void;
}

export const HammeredRippleControl: React.FC<HammeredRippleControlProps> = ({
  enabled,
  onToggleEnable,
  rippleScale,
  onChangeRippleScale,
  rippleDistortion,
  onChangeRippleDistortion,
  highlight,
  onChangeHighlight,
  shadow,
  onChangeShadow
}) => {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <span>Hammered / Rippled Glass Effect</span>
      </div>
      <div style={{ marginBottom: 14 }}>
        {/* Toggle Switch */}
        <ToggleSwitch
          label="Hammered / Rippled Effect"
          checked={enabled}
          onChange={(val) => onToggleEnable(val)}
        />

        {enabled && (
          <>
            {/* Ripple Noise Scale / Density */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Ripple Density Scale</span>
                <span className={styles.controlValue}>{rippleScale}</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={1}
                value={rippleScale}
                onChange={(e) => onChangeRippleScale(parseInt(e.target.value))}
              />
            </div>

            {/* Ripple Distortion Strength */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Ripple Distortion</span>
                <span className={styles.controlValue}>{rippleDistortion.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.15}
                step={0.005}
                value={rippleDistortion}
                onChange={(e) => onChangeRippleDistortion(parseFloat(e.target.value))}
              />
            </div>

            {/* Specular Highlight */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Water Glare Highlight</span>
                <span className={styles.controlValue}>{highlight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.3}
                step={0.01}
                value={highlight}
                onChange={(e) => onChangeHighlight(parseFloat(e.target.value))}
              />
            </div>

            {/* Ripple Shadow */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Ripple Emboss Shadow</span>
                <span className={styles.controlValue}>{shadow.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.4}
                step={0.01}
                value={shadow}
                onChange={(e) => onChangeShadow(parseFloat(e.target.value))}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
