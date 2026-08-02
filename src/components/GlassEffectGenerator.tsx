"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import styles from "../app/page.module.scss";
import { ImageUploader, TypographyControl, TextLayer, CanvasViewport } from "./common";
import {
  BaseGlassControl,
  StraightTwistControl,
  HammeredRippleControl,
  GridPrismControl
} from "./glassEffect";

// WebGL Vertex Shader
const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

// Unified Multi-Mode Glass WebGL Fragment Shader
const fragmentShader = `
precision highp float;
uniform sampler2D uTexture;
uniform vec4 uGlassBounds; // (minX, minY, width, height) normalized [0, 1]
uniform float uTime;
uniform float uFluteCount;
uniform float uDistortionX;
uniform float uRippleScale;
uniform float uRippleDistortion;
uniform float uGridScale;
uniform float uGridDistortion;
uniform float uCornerRoundness; // 0.0: Sharp Diamond -> 1.0: Round Circular Lens
uniform float uGlassOpacity;
uniform float uHighlight;
uniform float uShadow;
uniform int uGlassMode; // 0: Base Frosted, 1: Straight Twist, 2: Hammered/Rippled Noise, 3: Diamond/Circle Faceted Prism

varying vec2 vUv;

// GLSL Simplex Noise 2D
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// 45-degree rotation matrix for precise Diamond Rhombus Grid
vec2 toDiamond(vec2 p) {
  float angle = 0.785398; // 45 degrees in radians
  float s = sin(angle);
  float c = cos(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

void main() {
  vec2 st = vUv;

  // Invert Y for WebGL texture coordinates
  float gx = uGlassBounds.x;
  float gy = 1.0 - uGlassBounds.y - uGlassBounds.w;
  float gw = uGlassBounds.z;
  float gh = uGlassBounds.w;

  bool insideGlass = (st.x >= gx && st.x <= gx + gw && st.y >= gy && st.y <= gy + gh);

  if (insideGlass) {
    float localX = (st.x - gx) / gw;
    float localY = (st.y - gy) / gh;

    if (uGlassMode == 1) {
      // 1. Straight Glass Twist Distortion Algorithm
      float flutePhase = localX * uFluteCount * 6.283185307;
      float lensNormal = sin(flutePhase);

      vec2 distortedUv = st;
      distortedUv.x += lensNormal * uDistortionX;
      distortedUv = clamp(distortedUv, vec2(0.001), vec2(0.999));

      vec4 texColor = texture2D(uTexture, distortedUv);

      float ridgeHL = pow(max(0.0, lensNormal), 4.0) * uHighlight;
      float valleyEdgeShd = (1.0 - pow(abs(lensNormal), 1.5)) * uShadow;

      vec3 rgb = texColor.rgb * (1.0 - valleyEdgeShd) + vec3(ridgeHL);

      if (uGlassOpacity > 0.0) {
        rgb = mix(rgb, vec3(1.0), uGlassOpacity * 0.15);
      }

      gl_FragColor = vec4(rgb, 1.0);
    } else if (uGlassMode == 2) {
      // 2. Hammered / Rippled Glass Noise + Displacement Shader Algorithm
      float scale = uRippleScale;
      float nX = snoise(vec2(localX * scale, localY * scale));
      float nY = snoise(vec2(localX * scale + 17.3, localY * scale + 42.1));

      vec2 distortedUv = st;
      distortedUv.x += nX * uRippleDistortion;
      distortedUv.y += nY * uRippleDistortion;
      distortedUv = clamp(distortedUv, vec2(0.001), vec2(0.999));

      vec4 texColor = texture2D(uTexture, distortedUv);

      float rippleLen = length(vec2(nX, nY));
      float waterGlare = pow(max(0.0, rippleLen), 3.0) * uHighlight;
      float shadowEmboss = (1.0 - smoothstep(0.0, 0.8, rippleLen)) * uShadow;

      vec3 rgb = texColor.rgb * (1.0 - shadowEmboss) + vec3(waterGlare);

      if (uGlassOpacity > 0.0) {
        rgb = mix(rgb, vec3(1.0), uGlassOpacity * 0.15);
      }

      gl_FragColor = vec4(rgb, 1.0);
    } else if (uGlassMode == 3) {
      // 3. Diamond -> Circular Lens Faceted Prism Glass Algorithm
      vec2 localUV = vec2(localX, localY);
      vec2 gridUV = toDiamond(localUV * uGridScale);
      vec2 cell = floor(gridUV);
      vec2 frac = fract(gridUV) - 0.5; // Grid cell center at (0, 0)

      // Sharp Diamond Distance Metric (Chebyshev L1 norm)
      float distDiamond = max(abs(frac.x), abs(frac.y));

      // Circular Lens Distance Metric (Euclidean L2 norm)
      float distCircle = length(frac) * 1.41421356;

      // Morph distance & refraction vector based on uCornerRoundness [0.0 -> 1.0]
      float dist = mix(distDiamond, distCircle, uCornerRoundness);
      vec2 direction = normalize(mix(frac, normalize(frac), uCornerRoundness) + 1e-5);

      // Refraction edge displacement
      float edge = smoothstep(0.15, 0.5, dist);
      vec2 distortion = direction * edge * uGridDistortion;

      vec2 distortedUv = st + distortion * 0.5;
      distortedUv = clamp(distortedUv, vec2(0.001), vec2(0.999));

      vec3 color = texture2D(uTexture, distortedUv).rgb;

      // Realistic 3D Specular Highlight adapting to rounded contour
      float highlight = pow(max(0.0, 1.0 - dist * 1.8), 4.0) * uHighlight;
      highlight += pow(max(0.0, dot(direction, vec2(0.7, 0.7))), 6.0) * uHighlight * 0.8;
      
      // Subtle time-based dynamic light shimmer
      float shimmer = sin(uTime * 1.5 + cell.x * 0.3 + cell.y * 0.3) * 0.03 * uHighlight;
      highlight += max(0.0, shimmer);

      float facetShadow = smoothstep(0.0, 0.45, dist) * uShadow * 0.5;
      vec3 finalRgb = color * (1.0 - facetShadow) + vec3(highlight);

      if (uGlassOpacity > 0.0) {
        finalRgb = mix(finalRgb, vec3(1.0), uGlassOpacity * 0.15);
      }

      gl_FragColor = vec4(finalRgb, 1.0);
    } else {
      // 0. Base Glass Panel Fill & Sheen
      vec4 texColor = texture2D(uTexture, st);
      vec3 rgb = mix(texColor.rgb, vec3(1.0), max(0.08, uGlassOpacity * 0.25));
      gl_FragColor = vec4(rgb, 1.0);
    }
  } else {
    gl_FragColor = texture2D(uTexture, st);
  }
}
`;

export const GlassEffectGenerator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // State
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [viewportDim, setViewportDim] = useState<{ w: number; h: number }>({ w: 800, h: 600 });

  // Base Glass Pane Component State
  const [glassEnabled, setGlassEnabled] = useState<boolean>(true);
  const [glassWidth, setGlassWidth] = useState<number>(550);
  const [glassHeight, setGlassHeight] = useState<number>(420);
  const [glassOpacity, setGlassOpacity] = useState<number>(0.0);
  const [blurAmount, setBlurAmount] = useState<number>(16);
  const [glassPos, setGlassPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  // Cache size before toggling full canvas
  const prevSizeRef = useRef<{ w: number; h: number }>({ w: 550, h: 420 });

  // Glass Effect Component 1: Straight Twist State (Default: false)
  const [straightTwistEnabled, setStraightTwistEnabled] = useState<boolean>(false);
  const [fluteCount, setFluteCount] = useState<number>(35);
  const [distortionX, setDistortionX] = useState<number>(0.05);
  const [twistHighlight, setTwistHighlight] = useState<number>(0.08);
  const [twistShadow, setTwistShadow] = useState<number>(0.15);

  // Glass Effect Component 2: Hammered / Rippled Glass State (Default: false)
  const [hammeredRippleEnabled, setHammeredRippleEnabled] = useState<boolean>(false);
  const [rippleScale, setRippleScale] = useState<number>(35);
  const [rippleDistortion, setRippleDistortion] = useState<number>(0.04);
  const [rippleHighlight, setRippleHighlight] = useState<number>(0.1);
  const [rippleShadow, setRippleShadow] = useState<number>(0.15);

  // Glass Effect Component 3: Diamond Faceted Prism Glass State (Default: false)
  const [gridPrismEnabled, setGridPrismEnabled] = useState<boolean>(false);
  const [gridScale, setGridScale] = useState<number>(32);
  const [gridDistortion, setGridDistortion] = useState<number>(0.045);
  const [gridRoundness, setGridRoundness] = useState<number>(0.0); // 0.0: Sharp Diamond -> 1.0: Round Circle Lens
  const [gridHighlight, setGridHighlight] = useState<number>(0.18);
  const [gridShadow, setGridShadow] = useState<number>(0.15);

  // Shared Typography Text Layers State
  const [textLayers, setTextLayers] = useState<TextLayer[]>([
    {
      id: "text-1",
      enabled: true,
      text: "GLASS EFFECT",
      fontSize: 80,
      textAlign: "center",
      color: "#ffffff",
      posX: 0.5,
      posY: 0.5,
      behindGlass: true
    }
  ]);
  const [selectedTextId, setSelectedTextId] = useState<string>("text-1");

  // Add / Delete / Select / Update Text Layer Handlers
  const handleAddText = () => {
    const newId = `text-${Date.now()}`;
    const newLayer: TextLayer = {
      id: newId,
      enabled: true,
      text: "NEW TYPOGRAPHY",
      fontSize: 60,
      textAlign: "center",
      color: "#ffffff",
      posX: 0.5,
      posY: 0.35,
      behindGlass: true
    };
    setTextLayers((prev) => [...prev, newLayer]);
    setSelectedTextId(newId);
  };

  const handleDeleteText = (id: string) => {
    setTextLayers((prev) => prev.filter((item) => item.id !== id));
    if (selectedTextId === id && textLayers.length > 1) {
      const remaining = textLayers.filter((item) => item.id !== id);
      setSelectedTextId(remaining[0].id);
    }
  };

  const handleSelectText = (id: string) => {
    setSelectedTextId(id);
  };

  const handleUpdateText = (id: string, updates: Partial<TextLayer>) => {
    setTextLayers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Dragging State (Support dragging active text layer OR glass pane)
  const [activeDrag, setActiveDrag] = useState<{
    target: "text" | "glass";
    textId?: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Default Canvas Dimensions (Portrait 3:4)
  const dimension = { w: 1200, h: 1600 };

  // Three.js / WebGL Pipeline Refs
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Resize Viewport Observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleResize = () => {
      setViewportDim({
        w: el.clientWidth - 80,
        h: el.clientHeight - 80
      });
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Initialize Three.js WebGL Renderer Shader Pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(dimension.w, dimension.h);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Initial Placeholder Canvas Texture
    const placeholderCanvas = document.createElement("canvas");
    placeholderCanvas.width = dimension.w;
    placeholderCanvas.height = dimension.h;
    const pCtx = placeholderCanvas.getContext("2d");
    if (pCtx) {
      pCtx.clearRect(0, 0, dimension.w, dimension.h);
    }
    const initialTexture = new THREE.CanvasTexture(placeholderCanvas);
    textureRef.current = initialTexture;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: initialTexture },
        uGlassBounds: { value: new THREE.Vector4(0.25, 0.25, 0.5, 0.5) },
        uTime: { value: 0 },
        uFluteCount: { value: 35.0 },
        uDistortionX: { value: 0.05 },
        uRippleScale: { value: 35.0 },
        uRippleDistortion: { value: 0.04 },
        uGridScale: { value: 32.0 },
        uGridDistortion: { value: 0.045 },
        uCornerRoundness: { value: 0.0 },
        uGlassOpacity: { value: 0.0 },
        uHighlight: { value: 0.18 },
        uShadow: { value: 0.15 },
        uGlassMode: { value: 0 }
      }
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Subtle 3D Time Animation Loop for dynamic glass shimmer
    let startTime = performance.now();
    const loop = (t: number) => {
      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = (t - startTime) * 0.001;
      }
      if (rendererRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, camera);
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (textureRef.current) textureRef.current.dispose();
      renderer.dispose();
    };
  }, [dimension.w, dimension.h]);

  // Render Loop / WebGL Uniform Updates
  const renderCanvas = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !materialRef.current) return;

    const mat = materialRef.current;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const normW = glassWidth / dimension.w;
    const normH = glassHeight / dimension.h;
    const normX = glassPos.x - normW / 2;
    const normY = glassPos.y - normH / 2;

    mat.uniforms.uGlassBounds.value.set(
      glassEnabled ? normX : -1,
      glassEnabled ? normY : -1,
      normW,
      normH
    );
    mat.uniforms.uRippleScale.value = rippleScale;
    mat.uniforms.uRippleDistortion.value = rippleDistortion;
    mat.uniforms.uGridScale.value = gridScale;
    mat.uniforms.uGridDistortion.value = gridDistortion;
    mat.uniforms.uCornerRoundness.value = gridRoundness;
    mat.uniforms.uGlassOpacity.value = glassOpacity;

    let modeVal = 0;
    if (straightTwistEnabled) {
      modeVal = 1;
      mat.uniforms.uFluteCount.value = fluteCount;
      mat.uniforms.uDistortionX.value = distortionX;
      mat.uniforms.uHighlight.value = twistHighlight;
      mat.uniforms.uShadow.value = twistShadow;
    } else if (hammeredRippleEnabled) {
      modeVal = 2;
      mat.uniforms.uHighlight.value = rippleHighlight;
      mat.uniforms.uShadow.value = rippleShadow;
    } else if (gridPrismEnabled) {
      modeVal = 3;
      mat.uniforms.uHighlight.value = gridHighlight;
      mat.uniforms.uShadow.value = gridShadow;
    }
    mat.uniforms.uGlassMode.value = modeVal;

    rendererRef.current.render(sceneRef.current, camera);
  }, [glassEnabled, straightTwistEnabled, hammeredRippleEnabled, gridPrismEnabled, glassWidth, glassHeight, glassOpacity, twistHighlight, twistShadow, rippleHighlight, rippleShadow, gridHighlight, gridShadow, fluteCount, distortionX, rippleScale, rippleDistortion, gridScale, gridDistortion, gridRoundness, glassPos, dimension.w, dimension.h]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Update Background Image & Render Text Layers onto Offscreen Canvas
  useEffect(() => {
    const offscreen = document.createElement("canvas");
    offscreen.width = dimension.w;
    offscreen.height = dimension.h;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, dimension.w, dimension.h);

    if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
      const imgW = bgImage.naturalWidth;
      const imgH = bgImage.naturalHeight;
      const imgAspect = imgW / imgH;

      const maxW = dimension.w * 0.85;
      const maxH = dimension.h * 0.85;

      let drawW = maxW;
      let drawH = maxW / imgAspect;

      if (drawH > maxH) {
        drawH = maxH;
        drawW = maxH * imgAspect;
      }

      const drawX = (dimension.w - drawW) / 2;
      const drawY = (dimension.h - drawH) / 2;

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 15;
      ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);
      ctx.restore();
    }

    // Render Text Layers (if enabled and behindGlass === true, draw onto texture so WebGL glass refracts it!)
    textLayers.forEach((layer) => {
      if (!layer.enabled || !layer.text.trim()) return;
      ctx.save();
      ctx.fillStyle = layer.color || "#ffffff";
      const font = layer.fontFamily || '"Telegraf", system-ui, sans-serif';
      ctx.font = `700 ${layer.fontSize}px ${font}`;
      ctx.textAlign = layer.textAlign || "center";
      ctx.textBaseline = "middle";
      const tx = layer.posX * dimension.w;
      const ty = layer.posY * dimension.h;

      // Handle multiline text
      const lines = layer.text.split("\n");
      const lineHeight = layer.fontSize * 1.15;
      const startY = ty - ((lines.length - 1) * lineHeight) / 2;

      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 12;

      lines.forEach((line, index) => {
        ctx.fillText(line, tx, startY + index * lineHeight);
      });

      ctx.restore();
    });

    // Dispose old texture to prevent WebGL VRAM memory leak!
    if (textureRef.current) {
      textureRef.current.dispose();
    }

    const newTex = new THREE.CanvasTexture(offscreen);
    newTex.minFilter = THREE.LinearFilter;
    newTex.magFilter = THREE.LinearFilter;
    newTex.needsUpdate = true;
    textureRef.current = newTex;

    if (materialRef.current) {
      materialRef.current.uniforms.uTexture.value = newTex;
    }

    renderCanvas();
  }, [bgImage, textLayers, dimension.w, dimension.h, renderCanvas]);

  // Display Dimension Calculation
  const scaleW = viewportDim.w / dimension.w;
  const scaleH = viewportDim.h / dimension.h;
  const fitScale = Math.min(scaleW, scaleH);
  const displayW = Math.round(dimension.w * fitScale);
  const displayH = Math.round(dimension.h * fitScale);

  // Check if currently Full Canvas (100%)
  const isFullCanvas = glassWidth >= dimension.w && glassHeight >= dimension.h;

  // Toggle Full Canvas ON / OFF Handler
  const handleToggleFullCanvas = () => {
    if (isFullCanvas) {
      setGlassWidth(prevSizeRef.current.w);
      setGlassHeight(prevSizeRef.current.h);
    } else {
      prevSizeRef.current = { w: glassWidth, h: glassHeight };
      setGlassWidth(dimension.w);
      setGlassHeight(dimension.h);
      setGlassPos({ x: 0.5, y: 0.5 });
    }
  };

  // Interactive Mouse Dragging Handlers (Target active text layer OR glass pane)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    // Check if clicking near selected active text layer
    const activeText = textLayers.find((t) => t.id === selectedTextId);
    if (activeText && activeText.enabled) {
      const distToText = Math.hypot(relX - activeText.posX, relY - activeText.posY);
      if (distToText < 0.12) {
        setActiveDrag({
          target: "text",
          textId: activeText.id,
          offsetX: relX - activeText.posX,
          offsetY: relY - activeText.posY
        });
        return;
      }
    }

    // Default: Drag Glass Pane
    if (glassEnabled) {
      setActiveDrag({
        target: "glass",
        offsetX: relX - glassPos.x,
        offsetY: relY - glassPos.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeDrag) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (activeDrag.target === "text" && activeDrag.textId) {
      const newX = Math.max(0, Math.min(1, relX - activeDrag.offsetX));
      const newY = Math.max(0, Math.min(1, relY - activeDrag.offsetY));
      handleUpdateText(activeDrag.textId, { posX: newX, posY: newY });
    } else if (activeDrag.target === "glass") {
      const newX = Math.max(0, Math.min(1, relX - activeDrag.offsetX));
      const newY = Math.max(0, Math.min(1, relY - activeDrag.offsetY));
      setGlassPos({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setActiveDrag(null);
  };

  return (
    <div className={styles.appContainer} style={{ background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Brik.space Floating White Card Sidebar */}
      <div
        className={styles.sidebar}
        style={{
          background: "#ffffff",
          color: "#111111",
          borderRadius: "16px",
          margin: "16px",
          height: "calc(100vh - 32px)",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e2e8f0",
          overflowY: "auto"
        }}
      >
        {/* Brik.space Header with Reset Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
            paddingBottom: "16px",
            borderBottom: "1px solid #eeeeee"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px", color: "#000000" }}>✦</span>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#000000",
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                Glass Effect Studio
              </span>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#777777",
                marginTop: "2px",
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              by IMG300 Studio
            </div>
          </div>

          <button
            onClick={() => {
              setGlassWidth(700);
              setGlassHeight(450);
              setGlassOpacity(0.9);
              setBlurAmount(6);
              setGlassPos({ x: 0.15, y: 0.22 });
              setStraightTwistEnabled(true);
              setFluteCount(40);
              setDistortionX(0.04);
              setHammeredRippleEnabled(false);
              setGridPrismEnabled(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "transparent",
              border: "none",
              fontSize: "13px",
              fontWeight: 700,
              color: "#000000",
              cursor: "pointer"
            }}
          >
            <span>↻</span> Reset
          </button>
        </div>

        {/* 1. Reusable Common Image Uploader Component */}
        <ImageUploader
          hasImage={!!bgImage}
          onUploadImage={(img) => setBgImage(img)}
        />

        {/* 2. Core Base Glass Component (Base Glass Pane) */}
        <BaseGlassControl
          enabled={glassEnabled}
          onToggleEnable={(val) => setGlassEnabled(val)}
          width={glassWidth}
          onChangeWidth={(w) => setGlassWidth(w)}
          height={glassHeight}
          onChangeHeight={(h) => setGlassHeight(h)}
          opacity={glassOpacity}
          onChangeOpacity={(op) => setGlassOpacity(op)}
          blurAmount={blurAmount}
          onChangeBlurAmount={(b) => setBlurAmount(b)}
          posX={glassPos.x * 100}
          onChangePosX={(x) => setGlassPos((prev) => ({ ...prev, x: x / 100 }))}
          posY={glassPos.y * 100}
          onChangePosY={(y) => setGlassPos((prev) => ({ ...prev, y: y / 100 }))}
          isFullCanvas={isFullCanvas}
          onToggleFullCanvas={handleToggleFullCanvas}
        />

        {/* 3. Reusable Shared Common Typography Component */}
        <TypographyControl
          texts={textLayers}
          selectedTextId={selectedTextId}
          onAddText={handleAddText}
          onDeleteText={handleDeleteText}
          onSelectText={handleSelectText}
          onUpdateText={handleUpdateText}
          showBehindGlassOption={true}
        />

        {/* 4. Modular Glass Effect Component 1: Straight Glass Twist */}
        <StraightTwistControl
          enabled={straightTwistEnabled}
          onToggleEnable={(val) => {
            setStraightTwistEnabled(val);
            if (val) {
              setHammeredRippleEnabled(false);
              setGridPrismEnabled(false);
            }
          }}
          fluteCount={fluteCount}
          onChangeFluteCount={(fc) => setFluteCount(fc)}
          distortionX={distortionX}
          onChangeDistortionX={(dx) => setDistortionX(dx)}
          highlight={twistHighlight}
          onChangeHighlight={(hl) => setTwistHighlight(hl)}
          shadow={twistShadow}
          onChangeShadow={(sh) => setTwistShadow(sh)}
        />

        {/* 5. Modular Glass Effect Component 2: Hammered / Rippled Glass */}
        <HammeredRippleControl
          enabled={hammeredRippleEnabled}
          onToggleEnable={(val) => {
            setHammeredRippleEnabled(val);
            if (val) {
              setStraightTwistEnabled(false);
              setGridPrismEnabled(false);
            }
          }}
          rippleScale={rippleScale}
          onChangeRippleScale={(rs) => setRippleScale(rs)}
          rippleDistortion={rippleDistortion}
          onChangeRippleDistortion={(rd) => setRippleDistortion(rd)}
          highlight={rippleHighlight}
          onChangeHighlight={(hl) => setRippleHighlight(hl)}
          shadow={rippleShadow}
          onChangeShadow={(sh) => setRippleShadow(sh)}
        />

        {/* 6. Modular Glass Effect Component 3: Diamond Faceted Prism Glass */}
        <GridPrismControl
          enabled={gridPrismEnabled}
          onToggleEnable={(val) => {
            setGridPrismEnabled(val);
            if (val) {
              setStraightTwistEnabled(false);
              setHammeredRippleEnabled(false);
            }
          }}
          gridScale={gridScale}
          onChangeGridScale={(gs) => setGridScale(gs)}
          gridDistortion={gridDistortion}
          onChangeGridDistortion={(gd) => setGridDistortion(gd)}
          roundness={gridRoundness}
          onChangeRoundness={(gr) => setGridRoundness(gr)}
          highlight={gridHighlight}
          onChangeHighlight={(hl) => setGridHighlight(hl)}
          shadow={gridShadow}
          onChangeShadow={(sh) => setGridShadow(sh)}
        />
      </div>

      {/* Shared Canvas Viewport Component */}
      <CanvasViewport
        canvasRef={canvasRef}
        containerRef={containerRef}
        onMouseDownCanvas={handleMouseDown}
        onMouseMoveCanvas={handleMouseMove}
        onMouseUpCanvas={handleMouseUp}
        onMouseLeaveCanvas={handleMouseUp}
        cursor={activeDrag ? "grabbing" : "move"}
      />
    </div>
  );
};
