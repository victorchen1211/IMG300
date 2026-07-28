"use client";

import React from "react";
import styles from "./ToggleSwitch.module.scss";

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange }) => {
  return (
    <div className={styles.toggleRow} onClick={() => onChange(!checked)}>
      <span className={styles.label}>{label}</span>
      <div className={`${styles.track} ${checked ? styles.checked : ""}`}>
        <div className={styles.thumb} />
      </div>
    </div>
  );
};
