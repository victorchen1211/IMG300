"use client";

import React from "react";
import styles from "../../app/page.module.scss";
import { ToggleSwitch } from "../common/ToggleSwitch";

interface BaseGlassControlProps {
  enabled: boolean;
  onToggleEnable: (enabled: boolean) => void;
  width: number;
  onChangeWidth: (w: number) => void;
  height: number;
  onChangeHeight: (h: number) => void;
  opacity: number;
  onChangeOpacity: (op: number) => void;
  blurAmount: number;
  onChangeBlurAmount: (b: number) => void;
  posX: number; // 0 to 100 (%)
  onChangePosX: (x: number) => void;
  posY: number; // 0 to 100 (%)
  onChangePosY: (y: number) => void;
  isFullCanvas?: boolean;
  onToggleFullCanvas?: () => void;
}

export const BaseGlassControl: React.FC<BaseGlassControlProps> = ({
  enabled,
  onToggleEnable,
  width,
  onChangeWidth,
  height,
  onChangeHeight,
  opacity,
  onChangeOpacity,
  blurAmount,
  onChangeBlurAmount,
  posX,
  onChangePosX,
  posY,
  onChangePosY,
  isFullCanvas,
  onToggleFullCanvas
}) => {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <span>Base Glass Pane</span>
      </div>
      <div style={{ marginBottom: 14 }}>
        {/* Toggle Switch */}
        <ToggleSwitch
          label="Glass Layer Enable"
          checked={enabled}
          onChange={(val) => onToggleEnable(val)}
        />

        {enabled && (
          <>
            {/* Quick Full Canvas Toggle Button */}
            {onToggleFullCanvas && (
              <div style={{ marginBottom: 10 }}>
                <button
                  className={isFullCanvas ? "primary" : "button"}
                  style={{
                    width: "100%",
                    fontSize: "11px",
                    padding: "6px 8px"
                  }}
                  onClick={onToggleFullCanvas}
                >
                  {isFullCanvas ? "✓ Full Canvas (100%) Enabled" : "Cover Full Canvas (100%)"}
                </button>
              </div>
            )}

            <div style={{ fontSize: 8, color: "#aaa", marginBottom: 8, lineHeight: 1.4 }}>
              Hint: Drag canvas directly to position glass pane
            </div>

            {/* Glass Width */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Glass Width</span>
                <span className={styles.controlValue}>{width}px</span>
              </div>
              <input
                type="range"
                min={50}
                max={2000}
                step={10}
                value={width}
                onChange={(e) => onChangeWidth(parseInt(e.target.value))}
              />
            </div>

            {/* Glass Height */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Glass Height</span>
                <span className={styles.controlValue}>{height}px</span>
              </div>
              <input
                type="range"
                min={50}
                max={2000}
                step={10}
                value={height}
                onChange={(e) => onChangeHeight(parseInt(e.target.value))}
              />
            </div>

            {/* Translucency Opacity */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Translucency Opacity</span>
                <span className={styles.controlValue}>{opacity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={opacity}
                onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
              />
            </div>

            {/* Frosted Blur */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Frosted Blur</span>
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

            {/* Position X */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Position X</span>
                <span className={styles.controlValue}>{posX.toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={posX}
                onChange={(e) => onChangePosX(parseFloat(e.target.value))}
              />
            </div>

            {/* Position Y */}
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlLabel}>Position Y</span>
                <span className={styles.controlValue}>{posY.toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={posY}
                onChange={(e) => onChangePosY(parseFloat(e.target.value))}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
