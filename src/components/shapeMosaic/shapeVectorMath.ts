// Shape Mosaic Vector Path & SVG Math Module

export type ShapeType =
  | "circle"
  | "ring"
  | "square"
  | "triangle"
  | "cross"
  | "x_cross"
  | "diamond"
  | "hexagon"
  | "star";

export interface ShapeOption {
  id: ShapeType;
  label: string;
}

export const SHAPE_OPTIONS: ShapeOption[] = [
  { id: "circle", label: "Circle" },
  { id: "ring", label: "Ring" },
  { id: "square", label: "Square" },
  { id: "triangle", label: "Triangle" },
  { id: "cross", label: "Cross (+)" },
  { id: "x_cross", label: "X-Cross (✕)" },
  { id: "diamond", label: "Diamond" },
  { id: "hexagon", label: "Hexagon" },
  { id: "star", label: "Star" }
];

/**
 * Draws specific geometric shape path via vector Canvas math
 */
export const drawShapePath = (
  ctx: CanvasRenderingContext2D,
  shape: ShapeType,
  cx: number,
  cy: number,
  size: number,
  fillColor: string
): void => {
  const r = size / 2;

  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (shape === "ring") {
    ctx.arc(cx, cy, r, 0, Math.PI * 2, false);
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2, true);
  } else if (shape === "square") {
    ctx.rect(cx - r, cy - r, size, size);
  } else if (shape === "triangle") {
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy + r);
    ctx.lineTo(cx - r, cy + r);
    ctx.closePath();
  } else if (shape === "cross") {
    const arm = Math.max(1.5, size / 5.5);
    ctx.rect(cx - arm / 2, cy - r, arm, size);
    ctx.rect(cx - r, cy - arm / 2, size, arm);
  } else if (shape === "x_cross") {
    const arm = Math.max(1.5, size / 5.5);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.rect(-arm / 2, -r, arm, size);
    ctx.rect(-r, -arm / 2, size, arm);
    ctx.fill();
    ctx.restore();
    return;
  } else if (shape === "diamond") {
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
  } else if (shape === "hexagon") {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  } else if (shape === "star") {
    const points = 5;
    const innerR = r * 0.4;
    for (let i = 0; i < points * 2; i++) {
      const currentR = i % 2 === 0 ? r : innerR;
      const angle = (Math.PI / points) * i - Math.PI / 2;
      const x = cx + currentR * Math.cos(angle);
      const y = cy + currentR * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
};

/**
 * Builds SVG element XML string for vector export
 */
export const buildSVGShapeElement = (
  shape: ShapeType,
  cx: number,
  cy: number,
  size: number,
  fill: string
): string => {
  const r = size / 2;

  if (shape === "circle") {
    return `  <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" />\n`;
  } else if (shape === "ring") {
    return `  <path d="M ${cx.toFixed(1)} ${(cy - r).toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${cx.toFixed(1)} ${(cy + r).toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${cx.toFixed(1)} ${(cy - r).toFixed(1)} Z M ${cx.toFixed(1)} ${(cy - r * 0.45).toFixed(1)} A ${(r * 0.45).toFixed(1)} ${(r * 0.45).toFixed(1)} 0 1 1 ${cx.toFixed(1)} ${(cy + r * 0.45).toFixed(1)} A ${(r * 0.45).toFixed(1)} ${(r * 0.45).toFixed(1)} 0 1 1 ${cx.toFixed(1)} ${(cy - r * 0.45).toFixed(1)} Z" fill="${fill}" fill-rule="evenodd" />\n`;
  } else if (shape === "square") {
    return `  <rect x="${(cx - r).toFixed(1)}" y="${(cy - r).toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" fill="${fill}" />\n`;
  } else if (shape === "cross") {
    const arm = Math.max(1.5, size / 5.5);
    const halfArm = arm / 2;
    return `  <g fill="${fill}"><rect x="${(cx - halfArm).toFixed(1)}" y="${(cy - r).toFixed(1)}" width="${arm.toFixed(1)}" height="${size.toFixed(1)}" /><rect x="${(cx - r).toFixed(1)}" y="${(cy - halfArm).toFixed(1)}" width="${size.toFixed(1)}" height="${arm.toFixed(1)}" /></g>\n`;
  } else if (shape === "x_cross") {
    const arm = Math.max(1.5, size / 5.5);
    const halfArm = arm / 2;
    return `  <g fill="${fill}" transform="rotate(45 ${cx.toFixed(1)} ${cy.toFixed(1)})"><rect x="${(cx - halfArm).toFixed(1)}" y="${(cy - r).toFixed(1)}" width="${arm.toFixed(1)}" height="${size.toFixed(1)}" /><rect x="${(cx - r).toFixed(1)}" y="${(cy - halfArm).toFixed(1)}" width="${size.toFixed(1)}" height="${arm.toFixed(1)}" /></g>\n`;
  } else {
    return `  <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" />\n`;
  }
};
