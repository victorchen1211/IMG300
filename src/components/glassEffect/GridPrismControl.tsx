"use client";

import React from "react";
import styles from "../../app/page.module.scss";
import { ToggleSwitch } from "../common/ToggleSwitch";

interface GridPrismControlProps {
  enabled: boolean;
  onToggleEnable: (enabled: boolean) => void;
  gridScale: number;
  onChangeGridScale: (scale: number) => void;
  gridDistortion: number;
  onChangeGridDistortion: (dist: number) => void;
  roundness: number;
  onChangeRoundness: (rnd: number) => void;
  highlight: number;
  onChangeHighlight: (hl: number) => void;
  shadow: number;
  onChangeShadow: (sh: number) => void;
}

export const GridPrismControl: React.FC<GridPrismControlProps> = ({
  enabled,
  onToggleEnable,
  gridScale,
  onChangeGridScale,
  gridDistortion,
  onChangeGridDistortion,
  roundness,
  onChangeRoundness,
  highlight,
  onChangeHighlight,
  shadow,
  onChangeShadow
}) => {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <span>Diamond Faceted Prism Glass</span>
      </div>
      <div style={{ marginBottom: 14 }}>
        {/* Toggle Switch */}
        <ToggleSwitch
          label="Diamond Prism Effect"
          checked={enabled}
          onChange={(val) => onToggleEnable(val)}
        />

        {enabled && (
          <>
            {/* Diamond Grid Density Scale */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Diamond Grid Density</span>
                <span className={styles.controlValue}>{gridScale}</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={1}
                value={gridScale}
                onChange={(e) => onChangeGridScale(parseInt(e.target.value))}
              />
            </div>

            {/* Facet Corner Roundness (Diamond -> Circle) */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Facet Roundness (Diamond → Circle)</span>
                <span className={styles.controlValue}>{roundness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={roundness}
                onChange={(e) => onChangeRoundness(parseFloat(e.target.value))}
              />
            </div>

            {/* Prism Refraction Distortion */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Refraction Distortion</span>
                <span className={styles.controlValue}>{gridDistortion.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.15}
                step={0.005}
                value={gridDistortion}
                onChange={(e) => onChangeGridDistortion(parseFloat(e.target.value))}
              />
            </div>

            {/* Directional Specular Highlight */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Facet Specular Highlight</span>
                <span className={styles.controlValue}>{highlight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.4}
                step={0.01}
                value={highlight}
                onChange={(e) => onChangeHighlight(parseFloat(e.target.value))}
              />
            </div>

            {/* Facet Edge Shadow */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Facet Edge Shadow</span>
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
