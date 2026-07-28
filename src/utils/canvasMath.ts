export interface CircleNode {
  x: number;
  y: number;
  r: number;
  score?: number;
}

export interface DrawingPoint {
  x: number;
  y: number;
  type?: "normal" | "heavy";
  originId?: number;
  id?: number;
}

export interface PhysicsParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
}

export interface PointOffset {
  dx: number;
  dy: number;
}

// Seedable PRNG function
export function createPRNG(seed: number = 42) {
  let s = Math.abs(seed) || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Calculate circle-circle intersection points
export function circleIntersections(c1: CircleNode, c2: CircleNode): Array<{ x: number; y: number }> {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const dist = Math.hypot(dx, dy);

  if (dist > c1.r + c2.r || dist < Math.abs(c1.r - c2.r) || dist === 0) {
    return [];
  }

  const a = (c1.r * c1.r - c2.r * c2.r + dist * dist) / (2 * dist);
  const h2 = c1.r * c1.r - a * a;
  if (h2 < 0) return [];

  const h = Math.sqrt(h2);
  const cx = c1.x + (a * dx) / dist;
  const cy = c1.y + (a * dy) / dist;

  const rx = -dy * (h / dist);
  const ry = dx * (h / dist);

  return [
    { x: cx + rx, y: cy + ry },
    { x: cx - rx, y: cy - ry }
  ];
}

// Generate sequential parametric circle chain
export function generateCircleChain(
  width: number,
  height: number,
  options: {
    chainCount: number;
    chainAngle: number;
    chainBaseRadius: number;
    chainRatio: number;
  }
): CircleNode[] {
  const { chainCount, chainAngle, chainBaseRadius, chainRatio } = options;
  if (chainCount <= 0) return [];

  const cx = width / 2;
  const cy = height / 2;
  const rad = ((chainAngle - 90) * Math.PI) / 180;
  const result: CircleNode[] = [];

  result.push({ x: cx, y: cy, r: chainBaseRadius });

  let currX = cx;
  let currY = cy;
  let currR = chainBaseRadius;

  const forwardCount = Math.floor((chainCount - 1) / 2);
  for (let i = 0; i < forwardCount; i++) {
    const nextR = currR * chainRatio;
    currX += Math.cos(rad) * currR;
    currY += Math.sin(rad) * currR;
    result.push({ x: currX, y: currY, r: nextR });
    currR = nextR;
  }

  currX = cx;
  currY = cy;
  currR = chainBaseRadius;

  const backwardCount = Math.ceil((chainCount - 1) / 2);
  for (let i = 0; i < backwardCount; i++) {
    const nextR = currR * chainRatio;
    currX -= Math.cos(rad) * currR;
    currY -= Math.sin(rad) * currR;
    result.push({ x: currX, y: currY, r: nextR });
    currR = nextR;
  }

  return result;
}

// Analyze canvas image data and extract circle nodes based on image feature contrast/brightness
export function extractImageCircles(
  img: HTMLImageElement,
  width: number,
  height: number,
  options: {
    mode: string;
    threshold: number;
    maxCircles: number;
    minRadius: number;
    maxRadius: number;
    minDistance: number;
    sizeSeed: number;
  }
): CircleNode[] {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  // Draw image scaled / object-fit cover
  const imgRatio = img.width / img.height;
  const canvasRatio = width / height;
  let sw, sh, sx, sy;

  if (imgRatio > canvasRatio) {
    sh = img.height;
    sw = sh * canvasRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / canvasRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height).data;
  const blockSize = 16;
  const cols = Math.floor(width / blockSize);
  const rows = Math.floor(height / blockSize);

  const points: Array<{ x: number; y: number; brightness: number; contrast: number; score: number }> = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const startX = c * blockSize;
      const startY = r * blockSize;

      let sumBrightness = 0;
      let minB = 255;
      let maxB = 0;
      let count = 0;

      for (let py = 0; py < blockSize; py++) {
        for (let px = 0; px < blockSize; px++) {
          const idx = ((startY + py) * width + (startX + px)) * 4;
          const bright = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2];
          sumBrightness += bright;
          if (bright < minB) minB = bright;
          if (bright > maxB) maxB = bright;
          count++;
        }
      }

      const avgBrightness = sumBrightness / count;
      const contrast = maxB - minB;
      let score = contrast;

      if (options.mode === "contrast") {
        score = contrast;
      } else if (options.mode === "bright") {
        score = avgBrightness;
      } else if (options.mode === "dark") {
        score = 255 - avgBrightness;
      } else {
        score = contrast * (1 + Math.abs(avgBrightness - 128) / 128);
      }

      points.push({
        x: startX + blockSize / 2,
        y: startY + blockSize / 2,
        brightness: avgBrightness,
        contrast,
        score
      });
    }
  }

  const maxScore = Math.max(...points.map((p) => p.score), 1);
  const rng = createPRNG(options.sizeSeed);

  const filtered = points
    .map((p) => ({ ...p, normScore: p.score / maxScore }))
    .filter((p) => p.normScore >= options.threshold / 100)
    .sort((a, b) => b.normScore - a.normScore);

  const result: CircleNode[] = [];
  const minDistSq = options.minDistance * options.minDistance;

  for (const p of filtered) {
    if (result.length >= options.maxCircles) break;

    let valid = true;
    for (const res of result) {
      const dx = res.x - p.x;
      const dy = res.y - p.y;
      if (dx * dx + dy * dy < minDistSq) {
        valid = false;
        break;
      }
    }

    if (valid) {
      const variation = 0.5 + rng();
      const radius = (options.minRadius + (options.maxRadius - options.minRadius) * p.normScore) * variation;
      result.push({ x: p.x, y: p.y, r: radius, score: p.normScore });
    }
  }

  return result;
}

// Physics Step Integrator for interactive Drawing Studio / Geo Mode physics
export function stepPhysicsSimulation(
  particles: PhysicsParticle[],
  mousePos: { x: number; y: number } | null,
  attractForce: number,
  tangentForce: number,
  damping: number,
  repulsionConstant: number,
  boundSize: number = 1024
) {
  const count = particles.length;

  // Mouse attraction / rotational force
  if (mousePos) {
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const dx = mousePos.x - p.x;
      const dy = mousePos.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) continue;

      const factor = Math.max(0, 1 - dist / 600);
      if (factor <= 0) continue;

      const force = (attractForce * factor) / p.mass;
      const nx = dx / dist;
      const ny = dy / dist;

      p.vx += nx * force;
      p.vy += ny * force;
      p.vx += -ny * force * tangentForce;
      p.vy += nx * force * tangentForce;
    }
  }

  // Inter-particle repulsion / collision resolution
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const p1 = particles[i];
      const p2 = particles[j];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.hypot(dx, dy);
      const minDist = p1.radius + p2.radius;

      if (dist < minDist && dist > 0.01) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = (minDist - dist) * 0.5;
        const totalMass = p1.mass + p2.mass;
        const m1Ratio = p2.mass / totalMass;
        const m2Ratio = p1.mass / totalMass;

        p1.x -= nx * overlap * m1Ratio;
        p1.y -= ny * overlap * m1Ratio;
        p2.x += nx * overlap * m2Ratio;
        p2.y += ny * overlap * m2Ratio;

        p1.vx -= nx * repulsionConstant * m1Ratio;
        p1.vy -= ny * repulsionConstant * m1Ratio;
        p2.vx += nx * repulsionConstant * m2Ratio;
        p2.vy += ny * repulsionConstant * m2Ratio;
      }
    }
  }

  // Damping & boundary constraints
  for (let i = 0; i < count; i++) {
    const p = particles[i];
    p.vx *= damping;
    p.vy *= damping;
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0) {
      p.x = 0;
      p.vx = Math.abs(p.vx) * 0.5;
    }
    if (p.x > boundSize) {
      p.x = boundSize;
      p.vx = -Math.abs(p.vx) * 0.5;
    }
    if (p.y < 0) {
      p.y = 0;
      p.vy = Math.abs(p.vy) * 0.5;
    }
    if (p.y > boundSize) {
      p.y = boundSize;
      p.vy = -Math.abs(p.vy) * 0.5;
    }
  }
}

// Generate procedural noise texture canvas
export function createNoiseCanvas(width: number = 512, height: number = 512, alpha: number = 0.15): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const val = Math.floor(Math.random() * 255);
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = Math.floor(alpha * 255 * Math.random());
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}
