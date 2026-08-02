"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/page.module.scss";
import { ImageUploader } from "./common";

export const ShapeMosaicGenerator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);

  // Load default sample transparent PNG/image on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setSourceImage(img);
    };
    img.src = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80";
  }, []);

  // Handle Image Upload
  const handleUploadImage = (img: HTMLImageElement) => {
    setSourceImage(img);
  };

  // Render Loop to Draw Studio Canvas and Base Image
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Studio Dark Theme Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#08080e");
    bgGrad.addColorStop(1, "#12121c");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Studio Grid Accent Pattern
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    const bgStep = 40;
    for (let x = 0; x < w; x += bgStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += bgStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (sourceImage && sourceImage.complete && sourceImage.naturalWidth > 0) {
      const imgW = sourceImage.naturalWidth;
      const imgH = sourceImage.naturalHeight;
      const imgAspect = imgW / imgH;

      const maxW = w * 0.94;
      const maxH = h * 0.94;

      let drawW = maxW;
      let drawH = maxW / imgAspect;

      if (drawH > maxH) {
        drawH = maxH;
        drawW = maxH * imgAspect;
      }

      const drawX = (w - drawW) / 2;
      const drawY = (h - drawH) / 2;

      // Drop Shadow for Image Frame
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 15;

      // Draw Uploaded Image
      ctx.drawImage(sourceImage, drawX, drawY, drawW, drawH);
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = '600 16px "Space Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("UPLOAD AN IMAGE TO BEGIN SHAPE MOSAIC CREATION", w / 2, h / 2);
    }
  }, [sourceImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 1920;
      canvas.height = 1080;
    }
    renderCanvas();
  }, [renderCanvas]);

  return (
    <div className={styles.appContainer} style={{ background: "#0a0a0f", minHeight: "100vh" }}>
      {/* Sidebar Tool Panel */}
      <div className={styles.sidebar}>
        <div className={styles.brandTitle}>IMG300</div>
        <div className={styles.brandSubtitle}>Shape Mosaic Studio</div>

        {/* Image Upload Component */}
        <ImageUploader
          hasImage={!!sourceImage}
          onUploadImage={handleUploadImage}
        />

        <div className={styles.sectionHeader}>
          <span>Controls</span>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "6px",
            padding: "16px",
            fontSize: "12px",
            color: "rgba(255, 255, 255, 0.7)",
            lineHeight: "1.6"
          }}
        >
          Shape Mosaic Generator initialized. Upload a cut-out PNG or image to get started.
        </div>
      </div>

      {/* Main Viewport */}
      <div className={styles.canvasViewport} ref={containerRef}>
        <div className={styles.canvasWrapper} style={{ position: "relative" }}>
          {/* Real-time Canvas */}
          <canvas
            ref={canvasRef}
            className={styles.canvasElement}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              borderRadius: "8px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)"
            }}
          />
        </div>

        <div className={styles.canvasFooter}>
          IMG300 Studio • Shape Mosaic Studio (1920x1080 Full HD)
        </div>
      </div>
    </div>
  );
};
