"use client";

import React from "react";
import styles from "../../app/page.module.scss";
import { ToggleSwitch } from "../common/ToggleSwitch";

interface StraightTwistControlProps {
  enabled: boolean;
  onToggleEnable: (enabled: boolean) => void;
  fluteCount: number;
  onChangeFluteCount: (count: number) => void;
  distortionX: number;
  onChangeDistortionX: (dist: number) => void;
  highlight: number;
  onChangeHighlight: (hl: number) => void;
  shadow: number;
  onChangeShadow: (sh: number) => void;
}

export const StraightTwistControl: React.FC<StraightTwistControlProps> = ({
  enabled,
  onToggleEnable,
  fluteCount,
  onChangeFluteCount,
  distortionX,
  onChangeDistortionX,
  highlight,
  onChangeHighlight,
  shadow,
  onChangeShadow
}) => {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <span>Straight Glass Twist Effect</span>
      </div>
      <div style={{ marginBottom: 14 }}>
        {/* Toggle Switch */}
        <ToggleSwitch
          label="Straight Twist Effect"
          checked={enabled}
          onChange={(val) => onToggleEnable(val)}
        />

        {enabled && (
          <>
            {/* Flute Density Count */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Flute Rib Density</span>
                <span className={styles.controlValue}>{fluteCount}</span>
              </div>
              <input
                type="range"
                min={10}
                max={120}
                step={1}
                value={fluteCount}
                onChange={(e) => onChangeFluteCount(parseInt(e.target.value))}
              />
            </div>

            {/* Horizontal Refraction Distortion */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Horizontal Distortion</span>
                <span className={styles.controlValue}>{distortionX.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.15}
                step={0.005}
                value={distortionX}
                onChange={(e) => onChangeDistortionX(parseFloat(e.target.value))}
              />
            </div>

            {/* Ridge Specular Highlight */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Ridge Highlight</span>
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

            {/* Valley Refraction Shadow */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Valley Edge Shadow</span>
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
