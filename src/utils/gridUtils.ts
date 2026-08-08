export interface GridSettings {
  enabled: boolean;
  preset: string;

  // 1. Margin
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  showMargins: boolean;
  marginFill: boolean;

  // 2. Column
  columns: number;
  showColumns: boolean;

  // 3. Row
  rows: number;
  showRows: boolean;

  // 4. Module
  showModules: boolean;
  showModuleLabels: boolean;
  moduleFill: boolean;

  // 5. Gutter
  columnGutter: number;
  rowGutter: number;
  showGutters: boolean;
  gutterFill: boolean;

  // Appearance & Export
  color: string;
  opacity: number;
  includeInExport: boolean;
}

export const DEFAULT_GRID_SETTINGS: GridSettings = {
  enabled: true,
  preset: "4×4 Square",
  marginTop: 50,
  marginBottom: 50,
  marginLeft: 50,
  marginRight: 50,
  showMargins: true,
  marginFill: true,
  columns: 4,
  showColumns: true,
  rows: 4,
  showRows: true,
  showModules: true,
  showModuleLabels: true,
  moduleFill: false,
  columnGutter: 16,
  rowGutter: 16,
  showGutters: true,
  gutterFill: false,
  color: "#ff3b30",
  opacity: 0.75,
  includeInExport: false
};

export interface GridPreset {
  name: string;
  columns: number;
  rows: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  columnGutter: number;
  rowGutter: number;
}

export const GRID_PRESETS: GridPreset[] = [
  {
    name: "6×8 Poster",
    columns: 6,
    rows: 8,
    marginTop: 60,
    marginBottom: 60,
    marginLeft: 40,
    marginRight: 40,
    columnGutter: 16,
    rowGutter: 16
  },
  {
    name: "12×16 Swiss",
    columns: 12,
    rows: 16,
    marginTop: 48,
    marginBottom: 48,
    marginLeft: 36,
    marginRight: 36,
    columnGutter: 12,
    rowGutter: 12
  },
  {
    name: "3×4 Minimal",
    columns: 3,
    rows: 4,
    marginTop: 80,
    marginBottom: 80,
    marginLeft: 60,
    marginRight: 60,
    columnGutter: 24,
    rowGutter: 24
  },
  {
    name: "4×4 Square",
    columns: 4,
    rows: 4,
    marginTop: 50,
    marginBottom: 50,
    marginLeft: 50,
    marginRight: 50,
    columnGutter: 20,
    rowGutter: 20
  },
  {
    name: "8×12 Editorial",
    columns: 8,
    rows: 12,
    marginTop: 44,
    marginBottom: 44,
    marginLeft: 44,
    marginRight: 44,
    columnGutter: 14,
    rowGutter: 14
  }
];

/**
 * Draws Josef Müller-Brockmann styled modular grid system onto a 2D canvas context.
 */
export function drawGridSystem(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: GridSettings
) {
  if (!settings.enabled) return;

  const {
    color,
    opacity,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    columns,
    rows,
    columnGutter,
    rowGutter,
    showMargins,
    marginFill,
    showColumns,
    showRows,
    showModules,
    showModuleLabels,
    moduleFill,
    showGutters,
    gutterFill
  } = settings;

  const usableW = width - marginLeft - marginRight;
  const usableH = height - marginTop - marginBottom;

  if (usableW <= 0 || usableH <= 0) return;

  const safeCols = Math.max(1, columns);
  const safeRows = Math.max(1, rows);

  const totalColGutter = (safeCols - 1) * columnGutter;
  const totalRowGutter = (safeRows - 1) * rowGutter;

  const moduleW = Math.max(1, (usableW - totalColGutter) / safeCols);
  const moduleH = Math.max(1, (usableH - totalRowGutter) / safeRows);

  ctx.save();
  ctx.globalAlpha = Math.max(0.05, Math.min(1, opacity));

  // Convert hex color to rgba helper
  const hexToRgba = (hexStr: string, a: number) => {
    let hex = hexStr.replace("#", "");
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    const num = parseInt(hex, 16);
    if (isNaN(num)) return `rgba(255, 59, 48, ${a})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  const primaryRgba = hexToRgba(color, 1.0);
  const marginTintRgba = "rgba(255, 182, 193, 0.4)"; // Soft light pink fill for protected margin area
  const gutterTintRgba = hexToRgba(color, 0.16);
  const moduleFillRgba = hexToRgba(color, 0.05);

  // 1. MARGIN DRAWING (Light pink fill for protected margin area)
  if (showMargins) {
    if (marginFill !== false) {
      ctx.fillStyle = marginTintRgba;
      if (marginTop > 0) ctx.fillRect(0, 0, width, marginTop);
      if (marginBottom > 0) ctx.fillRect(0, height - marginBottom, width, marginBottom);
      if (marginLeft > 0) ctx.fillRect(0, marginTop, marginLeft, usableH);
      if (marginRight > 0) ctx.fillRect(width - marginRight, marginTop, marginRight, usableH);
    }

    // Outer margin bounding rectangle (red dashed line)
    ctx.strokeStyle = primaryRgba;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(marginLeft, marginTop, usableW, usableH);
    ctx.setLineDash([]);

    // Margin corner label
    ctx.fillStyle = primaryRgba;
    ctx.font = '700 10px "SF Mono", "Menlo", monospace';
    ctx.fillText(`MARGIN: T${marginTop} B${marginBottom} L${marginLeft} R${marginRight}`, marginLeft + 4, marginTop - 6);
  }

  // 5. GUTTER DRAWING (Only red line boundaries, no pink fill by default)
  if (showGutters) {
    if (gutterFill) {
      ctx.fillStyle = gutterTintRgba;
      // Column Gutters
      if (columnGutter > 0 && safeCols > 1) {
        for (let c = 0; c < safeCols - 1; c++) {
          const gx = marginLeft + (c + 1) * moduleW + c * columnGutter;
          ctx.fillRect(gx, marginTop, columnGutter, usableH);
        }
      }
      // Row Gutters
      if (rowGutter > 0 && safeRows > 1) {
        for (let r = 0; r < safeRows - 1; r++) {
          const gy = marginTop + (r + 1) * moduleH + r * rowGutter;
          ctx.fillRect(marginLeft, gy, usableW, rowGutter);
        }
      }
    } else {
      // Clean red line boundaries for gutters
      ctx.strokeStyle = primaryRgba;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Column Gutters boundary lines
      if (columnGutter > 0 && safeCols > 1) {
        for (let c = 0; c < safeCols - 1; c++) {
          const gx = marginLeft + (c + 1) * moduleW + c * columnGutter;
          ctx.beginPath();
          ctx.moveTo(gx, marginTop);
          ctx.lineTo(gx, marginTop + usableH);
          ctx.moveTo(gx + columnGutter, marginTop);
          ctx.lineTo(gx + columnGutter, marginTop + usableH);
          ctx.stroke();
        }
      }

      // Row Gutters boundary lines
      if (rowGutter > 0 && safeRows > 1) {
        for (let r = 0; r < safeRows - 1; r++) {
          const gy = marginTop + (r + 1) * moduleH + r * rowGutter;
          ctx.beginPath();
          ctx.moveTo(marginLeft, gy);
          ctx.lineTo(marginLeft + usableW, gy);
          ctx.moveTo(marginLeft, gy + rowGutter);
          ctx.lineTo(marginLeft, gy + rowGutter);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }
  }

  // 2. COLUMN DRAWING
  if (showColumns) {
    ctx.strokeStyle = primaryRgba;
    ctx.lineWidth = 1;

    for (let c = 0; c < safeCols; c++) {
      const cx = marginLeft + c * (moduleW + columnGutter);
      // Column left boundary line
      ctx.beginPath();
      ctx.moveTo(cx, marginTop);
      ctx.lineTo(cx, marginTop + usableH);
      ctx.stroke();

      // Column right boundary line
      ctx.beginPath();
      ctx.moveTo(cx + moduleW, marginTop);
      ctx.lineTo(cx + moduleW, marginTop + usableH);
      ctx.stroke();
    }
  }

  // 3. ROW DRAWING
  if (showRows) {
    ctx.strokeStyle = primaryRgba;
    ctx.lineWidth = 1;

    for (let r = 0; r < safeRows; r++) {
      const ry = marginTop + r * (moduleH + rowGutter);
      // Row top boundary line
      ctx.beginPath();
      ctx.moveTo(marginLeft, ry);
      ctx.lineTo(marginLeft + usableW, ry);
      ctx.stroke();

      // Row bottom boundary line
      ctx.beginPath();
      ctx.moveTo(marginLeft, ry + moduleH);
      ctx.lineTo(marginLeft + usableW, ry + moduleH);
      ctx.stroke();
    }
  }

  // 4. MODULE DRAWING
  for (let c = 0; c < safeCols; c++) {
    for (let r = 0; r < safeRows; r++) {
      const mx = marginLeft + c * (moduleW + columnGutter);
      const my = marginTop + r * (moduleH + rowGutter);

      if (showModules) {
        ctx.strokeStyle = primaryRgba;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(mx, my, moduleW, moduleH);

        if (moduleFill) {
          ctx.fillStyle = moduleFillRgba;
          ctx.fillRect(mx, my, moduleW, moduleH);
        }
      }

      if (showModuleLabels) {
        ctx.fillStyle = primaryRgba;
        const fontSize = Math.max(9, Math.min(12, Math.floor(moduleH * 0.18)));
        ctx.font = `700 ${fontSize}px "SF Mono", "Menlo", monospace`;
        const colLetter = String.fromCharCode(65 + (c % 26));
        const labelText = safeCols > 26 ? `M${c + 1}-${r + 1}` : `${colLetter}${r + 1}`;
        ctx.fillText(labelText, mx + 5, my + fontSize + 4);
      }
    }
  }

  ctx.restore();
}
