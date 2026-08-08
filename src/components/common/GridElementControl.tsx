"use client";

import React, { useState } from "react";
import styles from "../../app/page.module.scss";
import { BrikAccordionSection } from "./BrikAccordionSection";
import { BrikSliderControl } from "./BrikSliderControl";
import { PairwisePreferenceStudio } from "./PairwisePreferenceStudio";
import {
  GridElement,
  ElementType,
  TextGridElement,
  ImageGridElement,
  TextAlignMode,
  ImageFitMode,
  VisualPriority,
  HierarchyContrast,
  getHierarchyValue,
  inferVisualPriority,
  GridElementWithStep4,
  CompositionResult,
  LayoutParameters,
  BaselineGridParameters,
  TextFitResult,
  ImageFitResult,
  CrossModalHierarchyResult,
  ImageTextBoundaryMetrics
} from "../../hooks/useGridElements";

interface GridElementControlProps {
  elements: GridElementWithStep4[];
  parameters: LayoutParameters;
  baselineParams?: BaselineGridParameters;
  compositionSolution: CompositionResult | null;
  topSolutions?: CompositionResult[];
  selectedSolutionIndex?: number;
  textFitResults?: TextFitResult[];
  imageFitResults?: ImageFitResult[];
  crossModalHierarchyResult?: CrossModalHierarchyResult;
  imageTextBoundaryMetrics?: ImageTextBoundaryMetrics[];
  typographicHierarchyInfo?: {
    consistencyScore: number;
    inversions: Array<{ elemId1: string; elemId2: string; h1: number; h2: number; v1: number; v2: number }>;
  };
  onSelectSolutionIndex?: (idx: number) => void;
  totalWeight: number;
  availableArea: number;
  gridColumns?: number;
  gridRows?: number;
  onUpdateParameters: (updates: Partial<LayoutParameters>) => void;
  onUpdateBaselineParams?: (updates: Partial<BaselineGridParameters>) => void;
  hierarchyContrast?: HierarchyContrast;
  onApplyHierarchyContrast?: (contrast: HierarchyContrast) => void;
  onAddElement: (type: ElementType) => void;
  onUpdateElement: (id: string, updates: Partial<GridElement>) => void;
  onRemoveElement: (id: string) => void;
}

const PRIORITY_OPTIONS: Array<{
  value: VisualPriority;
  label: string;
  description: string;
}> = [
  { value: "primary", label: "Primary", description: "Seen first" },
  { value: "secondary", label: "Secondary", description: "Seen next" },
  { value: "supporting", label: "Supporting", description: "Extra detail" }
];

const CONTRAST_OPTIONS: Array<{
  value: HierarchyContrast;
  label: string;
  description: string;
}> = [
  { value: "gentle", label: "Gentle", description: "More equal" },
  { value: "balanced", label: "Balanced", description: "Clear hierarchy" },
  { value: "bold", label: "Bold", description: "Strong contrast" }
];

export const GridElementControl: React.FC<GridElementControlProps> = ({
  elements,
  parameters,
  baselineParams = { baselineUnit: 8, baselineOrigin: 40 },
  compositionSolution,
  topSolutions = [],
  selectedSolutionIndex = 0,
  textFitResults = [],
  imageFitResults = [],
  crossModalHierarchyResult = { sCross: 1.0, tvDistance: 0, elementDistributions: [] },
  imageTextBoundaryMetrics = [],
  typographicHierarchyInfo = { consistencyScore: 1.0, inversions: [] },
  onSelectSolutionIndex,
  totalWeight,
  availableArea,
  gridColumns = 4,
  gridRows = 4,
  onUpdateParameters,
  onUpdateBaselineParams,
  hierarchyContrast = "balanced",
  onApplyHierarchyContrast,
  onAddElement,
  onUpdateElement,
  onRemoveElement
}) => {
  const [showDebugControls, setShowDebugControls] = useState<boolean>(false);

  const elementCount = elements.length;

  const fitResultMap = new Map<string, TextFitResult>();
  textFitResults.forEach((res) => fitResultMap.set(res.elementId, res));

  const imageFitMap = new Map<string, ImageFitResult>();
  imageFitResults.forEach((res) => imageFitMap.set(res.elementId, res));

  const handlePriorityChange = (item: GridElement, priority: VisualPriority) => {
    onUpdateElement(item.id, {
      visualPriority: priority,
      hierarchy: getHierarchyValue(priority, hierarchyContrast)
    });
  };

  return (
    <BrikAccordionSection title={`Alpha Studio: Poster Elements (${elementCount})`} defaultOpen={true}>
      <div style={{ marginBottom: 14 }}>
        {/* Action Buttons: Add Text / Add Image */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            style={{
              flex: 1,
              height: "38px",
              padding: "6px 10px",
              fontSize: "12px",
              fontWeight: 800,
              fontFamily: 'Inter, sans-serif',
              background: "#000000",
              color: "#ffffff",
              border: "1px solid #000000",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            onClick={() => onAddElement("text")}
          >
            + Add Text Block
          </button>
          <button
            style={{
              flex: 1,
              height: "38px",
              padding: "6px 10px",
              fontSize: "12px",
              fontWeight: 800,
              fontFamily: 'Inter, sans-serif',
              background: "#000000",
              color: "#ffffff",
              border: "1px solid #000000",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            onClick={() => onAddElement("image")}
          >
            + Add Image Block
          </button>
        </div>

        <div
          style={{
            marginBottom: 12,
            padding: 10,
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: 8
          }}
        >
          <div
            style={{
              marginBottom: 3,
              color: "#334155",
              fontSize: 10,
              fontWeight: 900,
              fontFamily: '"SF Mono", "Menlo", monospace',
              textTransform: "uppercase",
              letterSpacing: "0.06em"
            }}
          >
            Hierarchy Contrast
          </div>
          <div style={{ marginBottom: 8, color: "#64748b", fontSize: 10, lineHeight: 1.35 }}>
            Choose how strongly Primary elements should stand out.
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {CONTRAST_OPTIONS.map((option) => {
              const isActive = hierarchyContrast === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.description}
                  onClick={() => onApplyHierarchyContrast?.(option.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "7px 4px",
                    borderRadius: 5,
                    border: isActive ? "2px solid #0f172a" : "1px solid #cbd5e1",
                    background: isActive ? "#0f172a" : "#ffffff",
                    color: isActive ? "#ffffff" : "#475569",
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: 800
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Top-K Ranked Compositions Selector Card */}
        {topSolutions.length > 0 && (
          <div
            style={{
              background: "#faf5ff",
              padding: "12px",
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
                marginBottom: 8
              }}
            >
              Top-{topSolutions.length} Generated Compositions (Select Rank)
            </div>

            {compositionSolution?.searchTruncated && (
              <div
                style={{
                  marginBottom: 8,
                  padding: "6px 8px",
                  borderRadius: 5,
                  background: "#fff7ed",
                  border: "1px solid #fdba74",
                  color: "#9a3412",
                  fontSize: "9px",
                  fontWeight: 800,
                  fontFamily: '"SF Mono", "Menlo", monospace'
                }}
              >
                Search safety limit reached. Rankings use the best evaluated compositions.
              </div>
            )}

            {/* Solution Rank Tabs */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
              {topSolutions.map((sol, idx) => {
                const isSelected = idx === selectedSolutionIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectSolutionIndex && onSelectSolutionIndex(idx)}
                    style={{
                      flex: 1,
                      minWidth: "60px",
                      padding: "8px 6px",
                      fontSize: "11px",
                      fontWeight: 800,
                      fontFamily: '"SF Mono", "Menlo", monospace',
                      background: isSelected ? "#7e22ce" : "#ffffff",
                      color: isSelected ? "#ffffff" : "#6b21a8",
                      border: isSelected ? "2px solid #6b21a8" : "1.5px solid #e9d5ff",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      textAlign: "center"
                    }}
                  >
                    #{idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Primary Alpha Elements Control List */}
        {elements.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px 8px",
              fontSize: "12px",
              color: "#94a3b8",
              border: "1px dashed #cbd5e1",
              borderRadius: "8px"
            }}
          >
            No elements added yet. Click "+ Add Text Block" or "+ Add Image Block" above.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
            {elements.map((item, idx) => {
              const textElem = item.type === "text" ? (item as TextGridElement) : null;
              const imgElem = item.type === "image" ? (item as ImageGridElement) : null;
              const solutionPlacement = compositionSolution?.placements.find((p) => p.elementId === item.id);

              return (
                <div
                  key={item.id}
                  style={{
                    background: "#ffffff",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1.5px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                  }}
                >
                  {/* Header: Badge, Name, Remove */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 900,
                          fontFamily: '"SF Mono", "Menlo", monospace',
                          padding: "2px 6px",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                          background: item.type === "text" ? "#e0f2fe" : "#fef3c7",
                          color: item.type === "text" ? "#0369a1" : "#b45309",
                          border: item.type === "text" ? "1px solid #bae6fd" : "1px solid #fde68a"
                        }}
                      >
                        {item.type} (E_{idx + 1})
                      </span>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => onUpdateElement(item.id, { name: e.target.value })}
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#0f172a",
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          width: "120px"
                        }}
                      />
                    </div>

                    <button
                      onClick={() => onRemoveElement(item.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#ef4444",
                        fontSize: "14px",
                        fontWeight: 800,
                        cursor: "pointer",
                        padding: "2px 4px"
                      }}
                      title="Remove element"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Text Content Input Field */}
                  {textElem && (
                    <div style={{ marginBottom: 10 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "10px",
                          fontWeight: 800,
                          fontFamily: '"SF Mono", "Menlo", monospace',
                          color: "#0369a1",
                          textTransform: "uppercase",
                          marginBottom: 4
                        }}
                      >
                        Text Content:
                      </label>
                      <textarea
                        value={textElem.content || ""}
                        onChange={(e) => onUpdateElement(item.id, { content: e.target.value })}
                        rows={2}
                        placeholder="Enter text..."
                        style={{
                          width: "100%",
                          fontSize: "12px",
                          fontFamily: 'Inter, sans-serif',
                          padding: "6px 8px",
                          border: "1px solid #bae6fd",
                          borderRadius: "6px",
                          background: "#f0f9ff",
                          color: "#0c4a6e",
                          outline: "none",
                          resize: "vertical"
                        }}
                      />
                    </div>
                  )}

                  {/* Image Identifier / Label */}
                  {imgElem && (
                    <div style={{ marginBottom: 10, fontSize: "11px", color: "#b45309", fontFamily: '"SF Mono", "Menlo", monospace' }}>
                      Image Asset: <strong>{imgElem.name}</strong> ({imgElem.sourceWidth || 1200}×{imgElem.sourceHeight || 800}px)
                    </div>
                  )}

                  <div style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        marginBottom: 5,
                        color: "#475569",
                        fontSize: 9,
                        fontWeight: 900,
                        fontFamily: '"SF Mono", "Menlo", monospace',
                        textTransform: "uppercase"
                      }}
                    >
                      Visual Priority
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {PRIORITY_OPTIONS.map((option) => {
                        const priority = item.visualPriority || inferVisualPriority(item.hierarchy);
                        const isActive = priority === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            title={option.description}
                            onClick={() => handlePriorityChange(item, option.value)}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              padding: "6px 2px",
                              borderRadius: 4,
                              border: isActive ? "2px solid #2563eb" : "1px solid #bfdbfe",
                              background: isActive ? "#dbeafe" : "#ffffff",
                              color: isActive ? "#1d4ed8" : "#64748b",
                              cursor: "pointer",
                              fontSize: 9,
                              fontWeight: 800
                            }}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Placement Location Badge */}
                  <div
                    style={{
                      background: solutionPlacement ? "#f0fdf4" : "#f8fafc",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontFamily: '"SF Mono", "Menlo", monospace',
                      border: solutionPlacement ? "1px solid #bbf7d0" : "1px solid #e2e8f0"
                    }}
                  >
                    {solutionPlacement ? (
                      <div style={{ color: "#15803d", fontWeight: 800 }}>
                        Assigned Grid Position: Col {solutionPlacement.column}, Row {solutionPlacement.row} ({solutionPlacement.columnSpan}×{solutionPlacement.rowSpan})
                      </div>
                    ) : (
                      <div style={{ color: "#94a3b8" }}>Unplaced</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Secondary Debug & Advanced Research Panel Toggle */}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setShowDebugControls(!showDebugControls)}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "11px",
              fontWeight: 800,
              fontFamily: '"SF Mono", "Menlo", monospace',
              background: "#f1f5f9",
              color: "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>{showDebugControls ? "▲ Hide Advanced Debug Controls" : "▼ Show Advanced Debug Controls"}</span>
            <span style={{ fontSize: "9px", color: "#64748b" }}>Typography, Image Fit & Metrics</span>
          </button>

          {showDebugControls && (
            <div style={{ marginTop: 12 }}>
              {/* Detailed Element Styling & Debug Controls */}
              {elements.map((item, idx) => {
                const textElem = item.type === "text" ? (item as TextGridElement) : null;
                const imgElem = item.type === "image" ? (item as ImageGridElement) : null;
                const targetRatio = item.targetAspectRatio || (item.type === "text" ? 2.0 : 1.0);

                return (
                  <div key={item.id} style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", marginBottom: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, color: "#475569", marginBottom: 6 }}>
                      Advanced Debug: {item.name} ({item.type})
                    </div>

                    <BrikSliderControl
                      label="Raw Hierarchy Weight (h)"
                      value={item.hierarchy}
                      min={0}
                      max={100}
                      step={1}
                      valueDisplay={`h = ${item.hierarchy}`}
                      onChange={(val) => onUpdateElement(item.id, {
                        hierarchy: val,
                        visualPriority: inferVisualPriority(val)
                      })}
                      deferChange={true}
                      marginBottom={6}
                    />

                    {textElem && (
                      <>
                        <div style={{ marginBottom: 6 }}>
                          <label style={{ fontSize: "9px", fontWeight: 800, color: "#0284c7" }}>Text Alignment:</label>
                          <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                            {(["left", "center", "right", "justify"] as TextAlignMode[]).map((mode) => (
                              <button
                                key={mode}
                                onClick={() => onUpdateElement(item.id, { textAlign: mode })}
                                style={{
                                  flex: 1,
                                  padding: "2px",
                                  fontSize: "9px",
                                  fontWeight: 800,
                                  background: (textElem.textAlign || "left") === mode ? "#0284c7" : "#ffffff",
                                  color: (textElem.textAlign || "left") === mode ? "#ffffff" : "#0369a1",
                                  border: "1px solid #bae6fd",
                                  borderRadius: "3px"
                                }}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>

                        <BrikSliderControl
                          label="Text Size"
                          value={Math.round((textElem.fontScale ?? 1) * 100)}
                          min={25}
                          max={100}
                          step={5}
                          valueDisplay={`${Math.round((textElem.fontScale ?? 1) * 100)}% · ${fitResultMap.get(item.id)?.fontSize ?? "—"}px`}
                          onChange={(val) => onUpdateElement(item.id, { fontScale: val / 100 })}
                          marginBottom={6}
                        />

                        <BrikSliderControl
                          label="Font Weight"
                          value={textElem.fontWeight || 500}
                          min={100}
                          max={900}
                          step={100}
                          valueDisplay={`fw = ${textElem.fontWeight || 500}`}
                          onChange={(val) => onUpdateElement(item.id, { fontWeight: val })}
                          marginBottom={6}
                        />
                      </>
                    )}

                    {imgElem && (
                      <div style={{ marginBottom: 6 }}>
                        <label style={{ fontSize: "9px", fontWeight: 800, color: "#b45309" }}>Fit Mode:</label>
                        <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                          {(["cover", "contain"] as ImageFitMode[]).map((fit) => (
                            <button
                              key={fit}
                              onClick={() => onUpdateElement(item.id, { imageFit: fit })}
                              style={{
                                flex: 1,
                                padding: "2px",
                                fontSize: "9px",
                                fontWeight: 800,
                                background: (imgElem.imageFit || "cover") === fit ? "#d97706" : "#ffffff",
                                color: (imgElem.imageFit || "cover") === fit ? "#ffffff" : "#b45309",
                                border: "1px solid #fde68a",
                                borderRadius: "3px"
                              }}
                            >
                              {fit}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <BrikSliderControl
                      label="Target Aspect Ratio (r)"
                      value={targetRatio}
                      min={0.25}
                      max={4.0}
                      step={0.05}
                      valueDisplay={`r = ${targetRatio.toFixed(2)}`}
                      onChange={(val) => onUpdateElement(item.id, { targetAspectRatio: val })}
                      deferChange={true}
                      marginBottom={0}
                    />
                  </div>
                );
              })}

              {/* Step 11.3: Pairwise Preference Collector Component */}
              <PairwisePreferenceStudio />
            </div>
          )}
        </div>
      </div>
    </BrikAccordionSection>
  );
};
