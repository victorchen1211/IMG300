// Shared Background Filter Utilities

export interface PixelSample {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Checks if pixel sample should be filtered out (alpha transparent or neutral grey/white checkerboard)
 */
export const isBackgroundPixel = (
  pixel: PixelSample,
  threshold: number = 170
): boolean => {
  // Check alpha transparency
  if (pixel.a < 30) return true;

  // Check neutral grey/white checkerboard pattern
  const isMonochrome =
    Math.abs(pixel.r - pixel.g) < 18 &&
    Math.abs(pixel.g - pixel.b) < 18 &&
    Math.abs(pixel.r - pixel.b) < 18;

  const avgBrightness = (pixel.r + pixel.g + pixel.b) / 3;

  return isMonochrome && avgBrightness >= threshold;
};
