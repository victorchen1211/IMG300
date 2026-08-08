"use client";

import React from "react";
import { usePairwisePreferenceCollector } from "../../hooks/usePairwisePreferenceCollector";
import { BrikAccordionSection } from "./BrikAccordionSection";

interface PairwisePreferenceStudioProps {
  onClose?: () => void;
}

export const PairwisePreferenceStudio: React.FC<PairwisePreferenceStudioProps> = () => {
  const {
    currentPair,
    preferences,
    totalPreferenceCount,
    isLoading,
    generateNewBatch,
    nextPair,
    recordPreference,
    exportPreferencesJSON
  } = usePairwisePreferenceCollector({ batchSize: 30, topKPerScenario: 3 });

  if (isLoading || !currentPair) {
    return (
      <BrikAccordionSection title="Step 11.3: Pairwise Preference Collector (P)" defaultOpen={false}>
        <div style={{ padding: "16px", textAlign: "center", fontSize: "12px", color: "#64748b" }}>
          Generating layout candidate dataset pairs...
        </div>
      </BrikAccordionSection>
    );
  }

  const { compA, compB } = currentPair;

  return (
    <BrikAccordionSection title={`Step 11.3: Pairwise Preference Collector (Collected: ${totalPreferenceCount})`} defaultOpen={false}>
      <div style={{ marginBottom: 14 }}>
        {/* Header Description Card */}
        <div
          style={{
            background: "#faf5ff",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1.5px solid #d8b4fe",
            marginBottom: 12
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 900,
              fontFamily: '"SF Mono", "Menlo", monospace',
              color: "#7e22ce",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 4
            }}
          >
            Phase III — Design Preference Pairwise Collector
          </div>
          <div style={{ fontSize: "11px", color: "#6b21a8", lineHeight: "1.4" }}>
            Compare Option A vs Option B below and select which composition has superior structural clarity and aesthetic order. Your choices accumulate into preference dataset 𝒫 = &#123;(C_i, C_j, y_ij)&#125;.
          </div>
        </div>

        {/* Pairwise Comparison Action Cards A vs B */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          {/* Option A Card */}
          <div
            style={{
              flex: 1,
              background: "#f0f9ff",
              padding: "10px",
              borderRadius: "8px",
              border: "1.5px solid #0284c7"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: "12px", fontWeight: 900, color: "#0369a1", fontFamily: '"SF Mono", "Menlo", monospace' }}>
                OPTION A
              </span>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#0284c7", fontFamily: '"SF Mono", "Menlo", monospace' }}>
                S_global = {compA.globalScore.toFixed(3)}
              </span>
            </div>

            <div style={{ fontSize: "10px", fontFamily: '"SF Mono", "Menlo", monospace', color: "#0c4a6e", marginBottom: 8 }}>
              {compA.scenarioName} ({compA.elementCount} elements)
            </div>

            <button
              onClick={() => recordPreference("A")}
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "11px",
                fontWeight: 900,
                fontFamily: '"SF Mono", "Menlo", monospace',
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Select Option A 👈
            </button>
          </div>

          {/* Option B Card */}
          <div
            style={{
              flex: 1,
              background: "#fffbe6",
              padding: "10px",
              borderRadius: "8px",
              border: "1.5px solid #d97706"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: "12px", fontWeight: 900, color: "#b45309", fontFamily: '"SF Mono", "Menlo", monospace' }}>
                OPTION B
              </span>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#d97706", fontFamily: '"SF Mono", "Menlo", monospace' }}>
                S_global = {compB.globalScore.toFixed(3)}
              </span>
            </div>

            <div style={{ fontSize: "10px", fontFamily: '"SF Mono", "Menlo", monospace', color: "#78350f", marginBottom: 8 }}>
              {compB.scenarioName} ({compB.elementCount} elements)
            </div>

            <button
              onClick={() => recordPreference("B")}
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "11px",
                fontWeight: 900,
                fontFamily: '"SF Mono", "Menlo", monospace',
                background: "#d97706",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Select Option B 👉
            </button>
          </div>
        </div>

        {/* Tie & Skip Action Controls */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => recordPreference("tie")}
            style={{
              flex: 1,
              padding: "6px",
              fontSize: "10px",
              fontWeight: 800,
              fontFamily: '"SF Mono", "Menlo", monospace',
              background: "#f1f5f9",
              color: "#334155",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            🤝 Mark Tie (Equal Quality)
          </button>
          <button
            onClick={nextPair}
            style={{
              flex: 1,
              padding: "6px",
              fontSize: "10px",
              fontWeight: 800,
              fontFamily: '"SF Mono", "Menlo", monospace',
              background: "#f1f5f9",
              color: "#334155",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            ⏭ Skip to Next Pair
          </button>
        </div>

        {/* Feature Vectors (x_C) Comparison Table */}
        <div style={{ overflowX: "auto", marginBottom: 12 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "9px",
              fontFamily: '"SF Mono", "Menlo", monospace',
              background: "#ffffff",
              border: "1px solid #e2e8f0"
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc", color: "#475569" }}>
                <th style={{ padding: "4px", textAlign: "left" }}>Feature Vector x_C</th>
                <th style={{ padding: "4px", color: "#0369a1" }}>Option A</th>
                <th style={{ padding: "4px", color: "#b45309" }}>Option B</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "4px", fontWeight: 700 }}>Axis Strength (S_axis)</td>
                <td style={{ padding: "4px", textAlign: "center" }}>{compA.axisStrength.toFixed(3)}</td>
                <td style={{ padding: "4px", textAlign: "center" }}>{compB.axisStrength.toFixed(3)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "4px", fontWeight: 700 }}>Cross-Modal Consistency (S_cross)</td>
                <td style={{ padding: "4px", textAlign: "center" }}>{compA.crossModalConsistency.toFixed(3)}</td>
                <td style={{ padding: "4px", textAlign: "center" }}>{compB.crossModalConsistency.toFixed(3)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "4px", fontWeight: 700 }}>Shared Spine L_shared</td>
                <td style={{ padding: "4px", textAlign: "center" }}>{compA.sharedBoundaryLengthPx}px</td>
                <td style={{ padding: "4px", textAlign: "center" }}>{compB.sharedBoundaryLengthPx}px</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "4px", fontWeight: 700 }}>Whitespace Topology (S_LEC)</td>
                <td style={{ padding: "4px", textAlign: "center" }}>{compA.whitespaceConnectivity.toFixed(3)}</td>
                <td style={{ padding: "4px", textAlign: "center" }}>{compB.whitespaceConnectivity.toFixed(3)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "4px", fontWeight: 700 }}>Group Proximity (S_P)</td>
                <td style={{ padding: "4px", textAlign: "center" }}>{compA.proximityScore.toFixed(3)}</td>
                <td style={{ padding: "4px", textAlign: "center" }}>{compB.proximityScore.toFixed(3)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Dataset Summary & Export Card */}
        <div
          style={{
            background: "#f8fafc",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span style={{ fontSize: "10px", fontWeight: 800, fontFamily: '"SF Mono", "Menlo", monospace', color: "#475569" }}>
            Total Pairs Collected: <strong>{totalPreferenceCount}</strong>
          </span>
          <button
            onClick={exportPreferencesJSON}
            disabled={totalPreferenceCount === 0}
            style={{
              padding: "4px 10px",
              fontSize: "10px",
              fontWeight: 800,
              fontFamily: '"SF Mono", "Menlo", monospace',
              background: totalPreferenceCount > 0 ? "#7e22ce" : "#cbd5e1",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              cursor: totalPreferenceCount > 0 ? "pointer" : "not-allowed"
            }}
          >
            📥 Export Dataset JSON
          </button>
        </div>
      </div>
    </BrikAccordionSection>
  );
};
