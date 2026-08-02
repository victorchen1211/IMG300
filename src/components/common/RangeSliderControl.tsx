"use client";

import React from "react";
import styles from "../../app/page.module.scss";

interface RangeSliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  valueDisplay?: string | number;
  onChange: (value: number) => void;
  marginBottom?: number;
}

export const RangeSliderControl: React.FC<RangeSliderControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  valueDisplay,
  onChange,
  marginBottom = 16
}) => {
  return (
    <div className={styles.controlGroup} style={{ marginBottom }}>
      <div className={styles.controlHeader}>
        <span className={styles.controlLabel}>{label}</span>
        <span className={styles.controlValue}>{valueDisplay ?? value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
};
