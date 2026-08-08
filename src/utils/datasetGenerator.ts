import {
  GridElement,
  GridElementWithStep4,
  CompositionResult,
  LayoutParameters,
  BaselineGridParameters,
  GridMetrics,
  calculateGridMetrics,
  calculateVisualWeight,
  calculateIdealArea,
  calculateIdealGeometry,
  generateGeometryCandidates,
  solveExactLayout,
  calculateOptimalFontSize,
  calculateImageFitGeometry,
  calculateCrossModalDominanceConsistency,
  calculateTypographicHierarchyConsistency,
  calculateImageTextBoundaryMetrics,
  TextFitResult,
  ImageFitResult
} from "../hooks/useGridElements";

export interface CompositionFeatureVector {
  compositionId: string;
  scenarioName: string;
  elementCount: number;
  textCount: number;
  imageCount: number;
  gridColumns: number;
  gridRows: number;

  // Primary Soft Scores
  globalScore: number;            // S_global
  shapeScore: number;             // S_S
  hierarchyScore: number;         // S_H
  alignmentScore: number;         // S_A
  densityScore: number;           // S_D
  proximityScore: number;         // S_P
  whitespaceConnectivity: number; // S_LEC
  axisStrength: number;           // S_axis

  // Typography & Cross-Modal Measurements
  typographicHierarchy: number;   // S_TH
  crossModalConsistency: number;  // S_cross
  tvDistance: number;             // D_TV

  // Image-Text Boundary Measurements
  sharedBoundaryLengthPx: number; // L_shared (px)
  sharedBoundaryRatio: number;    // L_shared / TotalPerimeter
  hasVerticalSpine: boolean;
  hasHorizontalSpine: boolean;
  minImageTextModuleGap: number;  // d_module
  minImageTextPixelGap: number;   // G_px

  // Physical Grid Spacing Rhythm Decomposition G_px = n_m * u + n_g * g
  gridRhythmDecomposition: {
    nM: number;                   // Module count n_m
    nG: number;                   // Gutter count n_g
    exactGridMatch: boolean;      // G_px == n_m * u + n_g * g
  };

  // Solver Metrics
  nodesEvaluated: number;
  feasibleCompositions: number;
}

export interface DatasetGenerationOptions {
  batchSize?: number;             // Number of scenarios to generate (default 50)
  topKPerScenario?: number;       // Top-K solutions collected per scenario (default 3)
  gridColumns?: number;
  gridRows?: number;
  parameters?: LayoutParameters;
  baselineGrid?: BaselineGridParameters;
}

export interface DatasetResult {
  dataset: CompositionFeatureVector[];
  scenarioCount: number;
  totalCompositions: number;
  generatedAt: string;
}

// Preset Element Composition Scenarios (Diverse Text + Image Combinations)
const SCENARIO_TEMPLATES = [
  {
    name: "2 Text Elements",
    elements: [
      { id: "e1", type: "text", name: "Headline", hierarchy: 90, targetAspectRatio: 2.0, content: "SWISS STYLE" },
      { id: "e2", type: "text", name: "Body", hierarchy: 50, targetAspectRatio: 1.5, content: "Grid systems provide clarity." }
    ]
  },
  {
    name: "3 Text Elements",
    elements: [
      { id: "e1", type: "text", name: "Title", hierarchy: 95, targetAspectRatio: 2.5, content: "BAUHAUS 1919" },
      { id: "e2", type: "text", name: "Subtitle", hierarchy: 70, targetAspectRatio: 2.0, content: "Form Follows Function" },
      { id: "e3", type: "text", name: "Caption", hierarchy: 40, targetAspectRatio: 1.5, content: "Dessau, Germany." }
    ]
  },
  {
    name: "1 Text + 1 Image",
    elements: [
      { id: "e1", type: "text", name: "Headline", hierarchy: 90, targetAspectRatio: 2.0, content: "MODERN ARCHITECTURE" },
      { id: "e2", type: "image", name: "Photo", hierarchy: 80, targetAspectRatio: 1.0, sourceWidth: 1200, sourceHeight: 800 }
    ]
  },
  {
    name: "2 Text + 1 Image (Standard Swiss Poster)",
    elements: [
      { id: "e1", type: "text", name: "Headline", hierarchy: 90, targetAspectRatio: 2.0, content: "TYPOGRAPHY 2026", groupId: "g1" },
      { id: "e2", type: "text", name: "Body", hierarchy: 50, targetAspectRatio: 1.5, content: "Objective graphic design.", groupId: "g1" },
      { id: "e3", type: "image", name: "Hero Photo", hierarchy: 85, targetAspectRatio: 1.0, sourceWidth: 1200, sourceHeight: 800, groupId: "g2" }
    ]
  },
  {
    name: "2 Text + 2 Images",
    elements: [
      { id: "e1", type: "text", name: "Headline", hierarchy: 90, targetAspectRatio: 2.5, content: "EXHIBITION 2026" },
      { id: "e2", type: "text", name: "Details", hierarchy: 50, targetAspectRatio: 1.5, content: "Kunsthalle Zurich" },
      { id: "e3", type: "image", name: "Image A", hierarchy: 75, targetAspectRatio: 1.0, sourceWidth: 800, sourceHeight: 800 },
      { id: "e4", type: "image", name: "Image B", hierarchy: 65, targetAspectRatio: 1.0, sourceWidth: 800, sourceHeight: 800 }
    ]
  },
  {
    name: "3 Text + 1 Image",
    elements: [
      { id: "e1", type: "text", name: "Main Title", hierarchy: 95, targetAspectRatio: 2.5, content: "INTERNATIONAL STYLE" },
      { id: "e2", type: "text", name: "Subtitle", hierarchy: 70, targetAspectRatio: 2.0, content: "Visual Communication" },
      { id: "e3", type: "text", name: "Footer Info", hierarchy: 40, targetAspectRatio: 1.8, content: "Muller-Brockmann Design" },
      { id: "e4", type: "image", name: "Poster Feature", hierarchy: 80, targetAspectRatio: 1.2, sourceWidth: 1200, sourceHeight: 1000 }
    ]
  }
];

const DEFAULT_PARAMS: LayoutParameters = {
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
};

const DEFAULT_BASELINE: BaselineGridParameters = {
  baselineUnit: 8,
  baselineOrigin: 40
};

export function extractFeatureVectorFromComposition(
  sol: CompositionResult,
  elements: GridElement[],
  scenarioName: string,
  gridColumns: number,
  gridRows: number,
  parameters: LayoutParameters = DEFAULT_PARAMS,
  baselineGrid: BaselineGridParameters = DEFAULT_BASELINE
): CompositionFeatureVector {
  const gridMetrics = calculateGridMetrics(1200, 1600, gridColumns, gridRows, 40, 40, 20, 20);
  const elementsWithWeight = elements.map((e) => ({
    ...e,
    normalizedHierarchy: e.hierarchy / 100,
    visualWeight: calculateVisualWeight(e.hierarchy, parameters)
  }));

  const textElements = elements.filter((e): e is any => e.type === "text");
  const imageElements = elements.filter((e): e is any => e.type === "image");

  // Container Geometries map
  const placementMap = new Map();
  sol.placements.forEach((p) => placementMap.set(p.elementId, p));

  // Compute Text & Image Fit Results for Measurements
  const textFitResults: TextFitResult[] = textElements.map((t) => {
    const p = placementMap.get(t.id);
    const B_i = p ? p.columnSpan * gridMetrics.columnWidth + (p.columnSpan - 1) * gridMetrics.columnGutter : 300;
    const D_i = p ? p.rowSpan * gridMetrics.rowHeight + (p.rowSpan - 1) * gridMetrics.rowGutter : 300;
    const Y_i = p ? gridMetrics.marginY + (p.row - 1) * (gridMetrics.rowHeight + gridMetrics.rowGutter) : 40;
    return calculateOptimalFontSize(t.id, t.content || t.name, B_i, D_i, "Inter, sans-serif", t.fontWeight || 700, 1.2, 0, "left", 12, Y_i, baselineGrid);
  });

  const imageFitResults: ImageFitResult[] = imageElements.map((img) => {
    const p = placementMap.get(img.id);
    const B_i = p ? p.columnSpan * gridMetrics.columnWidth + (p.columnSpan - 1) * gridMetrics.columnGutter : 300;
    const D_i = p ? p.rowSpan * gridMetrics.rowHeight + (p.rowSpan - 1) * gridMetrics.rowGutter : 300;
    return calculateImageFitGeometry(img.id, img.sourceWidth || 1200, img.sourceHeight || 800, B_i, D_i, "cover", 0.5, 0.5, 1200, 1600);
  });

  // Step 9.1 S_TH
  const typographicHierarchy = calculateTypographicHierarchyConsistency(textFitResults, elements).consistencyScore;

  // Step 10.3 S_cross
  const crossModalRes = calculateCrossModalDominanceConsistency(elementsWithWeight, textFitResults, imageFitResults, 1200, 1600, 0.5);

  // Step 10.4 Boundary Metrics
  const boundaryMetrics = calculateImageTextBoundaryMetrics(sol, elements, gridMetrics);

  let sharedBoundaryLengthPx = 0;
  let hasVerticalSpine = false;
  let hasHorizontalSpine = false;
  let minModuleGap = 99;
  let minPixelGap = 9999;
  let sampleGapPx = 0;

  if (boundaryMetrics.length > 0) {
    boundaryMetrics.forEach((bm) => {
      sharedBoundaryLengthPx += bm.sharedBoundaryLengthPx;
      if (bm.opposingVerticalAxis && bm.sharedBoundaryLengthPx > 0) hasVerticalSpine = true;
      if (bm.opposingHorizontalAxis && bm.sharedBoundaryLengthPx > 0) hasHorizontalSpine = true;

      minModuleGap = Math.min(minModuleGap, bm.gridModuleDistance);
      minPixelGap = Math.min(minPixelGap, bm.physicalPixelDistance);
      sampleGapPx = bm.horizontalPixelGap > 0 ? bm.horizontalPixelGap : bm.verticalPixelGap;
    });
  } else {
    minModuleGap = 0;
    minPixelGap = 0;
  }

  // Calculate Shared Boundary Ratio L_shared / TotalPerimeter
  const totalPerimeter = sol.placements.reduce((sum, p) => {
    const wPx = p.columnSpan * gridMetrics.columnWidth + (p.columnSpan - 1) * gridMetrics.columnGutter;
    const hPx = p.rowSpan * gridMetrics.rowHeight + (p.rowSpan - 1) * gridMetrics.rowGutter;
    return sum + 2 * (wPx + hPx);
  }, 0);

  const sharedBoundaryRatio = totalPerimeter > 0 ? Math.round((sharedBoundaryLengthPx / totalPerimeter) * 1000) / 1000 : 0;

  // Physical Grid Spacing Rhythm Decomposition G_px = n_m * u + n_g * g
  const u_w = gridMetrics.columnWidth; // 265px
  const g_x = gridMetrics.columnGutter; // 20px

  let nM = 0, nG = 0, exactGridMatch = false;
  if (sampleGapPx > 0) {
    nM = Math.floor(sampleGapPx / (u_w + g_x));
    const remainderPx = sampleGapPx - nM * (u_w + g_x);
    nG = Math.round(remainderPx / g_x);
    const reconstructedPx = nM * u_w + (nM + nG) * g_x;
    exactGridMatch = Math.abs(reconstructedPx - sampleGapPx) < 2;
  } else {
    exactGridMatch = true;
  }

  return {
    compositionId: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    scenarioName,
    elementCount: elements.length,
    textCount: textElements.length,
    imageCount: imageElements.length,
    gridColumns,
    gridRows,
    globalScore: Math.round(sol.globalScore * 1000) / 1000,
    shapeScore: Math.round(sol.shapeScore * 1000) / 1000,
    hierarchyScore: Math.round(sol.hierarchyScore * 1000) / 1000,
    alignmentScore: Math.round(sol.alignmentScore * 1000) / 1000,
    densityScore: Math.round(sol.densityScore * 1000) / 1000,
    proximityScore: Math.round(sol.proximityScore * 1000) / 1000,
    whitespaceConnectivity: Math.round((sol.lecScore || 1.0) * 1000) / 1000,
    axisStrength: Math.round((sol.axisScore || 1.0) * 1000) / 1000,
    typographicHierarchy: Math.round(typographicHierarchy * 1000) / 1000,
    crossModalConsistency: crossModalRes.sCross,
    tvDistance: crossModalRes.tvDistance,
    sharedBoundaryLengthPx,
    sharedBoundaryRatio,
    hasVerticalSpine,
    hasHorizontalSpine,
    minImageTextModuleGap: minModuleGap === 99 ? 0 : minModuleGap,
    minImageTextPixelGap: minPixelGap === 9999 ? 0 : minPixelGap,
    gridRhythmDecomposition: {
      nM,
      nG,
      exactGridMatch
    },
    nodesEvaluated: sol.nodesEvaluated,
    feasibleCompositions: sol.feasibleCompositions
  };
}

export function generateCompositionDataset(
  options: DatasetGenerationOptions = {}
): DatasetResult {
  const {
    batchSize = 50,
    topKPerScenario = 3,
    gridColumns = 4,
    gridRows = 4,
    parameters = DEFAULT_PARAMS,
    baselineGrid = DEFAULT_BASELINE
  } = options;

  const dataset: CompositionFeatureVector[] = [];
  let scenarioCount = 0;

  for (let i = 0; i < batchSize; i++) {
    // Select scenario template
    const template = SCENARIO_TEMPLATES[i % SCENARIO_TEMPLATES.length];
    scenarioCount++;

    // Randomize elements slightly for dataset diversity
    const elements: GridElement[] = template.elements.map((e, idx) => {
      const hNoise = Math.floor((Math.random() - 0.5) * 10);
      const safeH = Math.min(100, Math.max(20, e.hierarchy + hNoise));
      return {
        ...e,
        hierarchy: safeH
      } as GridElement;
    });

    const totalWeight = elements.reduce((sum, e) => sum + calculateVisualWeight(e.hierarchy, parameters), 0);
    const totalGridArea = gridColumns * gridRows;
    const availableArea = totalGridArea * parameters.contentDensity;
    const candidateGridMetrics = calculateGridMetrics(
      1200,
      1600,
      gridColumns,
      gridRows,
      40,
      40,
      20,
      20
    );

    const elementsWithStep4: GridElementWithStep4[] = elements.map((e) => {
      const vWeight = calculateVisualWeight(e.hierarchy, parameters);
      const allocRatio = totalWeight > 0 ? vWeight / totalWeight : 1 / elements.length;
      const idealArea = allocRatio * availableArea;
      const r_i = e.targetAspectRatio || 1.0;
      const idealGeometry = calculateIdealGeometry(idealArea, r_i);
      const candidates = generateGeometryCandidates(
        idealArea,
        r_i,
        gridColumns,
        gridRows,
        parameters,
        {
          gridMetrics: candidateGridMetrics,
          sourceAspectRatio: e.type === "image"
            ? (e.sourceWidth ?? 1200) / Math.max(1, e.sourceHeight ?? 800)
            : undefined,
          imageFit: e.type === "image" ? (e.imageFit ?? "cover") : undefined
        }
      );

      return {
        ...e,
        normalizedHierarchy: e.hierarchy / 100,
        visualWeight: vWeight,
        allocationRatio: allocRatio,
        idealArea,
        idealGeometry,
        candidates
      };
    });

    const masterSol = solveExactLayout(elementsWithStep4, gridColumns, gridRows, parameters, topKPerScenario);

    if (masterSol && masterSol.topSolutions) {
      masterSol.topSolutions.forEach((sol) => {
        const featureVec = extractFeatureVectorFromComposition(
          sol,
          elements,
          template.name,
          gridColumns,
          gridRows,
          parameters,
          baselineGrid
        );
        dataset.push(featureVec);
      });
    }
  }

  return {
    dataset,
    scenarioCount,
    totalCompositions: dataset.length,
    generatedAt: new Date().toISOString()
  };
}
