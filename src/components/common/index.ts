export { ToggleSwitch } from "./ToggleSwitch";
export { ExportControls } from "./ExportControls";
export { CanvasSizeSelector } from "./CanvasSizeSelector";
export { TypographyControl } from "./TypographyControl";
export type { TextLayer, TextAlignMode } from "./TypographyControl";
export { RangeSliderControl } from "./RangeSliderControl";
export { ColorPickerControl } from "./ColorPickerControl";
export { AccordionSection } from "./AccordionSection";
export { BrikSliderControl } from "./BrikSliderControl";
export { BrikAccordionSection } from "./BrikAccordionSection";
export { CanvasViewport } from "./CanvasViewport";
export { LayerManagerControl } from "./LayerManagerControl";
export { useCanvasTextDrag } from "../../hooks/useCanvasTextDrag";
export { useLayerManager } from "../../hooks/useLayerManager";
export type { PosterLayer } from "../../hooks/useLayerManager";
export {
  useGridElements,
  calculateVisualWeight,
  calculateTotalWeight,
  calculateAvailableArea,
  calculateAllocationRatio,
  calculateIdealArea,
  calculateIdealGeometry,
  generateGeometryCandidates,
  isValidGridBoundary,
  isOverlapping,
  generatePlacementSet,
  evaluateComposition,
  solveExactLayout
} from "../../hooks/useGridElements";
export type {
  GridElement,
  ElementType,
  GridElementWithWeight,
  GridElementWithAllocation,
  GridElementWithStep4,
  IdealGeometry,
  GeometryCandidate,
  GridGeometry,
  GridPlacement,
  CompositionResult,
  LayoutParameters,
  VisualPriority,
  HierarchyContrast,
  TextFitResult
} from "../../hooks/useGridElements";
export { MaskControl } from "./MaskControl";
export { ShapeControl } from "./ShapeControl";
export { GridSystemControl } from "./GridSystemControl";
export { GridElementControl } from "./GridElementControl";
export { drawGridSystem, DEFAULT_GRID_SETTINGS, GRID_PRESETS } from "../../utils/gridUtils";
export type { GridSettings } from "../../utils/gridUtils";

// Image Upload Components & Aliases
export {
  SingleImageUploader,
  SingleImageUploader as ImageUploader,
  MosaicSubjectImageUploader,
  MultiImageControl,
  MultiImageControl as ImageControl
} from "../imageUpload";
