"use client";

import React, { useState } from "react";
import styles from "../../app/page.module.scss";

interface AccordionSectionProps {
  title: string;
  defaultOpen?: boolean;
  badge?: string | number;
  children: React.ReactNode;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  defaultOpen = true,
  badge,
  children
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        className={styles.sectionHeader}
        style={{
          cursor: "pointer",
          userSelect: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "9px",
              transition: "transform 0.2s ease",
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
              display: "inline-block"
            }}
          >
            ▶
          </span>
          <span>{title}</span>
        </span>
        {badge && (
          <span style={{ fontSize: "10px", opacity: 0.6 }}>{badge}</span>
        )}
      </div>

      {isOpen && (
        <div style={{ paddingTop: 4, paddingBottom: 4 }}>
          {children}
        </div>
      )}
    </div>
  );
};
