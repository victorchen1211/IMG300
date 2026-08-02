"use client";

import React, { useState } from "react";

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
  const [isHovered, setIsHovered] = useState<boolean>(false);

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Collapsible Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          cursor: "pointer",
          userSelect: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 12px",
          background: isHovered ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: "6px",
          transition: "all 0.18s ease"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              color: "#ffffff",
              transition: "transform 0.2s ease",
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
              display: "inline-block"
            }}
          >
            ▶
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              fontFamily: '"SF Mono", "Menlo", monospace',
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#ffffff"
            }}
          >
            {title}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {badge && (
            <span
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                background: "rgba(255, 255, 255, 0.15)",
                borderRadius: "4px",
                color: "#ddd"
              }}
            >
              {badge}
            </span>
          )}
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: isOpen ? "#00e5ff" : "#888888",
              fontFamily: '"SF Mono", monospace',
              textTransform: "uppercase",
              letterSpacing: "0.04em"
            }}
          >
            {isOpen ? "Collapse ▲" : "Expand ▼"}
          </span>
        </div>
      </div>

      {/* Collapsible Content Area */}
      {isOpen && (
        <div style={{ paddingTop: 8, paddingBottom: 4 }}>
          {children}
        </div>
      )}
    </div>
  );
};
