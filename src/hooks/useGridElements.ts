"use client";

import { useState, useCallback, useMemo } from "react";

export type ElementType = "text" | "image";
export type TextAlignMode = "left" | "center" | "right" | "justify";
export type ImageFitMode = "cover" | "contain";
export type VisualPriority = "primary" | "secondary" | "supporting";
export type HierarchyContrast = "gentle" | "balanced" | "bold";

export const HIERARCHY_PRESETS: Record<
  HierarchyContrast,
  Record<VisualPriority, number>
> = {
  gentle: { primary: 100, secondary: 90, supporting: 75 },
  balanced: { primary: 100, secondary: 75, supporting: 50 },
  bold: { primary: 100, secondary: 60, supporting: 30 }
};

export function getHierarchyValue(
  priority: VisualPriority,
  contrast: HierarchyContrast
): number {
  return HIERARCHY_PRESETS[contrast][priority];
}

export function inferVisualPriority(hierarchy: number): VisualPriority {
  if (hierarchy >= 85) return "primary";
  if (hierarchy >= 60) return "secondary";
  return "supporting";
}

export interface BaseGridElement {
  id: string;
  type: ElementType;
  name: string;
  hierarchy: number;           // Importance / weight (0 -> 100)
  visualPriority?: VisualPriority; // Plain-language control mapped to hierarchy
  targetAspectRatio?: number;  // User-defined aspect ratio r_i = w_i / h_i
  groupId?: string;            // Group identifier for Proximity (e.g. "group-1")
}

export interface TextGridElement extends BaseGridElement {
  type: "text";
  content: string;
  fontFamily?: string;
  fontWeight?: number;       // Font Weight (100 - 900, default 700)
  fontScale?: number;        // 0.25 - 1.0 multiplier applied to auto-fit size
  lineHeightRatio?: number;  // k_i (default 1.20)
  trackingEm?: number;       // τ_i in em (default 0.00em)
  textAlign?: TextAlignMode; // Alignment Mode (default "left")
}

export interface ImageGridElement extends BaseGridElement {
  type: "image";
  imageUrl?: string;
  sourceWidth?: number;      // W_i^src (px, default 1200)
  sourceHeight?: number;     // H_i^src (px, default 800)
  imageFit?: ImageFitMode;   // "cover" | "contain" (default "cover")
  focalPointX?: number;      // f_x ∈ [0, 1] (default 0.5)
  focalPointY?: number;      // f_y ∈ [0, 1] (default 0.5)
}

export type GridElement = TextGridElement | ImageGridElement;

export interface LayoutParameters {
  hierarchyExponent: number; // α (Exponent for Hierarchy Curve, default 2)
  contentDensity: number;    // ρ (Proportion of Grid allocated to content, default 0.5)
  lambdaStep4Area: number;   // λ_Step4_Area (Weight for Step 4 Area Error Score, default 0.6)
  lambdaStep4Ratio: number;  // λ_Step4_Ratio (Weight for Step 4 Aspect Ratio Error Score, default 0.4)
  // Step 7.1 Global Score Component Weights (λ_S + λ_H + λ_A + λ_D + λ_P + λ_LEC + λ_Axis = 1.0)
  lambdaShape: number;       // λ_S (default 0.20)
  lambdaHierarchy: number;   // λ_H (default 0.15)
  lambdaAlignment: number;   // λ_A (default 0.15)
  lambdaDensity: number;     // λ_D (default 0.10)
  lambdaProximity: number;   // λ_P (default 0.15)
  lambdaLEC: number;         // λ_LEC (Largest Empty Component Weight, default 0.10)
  lambdaAxis: number;        // λ_Axis (Alignment Axis Strength Weight, default 0.15)
}

export interface IdealGeometry {
  idealArea: number;   // A_i
  idealWidth: number;  // w_i = √(A_i * r_i)
  idealHeight: number; // h_i = √(A_i / r_i)
}

export interface GeometryCandidate {
  columnSpan: number; // W ∈ [1, C]
  rowSpan: number;    // H ∈ [1, R]
  area: number;       // W * H
  aspectRatio: number;// Physical container width / height when grid metrics are available
  score: number;      // λ_A * S_A + λ_R * S_R
  targetRatioError?: number;
  imageVisibleRatio?: number;
}

export interface GridGeometry {
  column: number;     // x_i
  row: number;        // y_i
  columnSpan: number; // W_i
  rowSpan: number;    // H_i
}

export interface GridPlacement extends GridGeometry {
  elementId: string;
  candidateScore: number; // Step 4 Score(g_i) ∈ [0, 1]
}

export interface CompositionResult {
  placements: GridPlacement[];
  globalScore: number;     // S_global ∈ [0, 1]
  shapeScore: number;      // S_S ∈ [0, 1]
  hierarchyScore: number;  // S_H ∈ [0, 1]
  alignmentScore: number;  // S_A ∈ [0, 1]
  densityScore: number;    // S_D ∈ [0, 1]
  proximityScore: number;  // S_P ∈ (0, 1]
  lecScore: number;        // S_LEC ∈ (0, 1] (Largest Empty Component Ratio)
  axisScore: number;       // S_axis ∈ [0, 1] (Super-Linear Alignment Axis Strength)
  hasGroupProximity: boolean;
  nodesEvaluated: number;
  feasibleCompositions: number;
  prunedNodes: number;
  searchTruncated?: boolean;
  topSolutions?: CompositionResult[];
  topologySignature?: string;
  spatialSpread?: number;
}

// Keep the interactive solver responsive. The architecture still exhaustively
// searches every placement produced from this shortlisted geometry set.
const MAX_GEOMETRY_CANDIDATES_PER_ELEMENT = 3;
const BASE_SOLVER_NODE_BUDGET = 100_000;
const MAX_TARGET_ASPECT_ERROR = 0.55;
const MIN_IMAGE_VISIBLE_RATIO = 0.30;

// Step 8.1 Physical Text Container Metric Interfaces
export interface GridMetrics {
  canvasWidth: number;
  canvasHeight: number;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  // Backward-compatible aliases used by older dataset/debug consumers.
  marginX: number;
  marginY: number;
  columnGutter: number;
  rowGutter: number;
  columnWidth: number; // u_w = (C_w - 2m_x - (C-1)g_x) / C
  rowHeight: number;   // u_h = (C_h - 2m_y - (R-1)g_y) / R
}

export interface PhysicalGridParameters {
  canvasWidth: number;
  canvasHeight: number;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  columnGutter: number;
  rowGutter: number;
}

export interface GeometryCandidateOptions {
  gridMetrics?: GridMetrics;
  sourceAspectRatio?: number;
  imageFit?: ImageFitMode;
  minImageVisibleRatio?: number;
}

const DEFAULT_PHYSICAL_GRID: PhysicalGridParameters = {
  canvasWidth: 1200,
  canvasHeight: 1600,
  marginLeft: 40,
  marginRight: 40,
  marginTop: 40,
  marginBottom: 40,
  columnGutter: 20,
  rowGutter: 20
};

export interface ElementContainerGeometry {
  elementId: string;
  containerWidth: number;  // B_i = W_i * u_w + (W_i - 1) * g_x (px)
  containerHeight: number; // D_i = H_i * u_h + (H_i - 1) * g_y (px)
  containerTopY: number;   // Y_i (px)
  containerLeftX: number;  // X_i (px)
}

// Step 8.4 Baseline Grid System Parameters Interface
export interface BaselineGridParameters {
  baselineUnit: number;   // b (px, default 8)
  baselineOrigin: number; // y_0 (px, default 40)
}

// Step 9.3 Paragraph & Rag Metrics Interfaces
export interface TextLineLayout {
  text: string;
  width: number;           // w_{i,l} (px)
  xOffset: number;         // x_{i,l} relative to container left
  normalizedWidth: number; // q_l = w_{i,l} / B_i
}

export interface RagMetrics {
  normalizedLineWidths: number[]; // [q_1, q_2, ..., q_L]
  averageLineJump: number;       // J = sum(|q_{l+1} - q_l|) / (L-1)
  shortLineCount: number;        // Number of lines with q_l < 0.35
  shortLinePenalty: number;      // P_short = sum(max(0, 0.35 - q_l)) / L
  staircaseTrend: "none" | "descending" | "ascending";
}

// Step 9.3 Alignment & Rag Analysis Fit Results Interface
export interface TextFitResult {
  elementId: string;
  fontSize: number;               // s_i* (px)
  lineHeightRatio: number;        // k_i
  trackingEm: number;             // τ_i (em)
  trackingPx: number;             // t_i = τ_i * s_i* (px)
  textAlign: TextAlignMode;       // "left" | "center" | "right" | "justify"
  lineHeight: number;             // ℓ_i^snap = n_i * b (px)
  snappedLineHeight: number;      // ℓ_i^snap = n_i * b (px)
  baselineMultiple: number;       // n_i
  ascent: number;                 // a_i (px)
  descent: number;                // d_i (px)
  firstBaseline: number;          // β_{i,0} (px)
  baselinePositions: number[];     // [β_{i,0}, β_{i,1}, ..., β_{i,L_i-1}] (px)
  containerWidth: number;         // B_i (px)
  containerHeight: number;        // D_i (px)
  containerTopY: number;          // Y_i (px)
  measuredWidth: number;          // W_text (px)
  measuredHeight: number;         // H_text_extent = a_i + d_i + (L_i - 1)*ℓ_i^snap (px)
  lineCount: number;              // L_i
  fits: boolean;
  fontWeight: number;             // fw_i (100 - 900)
  normalizedFontWeight: number;   // f_i = (fontWeight - 100) / 800 ∈ [0, 1]
  typographicVisualWeight: number;// V_i^type = s_i^alpha * (1 + gamma * f_i) (Dominance Proxy)
  linesInfo: TextLineLayout[];
  ragMetrics: RagMetrics;
}

// Step 10.1 & 10.2 Image Fit & Crop Geometry Results Interface
export interface ImageFitResult {
  elementId: string;
  sourceWidth: number;           // W_i^src
  sourceHeight: number;          // H_i^src
  sourceAspectRatio: number;     // r_i^src = W^src / H^src
  containerWidth: number;        // B_i
  containerHeight: number;       // D_i
  containerAspectRatio: number;  // r_i^container = B_i / D_i
  imageFit: ImageFitMode;
  scale: number;                 // s_cover or s_contain
  renderedWidth: number;         // W_i^render = scale * W^src
  renderedHeight: number;        // H_i^render = scale * H^src
  cropOffsetX: number;           // o_x (px)
  cropOffsetY: number;           // o_y (px)
  focalPointX: number;           // f_x
  focalPointY: number;           // f_y
  visibleWidth: number;          // min(B, W^render)
  visibleHeight: number;         // min(D, H^render)
  visibleArea: number;           // A_visible = min(B, W^render) * min(D, H^render)
  visibleRatio: number;          // q_i^visible = A_visible / A_render
  cropRatio: number;             // q_i^crop = 1 - q_i^visible
  canvasCoverageRatio: number;   // q_i^canvas = A_visible / A_canvas
  geometricDominance: number;    // V_i^geo = A_visible (px^2)
}

// Step 10.3 Cross-Modal Dominance Consistency Interface
export interface CrossModalHierarchyResult {
  sCross: number;                // S_cross = 1 - D_TV ∈ [0, 1]
  tvDistance: number;            // D_TV = 0.5 * sum(|q_cross - q_hierarchy|)
  elementDistributions: Array<{
    elementId: string;
    name: string;
    type: ElementType;
    d_i: number;                 // Raw dominance proxy
    q_cross: number;             // Normalized cross-modal dominance ratio
    q_hierarchy: number;         // Normalized intended hierarchy ratio
  }>;
}

// Step 10.4 Image-Text Boundary Geometry Metrics Interface (Two-level: Module & Physical Gutter)
export interface ImageTextBoundaryMetrics {
  imageId: string;
  imageName: string;
  textId: string;
  textName: string;

  // Grid-level Module Measurements (d_x^module, d_y^module, d_IT^module)
  horizontalModuleGap: number;     // d_x^module (unoccupied modules)
  verticalModuleGap: number;       // d_y^module (unoccupied modules)
  gridModuleDistance: number;      // d_IT^module = d_x + d_y (unoccupied modules)

  // Physical-level Pixel & Gutter Measurements (G_x^px, G_y^px, m_x^gutter, m_y^gutter)
  horizontalPixelGap: number;      // G_x^px (pixels)
  verticalPixelGap: number;        // G_y^px (pixels)
  physicalPixelDistance: number;   // G_x^px + G_y^px (pixels)
  horizontalGutterUnits: number;   // m_x^gutter = G_x^px / g_x
  verticalGutterUnits: number;     // m_y^gutter = G_y^px / g_y

  // Shared Boundary Measurements (L_shared = L_v + L_h)
  sharedBoundaryLengthPx: number;  // L_shared in pixels
  sharedBoundaryModules: number;   // L_shared in grid module units

  // Axis Coincidence
  sharesLeftAxis: boolean;         // x_I = x_T
  sharesRightAxis: boolean;        // x_I + W_I = x_T + W_T
  sharesTopAxis: boolean;          // y_I = y_T
  sharesBottomAxis: boolean;       // y_I + H_I = y_T + H_T

  opposingVerticalAxis: boolean;   // x_I + W_I = x_T or x_T + W_T = x_I
  opposingHorizontalAxis: boolean; // y_I + H_I = y_T or y_T + H_T = y_I
}

export function calculateVisualWeight(
  hierarchy: number,
  parameters: LayoutParameters
): number {
  const normalizedHierarchy = hierarchy / 100;
  return Math.pow(normalizedHierarchy, parameters.hierarchyExponent);
}

export type GridElementWithWeight = GridElement & {
  normalizedHierarchy: number; // ĥ_i = h_i / 100
  visualWeight: number;        // w_i = ĥ_i^α
};

export type GridElementWithAllocation = GridElementWithWeight & {
  allocationRatio: number; // r_i = w_i / W
  idealArea: number;       // A_i = r_i * A_available
};

export type GridElementWithStep4 = GridElementWithAllocation & {
  idealGeometry: IdealGeometry;
  candidates: GeometryCandidate[];
};

// Step 3 Function 1 — Total Weight W = sum(w_i)
export function calculateTotalWeight(
  elements: GridElementWithWeight[]
): number {
  return elements.reduce((sum, element) => sum + element.visualWeight, 0);
}

// Step 3 Function 2 — Available Area A_available = rho * C * R
export function calculateAvailableArea(
  gridColumns: number,
  gridRows: number,
  contentDensity: number
): number {
  const totalGridArea = gridColumns * gridRows;
  return totalGridArea * contentDensity;
}

// Step 3 Function 3 — Allocation Ratio r_i = w_i / W
export function calculateAllocationRatio(
  visualWeight: number,
  totalWeight: number
): number {
  if (totalWeight <= 0) return 0;
  return visualWeight / totalWeight;
}

// Step 3 Function 4 — Ideal Area A_i = r_i * A_available
export function calculateIdealArea(
  allocationRatio: number,
  availableArea: number
): number {
  return allocationRatio * availableArea;
}

// Step 4 Function 1 — Continuous Ideal Geometry (w_i = √(A_i * r_i), h_i = √(A_i / r_i))
export function calculateIdealGeometry(
  idealArea: number,
  targetAspectRatio: number
): IdealGeometry {
  const safeRatio = Math.max(0.01, targetAspectRatio);
  const safeArea = Math.max(0.001, idealArea);
  const idealWidth = Math.sqrt(safeArea * safeRatio);
  const idealHeight = Math.sqrt(safeArea / safeRatio);
  return {
    idealArea: safeArea,
    idealWidth,
    idealHeight
  };
}

// Step 4 Function 2 — Generate & Score Discrete Candidates (G_i)
export function generateGeometryCandidates(
  idealArea: number,
  targetAspectRatio: number,
  gridColumns: number,
  gridRows: number,
  parameters: LayoutParameters,
  options: GeometryCandidateOptions = {}
): GeometryCandidate[] {
  const candidates: GeometryCandidate[] = [];
  const safeRatio = Math.max(0.01, targetAspectRatio);
  const safeArea = Math.max(0.001, idealArea);

  const { lambdaStep4Area, lambdaStep4Ratio } = parameters;

  // Score every C x R geometry, then keep the strongest shortlist. Passing all
  // geometries into the placement solver makes the search grow exponentially
  // and can block the browser as soon as a fourth element is added.
  for (let W = 1; W <= gridColumns; W++) {
    for (let H = 1; H <= gridRows; H++) {
      const area = W * H;
      const physicalWidth = options.gridMetrics
        ? W * options.gridMetrics.columnWidth + (W - 1) * options.gridMetrics.columnGutter
        : W;
      const physicalHeight = options.gridMetrics
        ? H * options.gridMetrics.rowHeight + (H - 1) * options.gridMetrics.rowGutter
        : H;
      const aspectRatio = physicalWidth / Math.max(1, physicalHeight);

      // Area Error Score: S_A = max(0, 1 - |W*H - A_i| / A_i)
      const sA = Math.max(0, 1 - Math.abs(area - safeArea) / safeArea);

      // Physical Aspect Ratio Error: S_R = max(0, 1 - |(B/D) - r_i| / r_i)
      const sR = Math.max(0, 1 - Math.abs(aspectRatio - safeRatio) / safeRatio);

      // Total Score = λ_Step4_Area * S_A + λ_Step4_Ratio * S_R
      const sourceRatio = options.sourceAspectRatio && options.sourceAspectRatio > 0
        ? options.sourceAspectRatio
        : undefined;
      const imageVisibleRatio = sourceRatio && options.imageFit === "cover"
        ? Math.min(aspectRatio / sourceRatio, sourceRatio / aspectRatio, 1)
        : 1;
      const score = lambdaStep4Area * sA + lambdaStep4Ratio * sR;

      candidates.push({
        columnSpan: W,
        rowSpan: H,
        area,
        aspectRatio,
        score,
        targetRatioError: Math.abs(aspectRatio - safeRatio) / safeRatio,
        imageVisibleRatio
      });
    }
  }

  const ranked = candidates.sort((a, b) => b.score - a.score);
  const minImageVisibleRatio = options.minImageVisibleRatio ?? MIN_IMAGE_VISIBLE_RATIO;
  const preferred = ranked.filter((candidate) =>
    (candidate.targetRatioError ?? Infinity) <= MAX_TARGET_ASPECT_ERROR &&
    (candidate.imageVisibleRatio ?? 1) >= minImageVisibleRatio
  );
  const fallbackRanked = [...ranked].sort((a, b) => {
    const aViolation =
      Math.max(0, (a.targetRatioError ?? Infinity) - MAX_TARGET_ASPECT_ERROR) +
      Math.max(0, minImageVisibleRatio - (a.imageVisibleRatio ?? 1));
    const bViolation =
      Math.max(0, (b.targetRatioError ?? Infinity) - MAX_TARGET_ASPECT_ERROR) +
      Math.max(0, minImageVisibleRatio - (b.imageVisibleRatio ?? 1));
    return aViolation - bViolation || b.score - a.score;
  });

  // Prefer physically suitable modules, but preserve a fallback path on coarse
  // grids. Two suitable geometries are enough to retain useful variation; a
  // fallback is added only when the physical constraints leave fewer than two.
  const shortlist = [...preferred];
  const minimumShortlistSize = preferred.length > 0
    ? Math.min(2, MAX_GEOMETRY_CANDIDATES_PER_ELEMENT)
    : MAX_GEOMETRY_CANDIDATES_PER_ELEMENT;
  for (const candidate of fallbackRanked) {
    if (shortlist.length >= minimumShortlistSize) break;
    if (!shortlist.includes(candidate)) shortlist.push(candidate);
  }
  return shortlist.slice(0, MAX_GEOMETRY_CANDIDATES_PER_ELEMENT);
}

// Step 4 Function 3 — Boundary Constraint Verification
export function isValidGridBoundary(
  column: number,
  row: number,
  columnSpan: number,
  rowSpan: number,
  gridColumns: number,
  gridRows: number
): boolean {
  return (
    column >= 1 &&
    row >= 1 &&
    column + columnSpan - 1 <= gridColumns &&
    row + rowSpan - 1 <= gridRows
  );
}

// Step 4 Function 4 — Non-Overlap Constraint Verification
export function isOverlapping(
  g1: GridGeometry,
  g2: GridGeometry
): boolean {
  const g1Right = g1.column + g1.columnSpan;
  const g1Bottom = g1.row + g1.rowSpan;
  const g2Right = g2.column + g2.columnSpan;
  const g2Bottom = g2.row + g2.rowSpan;

  const isDisjoint =
    g1Right <= g2.column ||
    g2Right <= g1.column ||
    g1Bottom <= g2.row ||
    g2Bottom <= g1.row;

  return !isDisjoint;
}

// Step 6.1 Function 1 — Grid Edge Distance Computation (Manhattan gap)
export function calculateGridEdgeDistance(
  g1: GridGeometry,
  g2: GridGeometry
): number {
  const g1Right = g1.column + g1.columnSpan;
  const g1Bottom = g1.row + g1.rowSpan;
  const g2Right = g2.column + g2.columnSpan;
  const g2Bottom = g2.row + g2.rowSpan;

  const dx = Math.max(0, g1.column - g2Right, g2.column - g1Right);
  const dy = Math.max(0, g1.row - g2Bottom, g2.row - g1Bottom);

  return dx + dy;
}

// Step 7.1 Function 1 — Super-Linear Alignment Axis Strength (S_axis) with Exact 2D Bound Normalization
export function calculateAlignmentAxisStrength(
  placements: GridPlacement[],
  gridColumns: number,
  gridRows: number,
  powerExponent: number = 2
): number {
  const N = placements.length;
  if (N <= 1) return 1.0;

  const colLineCounts = new Map<number, number>();
  const rowLineCounts = new Map<number, number>();

  placements.forEach((p) => {
    const left = p.column;
    const right = p.column + p.columnSpan;
    const top = p.row;
    const bottom = p.row + p.rowSpan;

    colLineCounts.set(left, (colLineCounts.get(left) || 0) + 1);
    colLineCounts.set(right, (colLineCounts.get(right) || 0) + 1);

    rowLineCounts.set(top, (rowLineCounts.get(top) || 0) + 1);
    rowLineCounts.set(bottom, (rowLineCounts.get(bottom) || 0) + 1);
  });

  let Ax = 0;
  colLineCounts.forEach((count) => {
    if (count > 1) {
      Ax += Math.pow(count - 1, powerExponent);
    }
  });

  let Ay = 0;
  rowLineCounts.forEach((count) => {
    if (count > 1) {
      Ay += Math.pow(count - 1, powerExponent);
    }
  });

  // Exact 2D Theoretical Upper Bound: 4 * (N - 1)^p (2 edges per dimension * 2 dimensions)
  const maxTheoretical = 4 * Math.pow(N - 1, powerExponent);
  if (maxTheoretical <= 0) return 1.0;

  const rawScore = (Ax + Ay) / maxTheoretical;
  return Math.min(1.0, rawScore);
}

// Step 6.2 Function 1 — Whitespace Topology: BFS Flood-Fill for Largest Empty Component (S_LEC)
export function calculateLargestEmptyComponent(
  placements: GridPlacement[],
  gridColumns: number,
  gridRows: number
): {
  largestEmptyArea: number;
  totalEmptyArea: number;
  sLEC: number;
  componentCount: number;
} {
  const grid = Array.from({ length: gridRows }, () => new Array(gridColumns).fill(0));

  // Mark occupied modules (1 = occupied, 0 = empty)
  placements.forEach((p) => {
    for (let r = p.row; r < p.row + p.rowSpan; r++) {
      for (let c = p.column; c < p.column + p.columnSpan; c++) {
        if (r >= 1 && r <= gridRows && c >= 1 && c <= gridColumns) {
          grid[r - 1][c - 1] = 1;
        }
      }
    }
  });

  const totalGridArea = gridColumns * gridRows;
  let totalOccupiedArea = 0;
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridColumns; c++) {
      if (grid[r][c] === 1) totalOccupiedArea++;
    }
  }

  const totalEmptyArea = totalGridArea - totalOccupiedArea;
  if (totalEmptyArea === 0) {
    return { largestEmptyArea: 0, totalEmptyArea: 0, sLEC: 0, componentCount: 0 };
  }

  // BFS Flood-Fill to find connected 4-neighbor empty components
  const visited = Array.from({ length: gridRows }, () => new Array(gridColumns).fill(false));
  const componentSizes: number[] = [];

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridColumns; c++) {
      if (grid[r][c] === 0 && !visited[r][c]) {
        let currentSize = 0;
        const queue: Array<[number, number]> = [[r, c]];
        visited[r][c] = true;

        while (queue.length > 0) {
          const [currR, currC] = queue.shift()!;
          currentSize++;

          // 4-orthogonal neighbors
          const neighbors: Array<[number, number]> = [
            [currR - 1, currC],
            [currR + 1, currC],
            [currR, currC - 1],
            [currR, currC + 1]
          ];

          for (const [nR, nC] of neighbors) {
            if (
              nR >= 0 &&
              nR < gridRows &&
              nC >= 0 &&
              nC < gridColumns &&
              grid[nR][nC] === 0 &&
              !visited[nR][nC]
            ) {
              visited[nR][nC] = true;
              queue.push([nR, nC]);
            }
          }
        }

        componentSizes.push(currentSize);
      }
    }
  }

  const largestEmptyArea = componentSizes.length > 0 ? Math.max(...componentSizes) : 0;
  const sLEC = totalEmptyArea > 0 ? largestEmptyArea / totalEmptyArea : 1.0;

  return {
    largestEmptyArea,
    totalEmptyArea,
    sLEC,
    componentCount: componentSizes.length
  };
}

// Step 8.1 Function 1 — Calculate Physical Grid Metrics (u_w, u_h)
export function calculateGridMetrics(
  canvasWidth: number,
  canvasHeight: number,
  gridColumns: number,
  gridRows: number,
  marginX: number = 40,
  marginY: number = 40,
  columnGutter: number = 20,
  rowGutter: number = 20,
  marginRight: number = marginX,
  marginBottom: number = marginY
): GridMetrics {
  const usableWidth = canvasWidth - marginX - marginRight - (gridColumns - 1) * columnGutter;
  const usableHeight = canvasHeight - marginY - marginBottom - (gridRows - 1) * rowGutter;

  const columnWidth = usableWidth / gridColumns;
  const rowHeight = usableHeight / gridRows;

  return {
    canvasWidth,
    canvasHeight,
    marginLeft: marginX,
    marginRight,
    marginTop: marginY,
    marginBottom,
    marginX,
    marginY,
    columnGutter,
    rowGutter,
    columnWidth,
    rowHeight
  };
}

// Step 8.1 Function 2 — Calculate Physical Text Container Dimensions & Coordinates (B_i, D_i, X_i, Y_i in pixels)
export function calculateElementContainerGeometry(
  placement: GridPlacement,
  gridMetrics: GridMetrics
): ElementContainerGeometry {
  const containerWidth =
    placement.columnSpan * gridMetrics.columnWidth +
    (placement.columnSpan - 1) * gridMetrics.columnGutter;

  const containerHeight =
    placement.rowSpan * gridMetrics.rowHeight +
    (placement.rowSpan - 1) * gridMetrics.rowGutter;

  const containerLeftX =
    gridMetrics.marginLeft +
    (placement.column - 1) * (gridMetrics.columnWidth + gridMetrics.columnGutter);

  const containerTopY =
    gridMetrics.marginTop +
    (placement.row - 1) * (gridMetrics.rowHeight + gridMetrics.rowGutter);

  return {
    elementId: placement.elementId,
    containerWidth,
    containerHeight,
    containerTopY,
    containerLeftX
  };
}

// Step 9.1 Function 1 — Typographic Visual Dominance Proxy V_i^type
export function calculateTypographicVisualWeight(
  fontSize: number,
  fontWeight: number = 700,
  alphaType: number = 1.0,
  gammaType: number = 0.5
): { normalizedFontWeight: number; typographicVisualWeight: number } {
  const normalizedFontWeight = Math.min(1.0, Math.max(0.0, (fontWeight - 100) / 800));
  const typographicVisualWeight = Math.pow(fontSize, alphaType) * (1 + gammaType * normalizedFontWeight);
  return {
    normalizedFontWeight,
    typographicVisualWeight: Math.round(typographicVisualWeight * 10) / 10
  };
}

// Step 9.1 Function 2 — Exact Typographic Hierarchy Consistency Index (S_TH) with Pair Concordance C_ij
export function calculateTypographicHierarchyConsistency(
  textFitResults: TextFitResult[],
  elements: GridElement[]
): {
  consistencyScore: number;
  inversions: Array<{ elemId1: string; elemId2: string; h1: number; h2: number; v1: number; v2: number }>;
} {
  const textElements = elements.filter((e): e is TextGridElement => e.type === "text");
  if (textElements.length < 2) {
    return { consistencyScore: 1.0, inversions: [] };
  }

  const fitMap = new Map<string, TextFitResult>();
  textFitResults.forEach((res) => fitMap.set(res.elementId, res));

  let pairCount = 0;
  let consistentPairCount = 0;
  const inversions: Array<{ elemId1: string; elemId2: string; h1: number; h2: number; v1: number; v2: number }> = [];

  for (let i = 0; i < textElements.length; i++) {
    for (let j = i + 1; j < textElements.length; j++) {
      const e1 = textElements[i];
      const e2 = textElements[j];
      const res1 = fitMap.get(e1.id);
      const res2 = fitMap.get(e2.id);

      if (res1 && res2 && e1.hierarchy !== e2.hierarchy) {
        pairCount++;
        const deltaH = e1.hierarchy - e2.hierarchy;
        const deltaV = res1.typographicVisualWeight - res2.typographicVisualWeight;

        // Exact Pair Concordance C_ij: (deltaH * deltaV > 0)
        if (deltaH * deltaV > 0) {
          consistentPairCount++;
        } else {
          const [higherElem, lowerElem, higherRes, lowerRes] =
            deltaH > 0 ? [e1, e2, res1, res2] : [e2, e1, res2, res1];
          inversions.push({
            elemId1: higherElem.id,
            elemId2: lowerElem.id,
            h1: higherElem.hierarchy,
            h2: lowerElem.hierarchy,
            v1: higherRes.typographicVisualWeight,
            v2: lowerRes.typographicVisualWeight
          });
        }
      }
    }
  }

  const consistencyScore = pairCount > 0 ? consistentPairCount / pairCount : 1.0;
  return { consistencyScore, inversions };
}

// Step 9.3B Function 1 — Rag Dynamics Analysis (averageLineJump J, shortLinePenalty P_short, staircaseTrend)
export function calculateRagMetrics(
  linesInfo: TextLineLayout[],
  containerWidth: number
): RagMetrics {
  const L = linesInfo.length;
  if (L === 0 || containerWidth <= 0) {
    return {
      normalizedLineWidths: [],
      averageLineJump: 0,
      shortLineCount: 0,
      shortLinePenalty: 0,
      staircaseTrend: "none"
    };
  }

  const normalizedLineWidths = linesInfo.map((l) => Math.round((l.width / containerWidth) * 1000) / 1000);

  let jumpSum = 0;
  for (let l = 0; l < L - 1; l++) {
    jumpSum += Math.abs(normalizedLineWidths[l + 1] - normalizedLineWidths[l]);
  }
  const averageLineJump = L > 1 ? Math.round((jumpSum / (L - 1)) * 1000) / 1000 : 0;

  const qMin = 0.35;
  let shortCount = 0;
  let penaltySum = 0;
  normalizedLineWidths.forEach((q) => {
    if (q < qMin) shortCount++;
    penaltySum += Math.max(0, qMin - q);
  });
  const shortLinePenalty = Math.round((penaltySum / L) * 1000) / 1000;

  // Staircase Trend Detection
  let isDesc = L >= 3;
  let isAsc = L >= 3;
  for (let l = 0; l < L - 1; l++) {
    if (normalizedLineWidths[l + 1] >= normalizedLineWidths[l]) isDesc = false;
    if (normalizedLineWidths[l + 1] <= normalizedLineWidths[l]) isAsc = false;
  }
  const staircaseTrend = isDesc ? "descending" : isAsc ? "ascending" : "none";

  return {
    normalizedLineWidths,
    averageLineJump,
    shortLineCount: shortCount,
    shortLinePenalty,
    staircaseTrend
  };
}

// Step 9.3A Function 1 — Parameterized Text Layout Simulator with Alignment Mode (left, center, right, justify)
let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;

export function measureTextRealWidth(
  text: string,
  fontSize: number,
  fontFamily: string = "Inter, sans-serif",
  fontWeight: number = 500,
  trackingEm: number = 0.00
): number {
  if (typeof document === "undefined") {
    // SSR fallback: conservative estimation for uppercase/bold sans-serif
    const avgEm = fontWeight >= 700 ? 0.72 : 0.62;
    return text.length * fontSize * avgEm + Math.max(0, text.length - 1) * trackingEm * fontSize;
  }

  if (!offscreenCanvas) {
    offscreenCanvas = document.createElement("canvas");
    offscreenCtx = offscreenCanvas.getContext("2d");
  }

  if (!offscreenCtx) {
    const avgEm = fontWeight >= 700 ? 0.72 : 0.62;
    return text.length * fontSize * avgEm + Math.max(0, text.length - 1) * trackingEm * fontSize;
  }

  offscreenCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const baseW = offscreenCtx.measureText(text).width;
  const trackingPx = trackingEm * fontSize;
  const trackingTotal = Math.max(0, text.length - 1) * trackingPx;
  return baseW + trackingTotal;
}



export function simulateBaselineTextLayout(
  content: string,
  fontSize: number,
  containerWidth: number,
  baselineUnit: number = 8,
  fontFamily: string = "Inter, sans-serif",
  fontWeight: number = 500,
  lineHeightRatio: number = 1.20,
  trackingEm: number = 0.00,
  textAlign: TextAlignMode = "left",
  textPaddingInline: number = 12
): {
  lineCount: number;
  measuredWidth: number;
  measuredExtentHeight: number;
  fitsWidth: boolean;
  n_i: number;
  snappedLineHeight: number;
  ascent: number;
  descent: number;
  trackingPx: number;
  linesInfo: TextLineLayout[];
  ragMetrics: RagMetrics;
} {
  // Exact Font Metrics: Inter/Helvetica ascent ratio ≈ 0.78, descent ratio ≈ 0.22
  const ascentRatio = 0.78;
  const descentRatio = 0.22;
  const ascent = fontSize * ascentRatio;
  const descent = fontSize * descentRatio;

  const idealLineHeight = fontSize * lineHeightRatio;
  const n_i = Math.max(1, Math.round(idealLineHeight / baselineUnit));
  const snappedLineHeight = n_i * baselineUnit;

  const trackingPx = trackingEm * fontSize;
  const netContainerW = Math.max(1, containerWidth - 2 * textPaddingInline);

  if (!content || content.trim().length === 0) {
    const extentH = ascent + descent;
    const defaultLines: TextLineLayout[] = [{ text: "", width: 0, xOffset: textPaddingInline, normalizedWidth: 0 }];
    const defaultRag = calculateRagMetrics(defaultLines, netContainerW);
    return { lineCount: 1, measuredWidth: 0, measuredExtentHeight: extentH, fitsWidth: true, n_i, snappedLineHeight, ascent, descent, trackingPx, linesInfo: defaultLines, ragMetrics: defaultRag };
  }

  const words = content.split(/\s+/);
  const rawLines: string[] = [];
  let currentLine = "";
  let maxLineWidthPx = 0;
  let singleWordOverflow = false;

  for (const word of words) {
    const wordWidthPx = measureTextRealWidth(word, fontSize, fontFamily, fontWeight, trackingEm);
    if (wordWidthPx > netContainerW) {
      singleWordOverflow = true;
    }

    const testLine = currentLine.length === 0 ? word : `${currentLine} ${word}`;
    const testLineWidthPx = measureTextRealWidth(testLine, fontSize, fontFamily, fontWeight, trackingEm);

    if (testLineWidthPx <= netContainerW) {
      currentLine = testLine;
      maxLineWidthPx = Math.max(maxLineWidthPx, testLineWidthPx);
    } else if (currentLine.length > 0) {
      rawLines.push(currentLine);
      currentLine = word;
      maxLineWidthPx = Math.max(maxLineWidthPx, wordWidthPx);
    } else {
      currentLine = word;
      maxLineWidthPx = Math.max(maxLineWidthPx, wordWidthPx);
    }
  }

  if (currentLine.length > 0) {
    rawLines.push(currentLine);
  }

  const lineCount = rawLines.length;

  const linesInfo: TextLineLayout[] = rawLines.map((lineText) => {
    const lineW = measureTextRealWidth(lineText, fontSize, fontFamily, fontWeight, trackingEm);
    const normW = Math.round((lineW / netContainerW) * 1000) / 1000;

    let xOff = textPaddingInline;
    if (textAlign === "right") {
      xOff = textPaddingInline + (netContainerW - lineW);
    } else if (textAlign === "center") {
      xOff = textPaddingInline + (netContainerW - lineW) / 2;
    } else if (textAlign === "justify") {
      xOff = textPaddingInline;
    }

    return {
      text: lineText,
      width: Math.round(lineW),
      xOffset: Math.round(xOff),
      normalizedWidth: normW
    };
  });

  const ragMetrics = calculateRagMetrics(linesInfo, netContainerW);
  const measuredExtentHeight = ascent + descent + (lineCount - 1) * snappedLineHeight;
  const fitsWidth = !singleWordOverflow && maxLineWidthPx <= netContainerW + 0.001;

  return {
    lineCount,
    measuredWidth: Math.round(maxLineWidthPx),
    measuredExtentHeight,
    fitsWidth,
    n_i,
    snappedLineHeight,
    ascent,
    descent,
    trackingPx,
    linesInfo,
    ragMetrics
  };
}

// Step 9.3 Function 2 — Alignment-Aware Baseline Text Re-Fitting 1D Binary Search s_i*(b, k_i, τ_i, textAlign)
export function calculateOptimalFontSize(
  elementId: string,
  content: string,
  containerWidth: number,   // B_i (px)
  containerHeight: number,  // D_i (px)
  fontFamily: string = "Inter, sans-serif",
  fontWeight: number = 700,
  lineHeightRatio: number = 1.20, // k_i
  trackingEm: number = 0.00,      // τ_i (em)
  textAlign: TextAlignMode = "left",
  textPaddingInline: number = 12,
  containerTopY: number = 40,     // Y_i (px)
  baselineGrid: BaselineGridParameters = { baselineUnit: 8, baselineOrigin: 40 },
  minFontSize: number = 10,
  maxFontSize: number = 200
): TextFitResult {
  const { baselineUnit, baselineOrigin } = baselineGrid;

  let low = minFontSize;
  let high = maxFontSize;
  let bestFit = {
    fontSize: minFontSize,
    lineCount: 1,
    measuredWidth: 0,
    measuredExtentHeight: baselineUnit,
    n_i: 1,
    snappedLineHeight: baselineUnit,
    ascent: minFontSize * 0.78,
    descent: minFontSize * 0.22,
    firstBaseline: containerTopY + minFontSize * 0.78,
    trackingPx: trackingEm * minFontSize,
    linesInfo: [] as TextLineLayout[],
    ragMetrics: {
      normalizedLineWidths: [] as number[],
      averageLineJump: 0,
      shortLineCount: 0,
      shortLinePenalty: 0,
      staircaseTrend: "none" as const
    } as RagMetrics
  };

  let fitsAtAll = false;

  for (let iter = 0; iter < 12; iter++) {
    const mid = (low + high) / 2;
    const layout = simulateBaselineTextLayout(content, mid, containerWidth, baselineUnit, fontFamily, fontWeight, lineHeightRatio, trackingEm, textAlign, textPaddingInline);

    // Step 8.5 Constraint-Aware First Baseline Snap with Math.ceil to guarantee beta_{i,0} - a_i >= Y_i
    const rawOffset = (containerTopY + layout.ascent - baselineOrigin) / baselineUnit;
    const firstBaseline = baselineOrigin + Math.ceil(rawOffset) * baselineUnit;
    const lastBaseline = firstBaseline + (layout.lineCount - 1) * layout.snappedLineHeight;

    // Strict Bounds Verification Rules:
    // 1. Top Cap/Glyph Top: Y_i <= beta_{i,0} - a_i (guaranteed by Math.ceil)
    // 2. Bottom Descent: beta_{i, L-1} + d_i <= Y_i + D_i
    // 3. Width: W_text(s, tau) <= B_i
    const fitsTop = firstBaseline - layout.ascent >= containerTopY - 0.001;
    const fitsBottom = lastBaseline + layout.descent <= containerTopY + containerHeight + 0.001;
    const fitsHeight = layout.measuredExtentHeight <= containerHeight + 0.001;
    const fitsInContainer = layout.fitsWidth && fitsTop && fitsBottom && fitsHeight;

    if (fitsInContainer) {
      fitsAtAll = true;
      bestFit = {
        fontSize: mid,
        lineCount: layout.lineCount,
        measuredWidth: layout.measuredWidth,
        measuredExtentHeight: layout.measuredExtentHeight,
        n_i: layout.n_i,
        snappedLineHeight: layout.snappedLineHeight,
        ascent: layout.ascent,
        descent: layout.descent,
        firstBaseline,
        trackingPx: layout.trackingPx,
        linesInfo: layout.linesInfo,
        ragMetrics: layout.ragMetrics
      };
      low = mid; // Try larger font size
    } else {
      high = mid; // Reduce font size
    }
  }

  // Hard Containment Fallback: If minFontSize still overflows, scale down until text fits 100% inside container
  if (!fitsAtAll) {
    let testSize = minFontSize - 1;
    while (testSize >= 2) {
      const layout = simulateBaselineTextLayout(content, testSize, containerWidth, baselineUnit, fontFamily, fontWeight, lineHeightRatio, trackingEm, textAlign, textPaddingInline);
      const rawOffset = (containerTopY + layout.ascent - baselineOrigin) / baselineUnit;
      const firstBaseline = baselineOrigin + Math.ceil(rawOffset) * baselineUnit;
      const lastBaseline = firstBaseline + (layout.lineCount - 1) * layout.snappedLineHeight;
      const fitsTop = firstBaseline - layout.ascent >= containerTopY - 0.001;
      const fitsBottom = lastBaseline + layout.descent <= containerTopY + containerHeight + 0.001;
      const fitsHeight = layout.measuredExtentHeight <= containerHeight + 0.001;

      if (layout.fitsWidth && fitsTop && fitsBottom && fitsHeight) {
        bestFit = {
          fontSize: testSize,
          lineCount: layout.lineCount,
          measuredWidth: layout.measuredWidth,
          measuredExtentHeight: layout.measuredExtentHeight,
          n_i: layout.n_i,
          snappedLineHeight: layout.snappedLineHeight,
          ascent: layout.ascent,
          descent: layout.descent,
          firstBaseline,
          trackingPx: layout.trackingPx,
          linesInfo: layout.linesInfo,
          ragMetrics: layout.ragMetrics
        };
        break;
      }
      testSize -= 0.5;
    }
  }

  // Debug Assertion: Guarantee maxRenderedLineWidth <= containerInnerWidth + epsilon
  const containerInnerWidth = Math.max(1, containerWidth - 2 * textPaddingInline);
  const maxRenderedLineWidth = bestFit.measuredWidth;
  if (typeof window !== "undefined") {
    console.assert(
      maxRenderedLineWidth <= containerInnerWidth + 1.0,
      `[TextFit Error] Element ${elementId}: maxRenderedLineWidth (${maxRenderedLineWidth}px) > containerInnerWidth (${containerInnerWidth}px). Font size: ${bestFit.fontSize}px`
    );
  }

  const optFontSize = Math.round(bestFit.fontSize * 10) / 10;
  const snappedLineHeight = bestFit.snappedLineHeight;

  // Step 9.1 Typographic Visual Dominance Proxy V_i^type
  const typeWeight = calculateTypographicVisualWeight(optFontSize, fontWeight, 1.0, 0.5);

  // Generate All Baseline Line Positions β_{i,m} = β_{i,0} + m * ℓ_i^snap
  const baselinePositions: number[] = [];
  for (let m = 0; m < bestFit.lineCount; m++) {
    baselinePositions.push(bestFit.firstBaseline + m * snappedLineHeight);
  }

  return {
    elementId,
    fontSize: optFontSize,
    lineHeightRatio,
    trackingEm,
    trackingPx: Math.round(bestFit.trackingPx * 10) / 10,
    textAlign,
    lineHeight: snappedLineHeight,
    snappedLineHeight,
    baselineMultiple: bestFit.n_i,
    ascent: Math.round(bestFit.ascent * 10) / 10,
    descent: Math.round(bestFit.descent * 10) / 10,
    firstBaseline: bestFit.firstBaseline,
    baselinePositions,
    containerWidth: Math.round(containerWidth),
    containerHeight: Math.round(containerHeight),
    containerTopY: Math.round(containerTopY),
    measuredWidth: Math.round(bestFit.measuredWidth),
    measuredHeight: Math.round(bestFit.measuredExtentHeight),
    lineCount: bestFit.lineCount,
    fits: fitsAtAll,
    fontWeight,
    normalizedFontWeight: typeWeight.normalizedFontWeight,
    typographicVisualWeight: typeWeight.typographicVisualWeight,
    linesInfo: bestFit.linesInfo,
    ragMetrics: bestFit.ragMetrics
  };
}

// Step 10.1 & 10.2 Image Fit, Focal Point Offset & Geometric Dominance Engine (V_i^geo, q_canvas, q_crop)
export function calculateImageFitGeometry(
  elementId: string,
  sourceWidth: number = 1200,
  sourceHeight: number = 800,
  containerWidth: number = 300,
  containerHeight: number = 300,
  imageFit: ImageFitMode = "cover",
  focalPointX: number = 0.5,
  focalPointY: number = 0.5,
  canvasWidth: number = 1200,
  canvasHeight: number = 1600
): ImageFitResult {
  const safeSrcW = Math.max(1, sourceWidth);
  const safeSrcH = Math.max(1, sourceHeight);
  const safeContW = Math.max(1, containerWidth);
  const safeContH = Math.max(1, containerHeight);

  const sourceAspectRatio = safeSrcW / safeSrcH;
  const containerAspectRatio = safeContW / safeContH;

  const scaleW = safeContW / safeSrcW;
  const scaleH = safeContH / safeSrcH;

  let scale = 1.0;
  if (imageFit === "cover") {
    scale = Math.max(scaleW, scaleH);
  } else {
    scale = Math.min(scaleW, scaleH);
  }

  const renderedWidth = scale * safeSrcW;
  const renderedHeight = scale * safeSrcH;

  const deltaX = Math.max(0, renderedWidth - safeContW);
  const deltaY = Math.max(0, renderedHeight - safeContH);

  const safeFx = Math.min(1.0, Math.max(0.0, focalPointX));
  const safeFy = Math.min(1.0, Math.max(0.0, focalPointY));

  // True Focal Point Preservation Mapping: o_x = clamp(f_x * W_render - B / 2, 0, deltaX)
  const rawOffsetX = safeFx * renderedWidth - safeContW / 2;
  const rawOffsetY = safeFy * renderedHeight - safeContH / 2;

  const cropOffsetX = Math.min(deltaX, Math.max(0, rawOffsetX));
  const cropOffsetY = Math.min(deltaY, Math.max(0, rawOffsetY));

  // Universal Visible Area Formula: A_visible = min(B, W_render) * min(D, H_render)
  const visibleWidth = Math.min(safeContW, renderedWidth);
  const visibleHeight = Math.min(safeContH, renderedHeight);
  const visibleArea = visibleWidth * visibleHeight;

  const renderedArea = renderedWidth * renderedHeight;
  const visibleRatio = renderedArea > 0 ? Math.min(1.0, visibleArea / renderedArea) : 1.0;
  const cropRatio = 1.0 - visibleRatio;

  // Step 10.2 Geometric Image Dominance (V_i^geo) & Canvas Coverage Ratio (q_i^canvas)
  const canvasArea = canvasWidth * canvasHeight;
  const canvasCoverageRatio = canvasArea > 0 ? visibleArea / canvasArea : 0;
  const geometricDominance = visibleArea;

  return {
    elementId,
    sourceWidth: safeSrcW,
    sourceHeight: safeSrcH,
    sourceAspectRatio: Math.round(sourceAspectRatio * 1000) / 1000,
    containerWidth: Math.round(safeContW),
    containerHeight: Math.round(safeContH),
    containerAspectRatio: Math.round(containerAspectRatio * 1000) / 1000,
    imageFit,
    scale: Math.round(scale * 1000) / 1000,
    renderedWidth: Math.round(renderedWidth),
    renderedHeight: Math.round(renderedHeight),
    cropOffsetX: Math.round(cropOffsetX),
    cropOffsetY: Math.round(cropOffsetY),
    focalPointX: safeFx,
    focalPointY: safeFy,
    visibleWidth: Math.round(visibleWidth),
    visibleHeight: Math.round(visibleHeight),
    visibleArea: Math.round(visibleArea),
    visibleRatio: Math.round(visibleRatio * 1000) / 1000,
    cropRatio: Math.round(cropRatio * 1000) / 1000,
    canvasCoverageRatio: Math.round(canvasCoverageRatio * 1000) / 1000,
    geometricDominance: Math.round(geometricDominance)
  };
}

// Step 10.3 Function 1 — Cross-Modal Dominance Consistency (S_cross via Total Variation Distance)
export function calculateCrossModalDominanceConsistency(
  elementsWithWeight: GridElementWithWeight[],
  textFitResults: TextFitResult[],
  imageFitResults: ImageFitResult[],
  canvasWidth: number = 1200,
  canvasHeight: number = 1600,
  gammaFontWeight: number = 0.5
): CrossModalHierarchyResult {
  const N = elementsWithWeight.length;
  if (N === 0) {
    return { sCross: 1.0, tvDistance: 0, elementDistributions: [] };
  }

  const textFitMap = new Map<string, TextFitResult>();
  textFitResults.forEach((res) => textFitMap.set(res.elementId, res));

  const imageFitMap = new Map<string, ImageFitResult>();
  imageFitResults.forEach((res) => imageFitMap.set(res.elementId, res));

  const canvasArea = canvasWidth * canvasHeight;

  // 1. Calculate unnormalized dominance proxy d_i for each element
  const rawDominanceList = elementsWithWeight.map((elem) => {
    let d_i = 0;
    if (elem.type === "text") {
      const fit = textFitMap.get(elem.id);
      if (fit) {
        const textPhysicalArea = fit.measuredWidth * fit.measuredHeight;
        const qTextArea = canvasArea > 0 ? textPhysicalArea / canvasArea : 0;
        const f_i = fit.normalizedFontWeight;
        d_i = qTextArea * (1 + gammaFontWeight * f_i);
      } else {
        d_i = 0.01;
      }
    } else {
      const fit = imageFitMap.get(elem.id);
      if (fit) {
        d_i = fit.canvasCoverageRatio; // q_i^canvas = A_visible / A_canvas
      } else {
        d_i = 0.01;
      }
    }
    return { elem, d_i: Math.max(0.0001, d_i) };
  });

  // 2. Total Cross-Modal Dominance Proxy Sum
  const totalDominanceSum = rawDominanceList.reduce((sum, item) => sum + item.d_i, 0);

  // 3. Intended Hierarchy Weight Sum
  const totalHierarchyWeight = elementsWithWeight.reduce((sum, elem) => sum + elem.visualWeight, 0);

  // 4. Compute Normalized Distributions q_cross and q_hierarchy
  let l1DiffSum = 0;
  const elementDistributions = rawDominanceList.map(({ elem, d_i }) => {
    const q_cross = totalDominanceSum > 0 ? d_i / totalDominanceSum : 1 / N;
    const q_hierarchy = totalHierarchyWeight > 0 ? elem.visualWeight / totalHierarchyWeight : 1 / N;

    l1DiffSum += Math.abs(q_cross - q_hierarchy);

    return {
      elementId: elem.id,
      name: elem.name,
      type: elem.type,
      d_i: Math.round(d_i * 10000) / 10000,
      q_cross: Math.round(q_cross * 1000) / 1000,
      q_hierarchy: Math.round(q_hierarchy * 1000) / 1000
    };
  });

  // 5. Total Variation Distance D_TV = 0.5 * sum(|q_cross - q_hierarchy|)
  const tvDistance = Math.round(0.5 * l1DiffSum * 1000) / 1000;
  const sCross = Math.round(Math.max(0, 1 - tvDistance) * 1000) / 1000;

  return {
    sCross,
    tvDistance,
    elementDistributions
  };
}

// Step 10.4 Function 1 — Calculate Image-Text Boundary Geometry Measurements (Grid-level & Physical-level)
export function calculateImageTextBoundaryMetrics(
  compositionSolution: CompositionResult | null,
  elements: GridElement[],
  gridMetrics: GridMetrics
): ImageTextBoundaryMetrics[] {
  if (!compositionSolution || compositionSolution.placements.length === 0) return [];

  const placementMap = new Map<string, GridPlacement>();
  compositionSolution.placements.forEach((p) => placementMap.set(p.elementId, p));

  const imageElements = elements.filter((e): e is ImageGridElement => e.type === "image");
  const textElements = elements.filter((e): e is TextGridElement => e.type === "text");

  const results: ImageTextBoundaryMetrics[] = [];

  imageElements.forEach((img) => {
    const pI = placementMap.get(img.id);
    if (!pI) return;

    // Grid module coordinates (1-based)
    const xI = pI.column;
    const yI = pI.row;
    const wI = pI.columnSpan;
    const hI = pI.rowSpan;

    // Physical container pixel coordinates
    const geoI = calculateElementContainerGeometry(pI, gridMetrics);
    const pxLeftI = geoI.containerLeftX;
    const pxRightI = geoI.containerLeftX + geoI.containerWidth;
    const pxTopI = geoI.containerTopY;
    const pxBottomI = geoI.containerTopY + geoI.containerHeight;

    textElements.forEach((txt) => {
      const pT = placementMap.get(txt.id);
      if (!pT) return;

      const xT = pT.column;
      const yT = pT.row;
      const wT = pT.columnSpan;
      const hT = pT.rowSpan;

      const geoT = calculateElementContainerGeometry(pT, gridMetrics);
      const pxLeftT = geoT.containerLeftX;
      const pxRightT = geoT.containerLeftX + geoT.containerWidth;
      const pxTopT = geoT.containerTopY;
      const pxBottomT = geoT.containerTopY + geoT.containerHeight;

      // 1. Grid Module Distance: d_x^module, d_y^module, d_IT^module
      const d_x_module = Math.max(0, xI - (xT + wT), xT - (xI + wI));
      const d_y_module = Math.max(0, yI - (yT + hT), yT - (yI + hI));
      const gridModuleDistance = d_x_module + d_y_module;

      // 2. Physical Pixel Gap: G_x^px, G_y^px
      const G_x_px = Math.max(0, pxLeftI - pxRightT, pxLeftT - pxRightI);
      const G_y_px = Math.max(0, pxTopI - pxBottomT, pxTopT - pxBottomI);
      const physicalPixelDistance = G_x_px + G_y_px;

      // Physical Gutter Units: m_x^gutter = G_x^px / g_x, m_y^gutter = G_y^px / g_y
      const gx = Math.max(1, gridMetrics.columnGutter);
      const gy = Math.max(1, gridMetrics.rowGutter);
      const horizontalGutterUnits = Math.round((G_x_px / gx) * 100) / 100;
      const verticalGutterUnits = Math.round((G_y_px / gy) * 100) / 100;

      // 3. Shared Boundary Length (L_shared = L_v + L_h)
      let L_v_px = 0;
      let L_v_mod = 0;
      if (xI + wI === xT || xT + wT === xI) {
        L_v_mod = Math.max(0, Math.min(yI + hI, yT + hT) - Math.max(yI, yT));
        L_v_px = Math.max(0, Math.min(pxBottomI, pxBottomT) - Math.max(pxTopI, pxTopT));
      }

      let L_h_px = 0;
      let L_h_mod = 0;
      if (yI + hI === yT || yT + hT === yI) {
        L_h_mod = Math.max(0, Math.min(xI + wI, xT + wT) - Math.max(xI, xT));
        L_h_px = Math.max(0, Math.min(pxRightI, pxRightT) - Math.max(pxLeftI, pxLeftT));
      }

      const sharedBoundaryLengthPx = Math.round(L_v_px + L_h_px);
      const sharedBoundaryModules = L_v_mod + L_h_mod;

      // 4. Axis Coincidence Relationships
      const sharesLeftAxis = xI === xT;
      const sharesRightAxis = xI + wI === xT + wT;
      const sharesTopAxis = yI === yT;
      const sharesBottomAxis = yI + hI === yT + hT;

      const opposingVerticalAxis = xI + wI === xT || xT + wT === xI;
      const opposingHorizontalAxis = yI + hI === yT || yT + hT === yI;

      results.push({
        imageId: img.id,
        imageName: img.name,
        textId: txt.id,
        textName: txt.name,
        horizontalModuleGap: d_x_module,
        verticalModuleGap: d_y_module,
        gridModuleDistance,
        horizontalPixelGap: Math.round(G_x_px),
        verticalPixelGap: Math.round(G_y_px),
        physicalPixelDistance: Math.round(physicalPixelDistance),
        horizontalGutterUnits,
        verticalGutterUnits,
        sharedBoundaryLengthPx,
        sharedBoundaryModules,
        sharesLeftAxis,
        sharesRightAxis,
        sharesTopAxis,
        sharesBottomAxis,
        opposingVerticalAxis,
        opposingHorizontalAxis
      });
    });
  });

  return results;
}

// Step 5.2 Function 1 — Pre-generate Boundary Valid Placements P_i
export function generatePlacementSet(
  elementId: string,
  candidates: GeometryCandidate[],
  gridColumns: number,
  gridRows: number
): GridPlacement[] {
  const placements: GridPlacement[] = [];
  candidates.forEach((cand) => {
    const maxCol = gridColumns - cand.columnSpan + 1;
    const maxRow = gridRows - cand.rowSpan + 1;
    for (let c = 1; c <= maxCol; c++) {
      for (let r = 1; r <= maxRow; r++) {
        placements.push({
          elementId,
          column: c,
          row: r,
          columnSpan: cand.columnSpan,
          rowSpan: cand.rowSpan,
          candidateScore: cand.score
        });
      }
    }
  });
  return placements;
}

// Step 7.1 Function 2 — Global Composition Soft Score Evaluator (with S_axis Alignment Axis Strength)
export function evaluateComposition(
  placements: GridPlacement[],
  elements: GridElementWithStep4[],
  gridColumns: number,
  gridRows: number,
  parameters: LayoutParameters
): {
  globalScore: number;
  shapeScore: number;
  hierarchyScore: number;
  alignmentScore: number;
  densityScore: number;
  proximityScore: number;
  lecScore: number;
  axisScore: number;
  hasGroupProximity: boolean;
} {
  const N = elements.length;
  if (N === 0) {
    return {
      globalScore: 0,
      shapeScore: 0,
      hierarchyScore: 0,
      alignmentScore: 0,
      densityScore: 0,
      proximityScore: 0,
      lecScore: 0,
      axisScore: 0,
      hasGroupProximity: false
    };
  }

  const placementMap = new Map<string, GridPlacement>();
  placements.forEach((p) => placementMap.set(p.elementId, p));

  const elementMap = new Map<string, GridElementWithStep4>();
  elements.forEach((e) => elementMap.set(e.id, e));

  // 1. Shape Fit Score S_S (Hierarchy-Weighted Average)
  let totalVisualWeight = 0;
  let weightedShapeSum = 0;
  elements.forEach((elem) => {
    const p = placementMap.get(elem.id);
    const score = p ? p.candidateScore : 0;
    weightedShapeSum += elem.visualWeight * score;
    totalVisualWeight += elem.visualWeight;
  });
  const shapeScore = totalVisualWeight > 0 ? weightedShapeSum / totalVisualWeight : 0;

  // 2. Hierarchy Preservation Score S_H
  const actualTotalArea = placements.reduce((sum, p) => sum + p.columnSpan * p.rowSpan, 0);
  const idealTotalArea = elements.reduce((sum, elem) => sum + elem.idealArea, 0);

  let l1DiffSum = 0;
  elements.forEach((elem) => {
    const p = placementMap.get(elem.id);
    const actualArea = p ? p.columnSpan * p.rowSpan : 0;
    const qActual = actualTotalArea > 0 ? actualArea / actualTotalArea : 0;
    const qIdeal = idealTotalArea > 0 ? elem.idealArea / idealTotalArea : 0;
    l1DiffSum += Math.abs(qActual - qIdeal);
  });
  const dTV = 0.5 * l1DiffSum;
  const hierarchyScore = Math.max(0, 1 - dTV);

  // 3. Swiss Edge Alignment Score S_A
  let alignmentScore = 1.0;
  if (N > 1) {
    let kAligned = 0;
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        const p1 = placements[i];
        const p2 = placements[j];
        if (p1.column === p2.column) kAligned++; // Left
        if (p1.column + p1.columnSpan === p2.column + p2.columnSpan) kAligned++; // Right
        if (p1.row === p2.row) kAligned++; // Top
        if (p1.row + p1.rowSpan === p2.row + p2.rowSpan) kAligned++; // Bottom
      }
    }
    const kMax = 2 * N * (N - 1);
    alignmentScore = Math.min(1.0, kAligned / kMax);
  }

  // 4. Density Score S_D
  const targetArea = parameters.contentDensity * gridColumns * gridRows;
  const densityScore = targetArea > 0
    ? Math.max(0, 1 - Math.abs(actualTotalArea - targetArea) / targetArea)
    : 0;

  // 5. Step 6.1 Group Proximity Score S_P
  let proximitySum = 0;
  let groupPairCount = 0;

  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const p1 = placements[i];
      const p2 = placements[j];
      const e1 = elementMap.get(p1.elementId);
      const e2 = elementMap.get(p2.elementId);

      if (e1 && e2 && e1.groupId && e2.groupId && e1.groupId === e2.groupId) {
        groupPairCount++;
        const dist = calculateGridEdgeDistance(p1, p2);
        const pScore = 1 / (1 + dist);
        proximitySum += pScore;
      }
    }
  }

  const hasGroupProximity = groupPairCount > 0;
  const proximityScore = hasGroupProximity ? proximitySum / groupPairCount : 1.0;

  // 6. Step 6.2 Whitespace Topology: Largest Empty Component Ratio S_LEC
  const lecInfo = calculateLargestEmptyComponent(placements, gridColumns, gridRows);
  const lecScore = lecInfo.sLEC;

  // 7. Step 7.1 Alignment Axis Strength Score S_axis
  const axisScore = calculateAlignmentAxisStrength(placements, gridColumns, gridRows, 2);

  // Global Score S_global Formulation:
  // S_global = λ_S S_S + λ_H S_H + λ_A S_A + λ_D S_D + λ_P S_P + λ_LEC S_LEC + λ_Axis S_axis
  const { lambdaShape, lambdaHierarchy, lambdaAlignment, lambdaDensity, lambdaProximity, lambdaLEC, lambdaAxis } = parameters;

  let globalScore = 0;
  if (hasGroupProximity) {
    const totalW = lambdaShape + lambdaHierarchy + lambdaAlignment + lambdaDensity + lambdaProximity + lambdaLEC + lambdaAxis;
    globalScore =
      (lambdaShape / totalW) * shapeScore +
      (lambdaHierarchy / totalW) * hierarchyScore +
      (lambdaAlignment / totalW) * alignmentScore +
      (lambdaDensity / totalW) * densityScore +
      (lambdaProximity / totalW) * proximityScore +
      (lambdaLEC / totalW) * lecScore +
      (lambdaAxis / totalW) * axisScore;
  } else {
    const totalW = lambdaShape + lambdaHierarchy + lambdaAlignment + lambdaDensity + lambdaLEC + lambdaAxis;
    globalScore =
      (lambdaShape / totalW) * shapeScore +
      (lambdaHierarchy / totalW) * hierarchyScore +
      (lambdaAlignment / totalW) * alignmentScore +
      (lambdaDensity / totalW) * densityScore +
      (lambdaLEC / totalW) * lecScore +
      (lambdaAxis / totalW) * axisScore;
  }

  return {
    globalScore,
    shapeScore,
    hierarchyScore,
    alignmentScore,
    densityScore,
    proximityScore,
    lecScore,
    axisScore,
    hasGroupProximity
  };
}

// Step 5.2 & Step 6 — Exact Solver with Top-N Ranked Solutions Collector
export function solveExactLayout(
  elements: GridElementWithStep4[],
  gridColumns: number,
  gridRows: number,
  parameters: LayoutParameters,
  topN: number = 5
): CompositionResult | null {
  if (elements.length === 0) return null;

  // Search Ordering Heuristic: Sort elements by hierarchy descending
  const sortedElements = [...elements].sort((a, b) => b.hierarchy - a.hierarchy);
  const N = sortedElements.length;

  // Pre-generate Placement Set P_i for each sorted element
  const placementSets = sortedElements.map((elem) =>
    generatePlacementSet(elem.id, elem.candidates, gridColumns, gridRows)
  );
  const gridTotalArea = gridColumns * gridRows;

  // Compute the cumulative minimum area required by all remaining elements.
  const minRemainingAreas = new Array<number>(N + 1).fill(0);
  for (let i = N - 1; i >= 0; i--) {
    const minPlacementArea = placementSets[i].reduce(
      (min, p) => Math.min(min, p.columnSpan * p.rowSpan),
      Infinity
    );
    const safeMinPlacementArea = minPlacementArea === Infinity
      ? gridTotalArea + 1
      : minPlacementArea;
    minRemainingAreas[i] = safeMinPlacementArea + minRemainingAreas[i + 1];
  }

  let nodesEvaluated = 0;
  let feasibleCompositions = 0;
  let prunedNodes = 0;
  let searchTruncated = false;

  const topSolutionsList: CompositionResult[] = [];
  const solverNodeBudget = Math.max(
    10_000,
    Math.floor(BASE_SOLVER_NODE_BUDGET * (16 / Math.max(1, gridTotalArea)))
  );

  function hasReachedSearchBudget(): boolean {
    return nodesEvaluated >= solverNodeBudget;
  }

  const totalVisualWeightForBound = sortedElements.reduce(
    (sum, element) => sum + element.visualWeight,
    0
  );
  const idealTotalAreaForBound = sortedElements.reduce(
    (sum, element) => sum + element.idealArea,
    0
  );
  const targetContentAreaForBound = parameters.contentDensity * gridTotalArea;
  const totalGroupPairs = sortedElements.reduce((pairCount, element, index) => {
    if (!element.groupId) return pairCount;
    for (let otherIndex = index + 1; otherIndex < N; otherIndex++) {
      if (sortedElements[otherIndex].groupId === element.groupId) pairCount++;
    }
    return pairCount;
  }, 0);
  const hasGroupProximityForBound = totalGroupPairs > 0;
  const scoreWeightTotal = hasGroupProximityForBound
    ? parameters.lambdaShape + parameters.lambdaHierarchy + parameters.lambdaAlignment +
      parameters.lambdaDensity + parameters.lambdaProximity + parameters.lambdaLEC +
      parameters.lambdaAxis
    : parameters.lambdaShape + parameters.lambdaHierarchy + parameters.lambdaAlignment +
      parameters.lambdaDensity + parameters.lambdaLEC + parameters.lambdaAxis;
  const safeScoreWeightTotal = scoreWeightTotal > 0 ? scoreWeightTotal : 1;
  const normalizedScoreWeights = {
    shape: parameters.lambdaShape / safeScoreWeightTotal,
    hierarchy: parameters.lambdaHierarchy / safeScoreWeightTotal,
    alignment: parameters.lambdaAlignment / safeScoreWeightTotal,
    density: parameters.lambdaDensity / safeScoreWeightTotal,
    proximity: hasGroupProximityForBound
      ? parameters.lambdaProximity / safeScoreWeightTotal
      : 0,
    lec: parameters.lambdaLEC / safeScoreWeightTotal,
    axis: parameters.lambdaAxis / safeScoreWeightTotal
  };
  const hierarchyDensityBoundCache = new Map<string, number>();

  function calculateHierarchyDensityUpperBound(
    depth: number,
    currentPlacements: GridPlacement[]
  ): number {
    const selectedAreas = new Array<number>(N);
    for (let index = 0; index < depth; index++) {
      const placement = currentPlacements[index];
      selectedAreas[index] = placement.columnSpan * placement.rowSpan;
    }

    const cacheKey = `${depth}:${selectedAreas.slice(0, depth).join(",")}`;
    const cached = hierarchyDensityBoundCache.get(cacheKey);
    if (cached !== undefined) return cached;

    let bestCombinedScore = 0;
    function enumerateRemainingAreas(elementIndex: number, actualTotalArea: number) {
      if (elementIndex === N) {
        let l1Difference = 0;
        for (let index = 0; index < N; index++) {
          const actualRatio = actualTotalArea > 0
            ? selectedAreas[index] / actualTotalArea
            : 0;
          const idealRatio = idealTotalAreaForBound > 0
            ? sortedElements[index].idealArea / idealTotalAreaForBound
            : 0;
          l1Difference += Math.abs(actualRatio - idealRatio);
        }
        const hierarchyScore = Math.max(0, 1 - 0.5 * l1Difference);
        const densityScore = targetContentAreaForBound > 0
          ? Math.max(
            0,
            1 - Math.abs(actualTotalArea - targetContentAreaForBound) /
              targetContentAreaForBound
          )
          : 0;
        bestCombinedScore = Math.max(
          bestCombinedScore,
          normalizedScoreWeights.hierarchy * hierarchyScore +
            normalizedScoreWeights.density * densityScore
        );
        return;
      }

      const candidateAreas = new Set(
        sortedElements[elementIndex].candidates.map((candidate) => candidate.area)
      );
      candidateAreas.forEach((candidateArea) => {
        selectedAreas[elementIndex] = candidateArea;
        enumerateRemainingAreas(elementIndex + 1, actualTotalArea + candidateArea);
      });
    }

    const placedArea = selectedAreas
      .slice(0, depth)
      .reduce((sum, area) => sum + area, 0);
    enumerateRemainingAreas(depth, placedArea);
    hierarchyDensityBoundCache.set(cacheKey, bestCombinedScore);
    return bestCombinedScore;
  }

  function calculateAlignmentUpperBound(currentPlacements: GridPlacement[]): number {
    if (N <= 1) return 1;

    let currentAlignedEdges = 0;
    for (let firstIndex = 0; firstIndex < currentPlacements.length; firstIndex++) {
      for (let secondIndex = firstIndex + 1; secondIndex < currentPlacements.length; secondIndex++) {
        const first = currentPlacements[firstIndex];
        const second = currentPlacements[secondIndex];
        if (first.column === second.column) currentAlignedEdges++;
        if (first.column + first.columnSpan === second.column + second.columnSpan) currentAlignedEdges++;
        if (first.row === second.row) currentAlignedEdges++;
        if (first.row + first.rowSpan === second.row + second.rowSpan) currentAlignedEdges++;
      }
    }

    const totalPairs = N * (N - 1) / 2;
    const placedPairs = currentPlacements.length * (currentPlacements.length - 1) / 2;
    const unresolvedPairs = totalPairs - placedPairs;
    // Two non-overlapping rectangles can share at most two equal outer edges.
    const maximumAlignedEdges = currentAlignedEdges + 2 * unresolvedPairs;
    return Math.min(1, maximumAlignedEdges / (4 * totalPairs));
  }

  function calculateProximityUpperBound(currentPlacements: GridPlacement[]): number {
    if (!hasGroupProximityForBound) return 1;

    let resolvedGroupPairs = 0;
    let resolvedProximitySum = 0;
    for (let firstIndex = 0; firstIndex < currentPlacements.length; firstIndex++) {
      for (let secondIndex = firstIndex + 1; secondIndex < currentPlacements.length; secondIndex++) {
        const firstElement = sortedElements[firstIndex];
        const secondElement = sortedElements[secondIndex];
        if (
          firstElement.groupId &&
          firstElement.groupId === secondElement.groupId
        ) {
          resolvedGroupPairs++;
          resolvedProximitySum += 1 / (
            1 + calculateGridEdgeDistance(
              currentPlacements[firstIndex],
              currentPlacements[secondIndex]
            )
          );
        }
      }
    }

    return (
      resolvedProximitySum + (totalGroupPairs - resolvedGroupPairs)
    ) / totalGroupPairs;
  }

  function calculateAxisUpperBound(currentPlacements: GridPlacement[]): number {
    if (N <= 1) return 1;
    const remainingElementCount = N - currentPlacements.length;
    const columnCounts = new Array<number>(gridColumns + 1).fill(0);
    const rowCounts = new Array<number>(gridRows + 1).fill(0);

    currentPlacements.forEach((placement) => {
      columnCounts[placement.column - 1]++;
      columnCounts[placement.column + placement.columnSpan - 1]++;
      rowCounts[placement.row - 1]++;
      rowCounts[placement.row + placement.rowSpan - 1]++;
    });

    const contribution = (count: number) => count > 1 ? Math.pow(count - 1, 2) : 0;
    const dimensionUpperBound = (counts: number[]) => {
      const sortedCounts = [...counts].sort((a, b) => b - a);
      let upperBound = counts.reduce((sum, count) => sum + contribution(count), 0);
      for (let index = 0; index < Math.min(2, sortedCounts.length); index++) {
        upperBound -= contribution(sortedCounts[index]);
        upperBound += contribution(sortedCounts[index] + remainingElementCount);
      }
      return upperBound;
    };

    const maximumTheoretical = 4 * Math.pow(N - 1, 2);
    return Math.min(
      1,
      (dimensionUpperBound(columnCounts) + dimensionUpperBound(rowCounts)) /
        maximumTheoretical
    );
  }

  function calculateGlobalScoreUpperBound(
    depth: number,
    currentPlacements: GridPlacement[]
  ): number {
    let maximumWeightedShapeSum = 0;
    for (let index = 0; index < N; index++) {
      const candidateScore = index < depth
        ? currentPlacements[index].candidateScore
        : Math.max(...sortedElements[index].candidates.map((candidate) => candidate.score));
      maximumWeightedShapeSum += sortedElements[index].visualWeight * candidateScore;
    }
    const shapeUpperBound = totalVisualWeightForBound > 0
      ? maximumWeightedShapeSum / totalVisualWeightForBound
      : 0;

    return (
      normalizedScoreWeights.shape * shapeUpperBound +
      calculateHierarchyDensityUpperBound(depth, currentPlacements) +
      normalizedScoreWeights.alignment * calculateAlignmentUpperBound(currentPlacements) +
      normalizedScoreWeights.proximity * calculateProximityUpperBound(currentPlacements) +
      normalizedScoreWeights.lec +
      normalizedScoreWeights.axis * calculateAxisUpperBound(currentPlacements)
    );
  }

  function retainTopSolution(
    placements: GridPlacement[],
    scores: ReturnType<typeof evaluateComposition>
  ) {
    const minColumn = Math.min(...placements.map((placement) => placement.column));
    const minRow = Math.min(...placements.map((placement) => placement.row));
    const topologySignature = placements
      .map((placement) => ({
        column: placement.column - minColumn,
        row: placement.row - minRow,
        columnSpan: placement.columnSpan,
        rowSpan: placement.rowSpan
      }))
      .sort((a, b) =>
        a.row - b.row ||
        a.column - b.column ||
        a.rowSpan - b.rowSpan ||
        a.columnSpan - b.columnSpan
      )
      .map((placement) =>
        `${placement.column},${placement.row},${placement.columnSpan},${placement.rowSpan}`
      )
      .join("|");
    const rightEdge = Math.max(...placements.map((placement) => placement.column + placement.columnSpan));
    const bottomEdge = Math.max(...placements.map((placement) => placement.row + placement.rowSpan));
    const boundingWidth = rightEdge - minColumn;
    const boundingHeight = bottomEdge - minRow;
    const spatialSpread = (boundingWidth * boundingHeight) / gridTotalArea;

    const sameTopologyIndex = topSolutionsList.findIndex(
      (solution) => solution.topologySignature === topologySignature
    );
    if (
      sameTopologyIndex >= 0 &&
      topSolutionsList[sameTopologyIndex].globalScore >= scores.globalScore
    ) return;

    const worstRetainedScore = topSolutionsList.length === topN
      ? topSolutionsList[topSolutionsList.length - 1].globalScore
      : -Infinity;

    if (scores.globalScore < worstRetainedScore - 1e-9) return;

    const sol: CompositionResult = {
      placements: [...placements],
      globalScore: scores.globalScore,
      shapeScore: scores.shapeScore,
      hierarchyScore: scores.hierarchyScore,
      alignmentScore: scores.alignmentScore,
      densityScore: scores.densityScore,
      proximityScore: scores.proximityScore,
      lecScore: scores.lecScore,
      axisScore: scores.axisScore,
      hasGroupProximity: scores.hasGroupProximity,
      nodesEvaluated: 0,
      feasibleCompositions: 0,
      prunedNodes: 0,
      topologySignature,
      spatialSpread
    };

    if (sameTopologyIndex >= 0) topSolutionsList.splice(sameTopologyIndex, 1);

    const insertionIndex = topSolutionsList.findIndex((existing) =>
      existing.globalScore < sol.globalScore - 1e-9 ||
      (Math.abs(existing.globalScore - sol.globalScore) <= 1e-9 &&
        (existing.spatialSpread ?? 0) < spatialSpread)
    );
    if (insertionIndex === -1) {
      topSolutionsList.push(sol);
    } else {
      topSolutionsList.splice(insertionIndex, 0, sol);
    }
    if (topSolutionsList.length > topN) topSolutionsList.pop();
  }

  function backtrack(
    depth: number,
    currentPlacements: GridPlacement[],
    currentOccupiedArea: number
  ) {
    nodesEvaluated++;

    if (hasReachedSearchBudget()) {
      searchTruncated = true;
      return;
    }

    // Leaf node: Complete valid non-overlapping composition
    if (depth === N) {
      feasibleCompositions++;
      const scores = evaluateComposition(
        currentPlacements,
        sortedElements,
        gridColumns,
        gridRows,
        parameters
      );

      retainTopSolution(currentPlacements, scores);
      return;
    }

    const freeArea = gridTotalArea - currentOccupiedArea;
    const minNeeded = minRemainingAreas[depth];
    if (minNeeded > freeArea) {
      prunedNodes++;
      return;
    }

    if (topSolutionsList.length === topN) {
      const worstRetainedScore = topSolutionsList[topSolutionsList.length - 1].globalScore;
      const optimisticScore = calculateGlobalScoreUpperBound(depth, currentPlacements);
      if (optimisticScore < worstRetainedScore - 1e-9) {
        prunedNodes++;
        return;
      }
    }

    const possiblePlacements = placementSets[depth];
    for (let pIdx = 0; pIdx < possiblePlacements.length; pIdx++) {
      if (searchTruncated) return;
      const candidate = possiblePlacements[pIdx];

      let overlapFound = false;
      for (let placedIdx = 0; placedIdx < currentPlacements.length; placedIdx++) {
        if (isOverlapping(candidate, currentPlacements[placedIdx])) {
          overlapFound = true;
          break;
        }
      }

      if (overlapFound) {
        prunedNodes++;
        continue;
      }

      // Recurse to next element
      currentPlacements.push(candidate);
      backtrack(
        depth + 1,
        currentPlacements,
        currentOccupiedArea + candidate.columnSpan * candidate.rowSpan
      );
      currentPlacements.pop();
    }
  }

  backtrack(0, [], 0);

  if (topSolutionsList.length === 0) return null;

  const best = topSolutionsList[0];
  return {
    ...best,
    nodesEvaluated,
    feasibleCompositions,
    prunedNodes,
    searchTruncated,
    topSolutions: topSolutionsList
  };
}

export function useGridElements(
  initialElements: GridElement[] = [
    {
      id: "elem-1",
      type: "text",
      name: "Headline Text",
      hierarchy: 100,
      visualPriority: "primary",
      targetAspectRatio: 2.0,
      groupId: "group-1",
      content: "SWISS GRAPHIC DESIGN",
      fontFamily: "Inter, sans-serif",
      fontWeight: 800,
      fontScale: 1,
      lineHeightRatio: 1.10,
      trackingEm: -0.02,
      textAlign: "left"
    },
    {
      id: "elem-2",
      type: "text",
      name: "Body Text",
      hierarchy: 50,
      visualPriority: "supporting",
      targetAspectRatio: 1.5,
      groupId: "group-1",
      content: "International Typographic Style emphasizes cleanliness, readability, and objectivity.",
      fontFamily: "Inter, sans-serif",
      fontWeight: 400,
      fontScale: 1,
      lineHeightRatio: 1.30,
      trackingEm: 0.00,
      textAlign: "left"
    },
    {
      id: "elem-3",
      type: "image",
      name: "Hero Image",
      hierarchy: 75,
      visualPriority: "secondary",
      targetAspectRatio: 1.0,
      groupId: "group-2",
      sourceWidth: 1200,
      sourceHeight: 800,
      imageFit: "cover",
      focalPointX: 0.5,
      focalPointY: 0.5
    }
  ],
  initialParameters: LayoutParameters = {
    hierarchyExponent: 2,
    contentDensity: 0.5,
    lambdaStep4Area: 0.6,
    lambdaStep4Ratio: 0.4,
    lambdaShape: 0.20,
    lambdaHierarchy: 0.15,
    lambdaAlignment: 0.15,
    lambdaDensity: 0.10,
    lambdaProximity: 0.15,
    lambdaLEC: 0.10,
    lambdaAxis: 0.15
  },
  gridColumns: number = 4,
  gridRows: number = 4,
  baselineGrid: BaselineGridParameters = { baselineUnit: 8, baselineOrigin: 40 },
  physicalGrid: PhysicalGridParameters = DEFAULT_PHYSICAL_GRID
) {
  const [elements, setElements] = useState<GridElement[]>(initialElements);
  const [parameters, setParameters] = useState<LayoutParameters>(initialParameters);
  const [selectedSolutionIndex, setSelectedSolutionIndex] = useState<number>(0);
  const [baselineParams, setBaselineParams] = useState<BaselineGridParameters>(baselineGrid);
  const [hierarchyContrast, setHierarchyContrast] = useState<HierarchyContrast>("balanced");

  const elementCount = elements.length;

  // Mathematical set notation expression: E = {E_1, E_2, ..., E_N}
  const setNotation = useMemo(() => {
    if (elements.length === 0) return "E = ∅";
    return `E = { ${elements.map((_, idx) => `E_${idx + 1}`).join(", ")} }`;
  }, [elements]);

  // Only layout-relevant fields feed the expensive solver. Typography edits
  // must not regenerate the structural placement search.
  const layoutElementSignature = useMemo(() => JSON.stringify(
    elements.map((elem) => ({
      id: elem.id,
      type: elem.type,
      hierarchy: elem.hierarchy,
      visualPriority: elem.visualPriority,
      targetAspectRatio: elem.targetAspectRatio,
      groupId: elem.groupId,
      sourceWidth: elem.type === "image" ? elem.sourceWidth : undefined,
      sourceHeight: elem.type === "image" ? elem.sourceHeight : undefined,
      imageFit: elem.type === "image" ? elem.imageFit : undefined
    }))
  ), [elements]);

  const layoutElements = useMemo<GridElement[]>(() => {
    const parsed = JSON.parse(layoutElementSignature) as Array<{
      id: string;
      type: ElementType;
      hierarchy: number;
      visualPriority?: VisualPriority;
      targetAspectRatio?: number;
      groupId?: string;
      sourceWidth?: number;
      sourceHeight?: number;
      imageFit?: ImageFitMode;
    }>;
    return parsed.map((elem) => elem.type === "text"
      ? { ...elem, name: elem.id, content: "" } as TextGridElement
      : { ...elem, name: elem.id } as ImageGridElement
    );
  }, [layoutElementSignature]);

  // Compute Step 2 elements with normalized hierarchy (ĥ_i) and relative visual weight (w_i)
  const elementsWithWeight = useMemo<GridElementWithWeight[]>(() => {
    return layoutElements.map((elem) => {
      const normalizedHierarchy = elem.hierarchy / 100;
      const visualWeight = calculateVisualWeight(elem.hierarchy, parameters);
      return {
        ...elem,
        normalizedHierarchy,
        visualWeight
      };
    });
  }, [layoutElements, parameters]);

  // Step 3 calculations: Total Weight W, Available Area A_available, and per-element Allocation (r_i, A_i)
  const totalWeight = useMemo(() => {
    return calculateTotalWeight(elementsWithWeight);
  }, [elementsWithWeight]);

  const availableArea = useMemo(() => {
    return calculateAvailableArea(gridColumns, gridRows, parameters.contentDensity);
  }, [gridColumns, gridRows, parameters.contentDensity]);

  // Physical cell dimensions are part of geometry selection: a 1×1 module is
  // not necessarily square on portrait, landscape, or asymmetric-margin canvases.
  const gridMetrics = useMemo<GridMetrics>(() => {
    return calculateGridMetrics(
      physicalGrid.canvasWidth,
      physicalGrid.canvasHeight,
      gridColumns,
      gridRows,
      physicalGrid.marginLeft,
      physicalGrid.marginTop,
      physicalGrid.columnGutter,
      physicalGrid.rowGutter,
      physicalGrid.marginRight,
      physicalGrid.marginBottom
    );
  }, [
    gridColumns,
    gridRows,
    physicalGrid.canvasWidth,
    physicalGrid.canvasHeight,
    physicalGrid.marginLeft,
    physicalGrid.marginRight,
    physicalGrid.marginTop,
    physicalGrid.marginBottom,
    physicalGrid.columnGutter,
    physicalGrid.rowGutter
  ]);

  const elementsWithAllocation = useMemo<GridElementWithAllocation[]>(() => {
    return elementsWithWeight.map((elem) => {
      const allocationRatio = calculateAllocationRatio(elem.visualWeight, totalWeight);
      const idealArea = calculateIdealArea(allocationRatio, availableArea);
      return {
        ...elem,
        allocationRatio,
        idealArea
      };
    });
  }, [elementsWithWeight, totalWeight, availableArea]);

  // Step 4 calculations: Ideal Geometry (w_i, h_i) & Candidate Geometries (G_i)
  const layoutElementsWithStep4 = useMemo<GridElementWithStep4[]>(() => {
    return elementsWithAllocation.map((elem) => {
      const targetRatio = elem.targetAspectRatio || 1.0;
      const idealGeometry = calculateIdealGeometry(elem.idealArea, targetRatio);
      const candidates = generateGeometryCandidates(
        elem.idealArea,
        targetRatio,
        gridColumns,
        gridRows,
        parameters,
        {
          gridMetrics,
          sourceAspectRatio: elem.type === "image"
            ? (elem.sourceWidth ?? 1200) / Math.max(1, elem.sourceHeight ?? 800)
            : undefined,
          imageFit: elem.type === "image" ? (elem.imageFit ?? "cover") : undefined
        }
      );
      return {
        ...elem,
        targetAspectRatio: targetRatio,
        idealGeometry,
        candidates
      };
    });
  }, [elementsWithAllocation, gridColumns, gridRows, parameters, gridMetrics]);

  const elementsWithStep4 = useMemo<GridElementWithStep4[]>(() => {
    const currentElementMap = new Map(elements.map((element) => [element.id, element]));
    return layoutElementsWithStep4.map((layoutElement) => ({
      ...layoutElement,
      ...currentElementMap.get(layoutElement.id)
    } as GridElementWithStep4));
  }, [layoutElementsWithStep4, elements]);

  // Step 5.2 Exact Layout Solver Result (Top 5 Solutions)
  const compositionMasterResult = useMemo<CompositionResult | null>(() => {
    return solveExactLayout(
      layoutElementsWithStep4,
      gridColumns,
      gridRows,
      parameters,
      5 // Top 5 solutions
    );
  }, [layoutElementsWithStep4, gridColumns, gridRows, parameters]);

  // Currently Selected Solution among Top 5
  const compositionSolution = useMemo<CompositionResult | null>(() => {
    if (!compositionMasterResult) return null;
    const topList = compositionMasterResult.topSolutions || [compositionMasterResult];
    const safeIdx = Math.min(selectedSolutionIndex, topList.length - 1);
    return {
      ...topList[safeIdx],
      nodesEvaluated: compositionMasterResult.nodesEvaluated,
      feasibleCompositions: compositionMasterResult.feasibleCompositions,
      prunedNodes: compositionMasterResult.prunedNodes,
      searchTruncated: compositionMasterResult.searchTruncated,
      topSolutions: topList
    };
  }, [compositionMasterResult, selectedSolutionIndex]);

  // Step 8.1 Physical Text Container Geometry Map
  const elementContainers = useMemo<ElementContainerGeometry[]>(() => {
    if (!compositionSolution) return [];
    return compositionSolution.placements.map((p) =>
      calculateElementContainerGeometry(p, gridMetrics)
    );
  }, [compositionSolution, gridMetrics]);

  // Step 9.3 Alignment Modes & Rag Dynamics Analysis Text Fitting Calculation
  const textFitResults = useMemo<TextFitResult[]>(() => {
    if (!compositionSolution) return [];
    const containerMap = new Map<string, ElementContainerGeometry>();
    elementContainers.forEach((c) => containerMap.set(c.elementId, c));

    return elements.filter((e): e is TextGridElement => e.type === "text").map((e) => {
      const container = containerMap.get(e.id);
      const B_i = container ? container.containerWidth : 300;
      const D_i = container ? container.containerHeight : 300;
      const Y_i = container ? container.containerTopY : 40;
      const k_i = e.lineHeightRatio || 1.20;
      const fw_i = e.fontWeight || 700;
      const tau_i = e.trackingEm || 0.00;
      const align_i = e.textAlign || "left";
      const fontScale_i = Math.min(1, Math.max(0.25, e.fontScale ?? 1));

      const autoFit = calculateOptimalFontSize(
        e.id,
        e.content || e.name,
        B_i,
        D_i,
        e.fontFamily || "Inter, sans-serif",
        fw_i,
        k_i,
        tau_i,
        align_i,
        12, // textPaddingInline
        Y_i,
        baselineParams
      );

      if (fontScale_i >= 0.999) return autoFit;

      return calculateOptimalFontSize(
        e.id,
        e.content || e.name,
        B_i,
        D_i,
        e.fontFamily || "Inter, sans-serif",
        fw_i,
        k_i,
        tau_i,
        align_i,
        12,
        Y_i,
        baselineParams,
        2,
        Math.max(2, autoFit.fontSize * fontScale_i)
      );
    });
  }, [compositionSolution, elementContainers, elements, baselineParams]);

  // Step 10.1 Image Fit & Crop Geometry Results Map
  const imageFitResults = useMemo<ImageFitResult[]>(() => {
    if (!compositionSolution) return [];
    const containerMap = new Map<string, ElementContainerGeometry>();
    elementContainers.forEach((c) => containerMap.set(c.elementId, c));

    return elements.filter((e): e is ImageGridElement => e.type === "image").map((e) => {
      const container = containerMap.get(e.id);
      const B_i = container ? container.containerWidth : 300;
      const D_i = container ? container.containerHeight : 300;
      const srcW = e.sourceWidth || 1200;
      const srcH = e.sourceHeight || 800;
      const fitMode = e.imageFit || "cover";
      const fx = e.focalPointX !== undefined ? e.focalPointX : 0.5;
      const fy = e.focalPointY !== undefined ? e.focalPointY : 0.5;

      return calculateImageFitGeometry(
        e.id,
        srcW,
        srcH,
        B_i,
        D_i,
        fitMode,
        fx,
        fy,
        1200,
        1600
      );
    });
  }, [compositionSolution, elementContainers, elements]);

  // Step 10.3 Cross-Modal Dominance Consistency Calculation (S_cross)
  const crossModalHierarchyResult = useMemo<CrossModalHierarchyResult>(() => {
    return calculateCrossModalDominanceConsistency(
      elementsWithWeight,
      textFitResults,
      imageFitResults,
      1200,
      1600,
      0.5
    );
  }, [elementsWithWeight, textFitResults, imageFitResults]);

  // Step 10.4 Image-Text Boundary Geometry Metrics Calculation
  const imageTextBoundaryMetrics = useMemo<ImageTextBoundaryMetrics[]>(() => {
    return calculateImageTextBoundaryMetrics(
      compositionSolution,
      elements,
      gridMetrics
    );
  }, [compositionSolution, elements, gridMetrics]);

  // Step 9.1 Typographic Hierarchy Consistency Calculation (S_TH with Pair Concordance C_ij)
  const typographicHierarchyInfo = useMemo(() => {
    return calculateTypographicHierarchyConsistency(textFitResults, elements);
  }, [textFitResults, elements]);

  // Add new element by type ("text" | "image")
  const addElement = useCallback((type: ElementType, customName?: string) => {
    const nextNum = elements.length + 1;
    const defaultName = type === "text" ? `Text ${nextNum}` : `Image ${nextNum}`;
    const defaultRatio = type === "text" ? 2.0 : 1.0;
    const defaultGroupId = type === "text" ? "group-1" : `group-${nextNum}`;

    let newElement: GridElement;
    if (type === "text") {
      newElement = {
        id: `elem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: "text",
        name: customName || defaultName,
        hierarchy: getHierarchyValue("supporting", hierarchyContrast),
        visualPriority: "supporting",
        targetAspectRatio: defaultRatio,
        groupId: defaultGroupId,
        content: "SAMPLE TEXT CONTENT",
        fontFamily: "Inter, sans-serif",
        fontWeight: 400,
        fontScale: 1,
        lineHeightRatio: 1.20,
        trackingEm: 0.00,
        textAlign: "left"
      };
    } else {
      newElement = {
        id: `elem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: "image",
        name: customName || defaultName,
        hierarchy: getHierarchyValue("supporting", hierarchyContrast),
        visualPriority: "supporting",
        targetAspectRatio: defaultRatio,
        groupId: defaultGroupId,
        sourceWidth: 1200,
        sourceHeight: 800,
        imageFit: "cover",
        focalPointX: 0.5,
        focalPointY: 0.5
      };
    }

    setElements((prev) => [...prev, newElement]);
    return newElement.id;
  }, [elements.length, hierarchyContrast]);

  // Apply one plain-language hierarchy contrast preset to every element.
  const applyHierarchyContrast = useCallback((contrast: HierarchyContrast) => {
    setHierarchyContrast(contrast);
    setElements((prev) =>
      prev.map((item) => {
        const visualPriority = item.visualPriority || inferVisualPriority(item.hierarchy);
        return {
          ...item,
          visualPriority,
          hierarchy: getHierarchyValue(visualPriority, contrast)
        } as GridElement;
      })
    );
  }, []);

  // Update specific element property
  const updateElement = useCallback((id: string, updates: Partial<GridElement>) => {
    setElements((prev) =>
      prev.map((item) => (item.id === id ? ({ ...item, ...updates } as GridElement) : item))
    );
  }, []);

  // Remove element by id
  const removeElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Update layout parameters
  const updateParameters = useCallback((updates: Partial<LayoutParameters>) => {
    setParameters((prev) => ({ ...prev, ...updates }));
  }, []);

  // Update baseline grid parameters
  const updateBaselineParams = useCallback((updates: Partial<BaselineGridParameters>) => {
    setBaselineParams((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    elements,
    elementsWithWeight,
    elementsWithAllocation,
    elementsWithStep4,
    compositionSolution,
    topSolutions: compositionMasterResult?.topSolutions || [],
    selectedSolutionIndex,
    setSelectedSolutionIndex,
    gridMetrics,
    elementContainers,
    textFitResults,
    imageFitResults,
    crossModalHierarchyResult,
    imageTextBoundaryMetrics,
    typographicHierarchyInfo,
    parameters,
    baselineParams,
    hierarchyContrast,
    totalWeight,
    availableArea,
    elementCount,
    setNotation,
    setElements,
    setParameters,
    updateParameters,
    updateBaselineParams,
    applyHierarchyContrast,
    addElement,
    updateElement,
    removeElement
  };
}
