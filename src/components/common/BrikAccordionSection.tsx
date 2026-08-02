"use client";

import React, { useState } from "react";

interface BrikAccordionSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const BrikAccordionSection: React.FC<BrikAccordionSectionProps> = ({
  title,
  defaultOpen = true,
  children
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Accordion Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "10px",
          marginBottom: isOpen ? "12px" : "0px",
          borderBottom: "1px solid #eeeeee",
          cursor: "pointer",
          userSelect: "none"
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#000000",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          {title}
        </span>

        {/* Chevron Arrow Icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: "transform 0.2s ease",
            transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)"
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Accordion Children */}
      {isOpen && (
        <div style={{ paddingTop: "2px", paddingBottom: "4px" }}>
          {children}
        </div>
      )}
    </div>
  );
};
