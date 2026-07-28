export interface DimensionPreset {
  w: number;
  h: number;
}

export interface ColorPalette {
  name: string;
  bg: string;
  stroke: string;
  detail: string;
  dim?: string;
}

export const EXPORT_SIZES: Record<string, DimensionPreset> = {
  "Portrait 3:4 (1200x1600)": { w: 1200, h: 1600 },
  "Instagram Post (1080x1080)": { w: 1080, h: 1080 },
  "Instagram Story (1080x1920)": { w: 1080, h: 1920 },
  "Website Hero (1920x1080)": { w: 1920, h: 1080 },
  "LinkedIn Post (1200x627)": { w: 1200, h: 627 },
  "Deck Slide (1920x1080)": { w: 1920, h: 1080 },
  "Poster (1400x2000)": { w: 1400, h: 2000 }
};

export const COLOR_PALETTES: Record<string, ColorPalette> = {
  whiteOnDark: {
    bg: "#0a0a0a",
    stroke: "#d8d8d8",
    detail: "#555555",
    dim: "#2a2a2a",
    name: "White / Dark"
  },
  blackOnLight: {
    bg: "#f0eeea",
    stroke: "#111111",
    detail: "#aaaaaa",
    dim: "#d8d5d0",
    name: "Black / Light"
  },
  goldOnDark: {
    bg: "#111110",
    stroke: "#c9a84c",
    detail: "#5a5540",
    dim: "#252520",
    name: "Gold / Dark"
  },
  greenOnDark: {
    bg: "#080a08",
    stroke: "#44cc66",
    detail: "#1a4a2a",
    dim: "#0f1a0f",
    name: "Green / Dark"
  },
  coolDark: {
    bg: "#0a0a12",
    stroke: "#b0b0c0",
    detail: "#3a3a50",
    dim: "#1a1a28",
    name: "Cool / Dark"
  },
  warmGrey: {
    bg: "#1a1816",
    stroke: "#c8c0b0",
    detail: "#5a5448",
    dim: "#2a2620",
    name: "Warm / Dark"
  }
};

// Helper to generate elegant high-resolution abstract vector SVG data URLs for background presets
function createAbstractSvg(variant: number): string {
  const width = 800;
  const height = 1000;
  let elements = "";
  
  if (variant % 3 === 0) {
    elements = `
      <circle cx="400" cy="500" r="300" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.3"/>
      <circle cx="400" cy="500" r="200" fill="none" stroke="#ffffff" stroke-dasharray="12 12" stroke-width="2" opacity="0.4"/>
      <path d="M 100 200 Q 400 800 700 200" fill="none" stroke="#888888" stroke-width="4" opacity="0.5"/>
      <rect x="250" y="350" width="300" height="300" fill="none" stroke="#aaaaaa" stroke-width="1.5" transform="rotate(45 400 500)" opacity="0.35"/>
    `;
  } else if (variant % 3 === 1) {
    elements = `
      <line x1="100" y1="100" x2="700" y2="900" stroke="#ffffff" stroke-width="2" opacity="0.4"/>
      <line x1="700" y1="100" x2="100" y2="900" stroke="#ffffff" stroke-width="2" opacity="0.4"/>
      <circle cx="400" cy="500" r="350" fill="none" stroke="#cccccc" stroke-width="1" stroke-dasharray="8 8" opacity="0.5"/>
      <polygon points="400,200 650,700 150,700" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.3"/>
    `;
  } else {
    elements = `
      <g opacity="0.4">
        <circle cx="250" cy="350" r="180" fill="none" stroke="#ffffff" stroke-width="2"/>
        <circle cx="550" cy="650" r="220" fill="none" stroke="#ffffff" stroke-width="2"/>
        <line x1="250" y1="350" x2="550" y2="650" stroke="#aaaaaa" stroke-width="1.5" stroke-dasharray="6 6"/>
        <rect x="150" y="150" width="500" height="700" fill="none" stroke="#666666" stroke-width="1"/>
      </g>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#141416"/>
    ${elements}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PRESET_IMAGES = Array.from({ length: 12 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, "0");
  return {
    label: `Abstract Geometric ${num}`,
    url: createAbstractSvg(i + 1)
  };
});
