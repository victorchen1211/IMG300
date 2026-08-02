// Shared Export Utilities

/**
 * Triggers a PNG download from a Canvas element
 */
export const exportCanvasToPNG = (
  canvas: HTMLCanvasElement | null,
  filenamePrefix: string = "export"
): void => {
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = `${filenamePrefix}-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

/**
 * Triggers an SVG string download as an .svg file Blob
 */
export const exportSVGString = (
  svgString: string,
  filenamePrefix: string = "export"
): void => {
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${filenamePrefix}-${Date.now()}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};
