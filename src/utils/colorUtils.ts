// Shared Color Utilities

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Parses hex color string (#ffffff or #fff) into RGB object
 */
export const hexToRgb = (hex: string): RGB => {
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
};

/**
 * Converts RGB values to Hex color string
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Blends base RGB with tint RGB given a tint blend ratio (0 to 1)
 */
export const blendRgb = (base: RGB, tint: RGB, ratio: number): RGB => {
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  return {
    r: Math.round(base.r * (1 - clampedRatio) + tint.r * clampedRatio),
    g: Math.round(base.g * (1 - clampedRatio) + tint.g * clampedRatio),
    b: Math.round(base.b * (1 - clampedRatio) + tint.b * clampedRatio)
  };
};
