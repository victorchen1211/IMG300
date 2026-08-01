"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import styles from "../app/page.module.scss";

export const SocialMediaIdentity: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Control State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState<string>("Initializing...");
  const [faceDetected, setFaceDetected] = useState<boolean>(false);

  // Dynamic N x N Matrix Controls (1x1 ~ 10x10)
  const [gridDimension, setGridDimension] = useState<number>(10); // N x N (1 to 10, default 10)
  const [tileSize, setTileSize] = useState<number>(64); // Tile Size
  const [cropPadding, setCropPadding] = useState<number>(30);

  // Auto-adjust tile size when gridDimension changes
  useEffect(() => {
    const recommendedSize = Math.min(220, Math.floor(620 / gridDimension));
    setTileSize(recommendedSize);
  }, [gridDimension]);

  // Refs for MediaPipe & Live Face Region
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const rawFaceCropRef = useRef<{ normMinX: number; normMinY: number; normMaxX: number; normMaxY: number } | null>(null);

  // Initialize MediaPipe FaceLandmarker Model
  useEffect(() => {
    let isMounted = true;
    const initMediaPipe = async () => {
      try {
        setModelStatus("Loading Engine...");
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        setModelStatus("Loading Task...");
        let faceLandmarker: FaceLandmarker | null = null;

        try {
          faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numFaces: 1
          });
        } catch (gpuErr) {
          faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "CPU"
            },
            runningMode: "VIDEO",
            numFaces: 1
          });
        }

        if (isMounted && faceLandmarker) {
          faceLandmarkerRef.current = faceLandmarker;
          setModelStatus("Model Ready");
        }
      } catch (err: any) {
        console.warn("MediaPipe load error:", err);
        if (isMounted) {
          setModelStatus("Model Error");
        }
      }
    };

    initMediaPipe();
    return () => {
      isMounted = false;
    };
  }, []);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Camera access permission denied or unavailable.");
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setFaceDetected(false);
    rawFaceCropRef.current = null;
  };

  // Main Render Loop - Dynamic N x N Face Region Inward Matrix
  const renderLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Pure Studio Dark Background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#08080e");
    bgGrad.addColorStop(1, "#12121c");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Background grid accent
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

    if (isCameraActive && video && video.readyState >= 2) {
      const vW = video.videoWidth || 1280;
      const vH = video.videoHeight || 720;

      // 1. Perform AI Face Region Detection
      if (faceLandmarkerRef.current) {
        try {
          const nowMs = performance.now();
          if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            const results = faceLandmarkerRef.current.detectForVideo(video, nowMs);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              setFaceDetected(true);
              const landmarks = results.faceLandmarks[0];

              let minX = 1, maxX = 0, minY = 1, maxY = 0;
              landmarks.forEach((pt) => {
                if (pt.x < minX) minX = pt.x;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.y > maxY) maxY = pt.y;
              });

              rawFaceCropRef.current = {
                normMinX: minX,
                normMinY: minY,
                normMaxX: maxX,
                normMaxY: maxY
              };
            } else {
              setFaceDetected(false);
            }
          }
        } catch (e) {
          // Detection frame skip
        }
      }

      // 2. Render DYNAMIC N x N MATRIX (1x1 to 10x10)
      const normCrop = rawFaceCropRef.current;
      const n = gridDimension;
      const totalGridW = n * tileSize;
      const totalGridH = n * tileSize;

      const gridStartX = (w - totalGridW) / 2;
      const gridStartY = (h - totalGridH) / 2;

      // Center anchor coordinate in grid space: C = (N - 1) / 2
      const centerCoord = (n - 1) / 2;

      if (normCrop) {
        // Base Source Video Crop Coordinates with Padding
        const faceW = normCrop.normMaxX - normCrop.normMinX;
        const faceH = normCrop.normMaxY - normCrop.normMinY;

        const padX = (cropPadding / w) * faceW;
        const padY = (cropPadding / h) * faceH;

        const baseMinX = Math.max(0, normCrop.normMinX - padX);
        const baseMinY = Math.max(0, normCrop.normMinY - padY);
        const baseMaxX = Math.min(1, normCrop.normMaxX + padX);
        const baseMaxY = Math.min(1, normCrop.normMaxY + padY);

        const cropWNorm = baseMaxX - baseMinX;
        const cropHNorm = baseMaxY - baseMinY;

        const baseOutwardStep = 0.20;
        const signedFactor = 1.0; // Inward convergence baseline

        // Render each of the N x N tiles
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            const tileX = gridStartX + c * tileSize;
            const tileY = gridStartY + r * tileSize;

            // Inward Convergence Vector toward grid center (centerCoord, centerCoord):
            // Normalized distance ratio based on grid dimension N
            const inwardCol = centerCoord > 0 ? (centerCoord - c) / centerCoord : 0;
            const inwardRow = centerCoord > 0 ? (centerCoord - r) / centerCoord : 0;

            const netOffsetCol = -inwardCol * (baseOutwardStep - signedFactor * 0.48);
            const netOffsetRow = -inwardRow * (baseOutwardStep - signedFactor * 0.48);

            let tileMinX = baseMinX + netOffsetCol * cropWNorm;
            let tileMinY = baseMinY - netOffsetRow * cropHNorm;
            let tileMaxX = tileMinX + cropWNorm;
            let tileMaxY = tileMinY + cropHNorm;

            // Clamp source video crop bounds
            if (tileMinX < 0) { tileMinX = 0; tileMaxX = cropWNorm; }
            if (tileMaxX > 1) { tileMaxX = 1; tileMinX = 1 - cropWNorm; }
            if (tileMinY < 0) { tileMinY = 0; tileMaxY = cropHNorm; }
            if (tileMaxY > 1) { tileMaxY = 1; tileMinY = 1 - cropHNorm; }

            const srcX = tileMinX * vW;
            const srcY = tileMinY * vH;
            const srcW = (tileMaxX - tileMinX) * vW;
            const srcH = (tileMaxY - tileMinY) * vH;

            // Draw Square Face Region Crop Tile
            ctx.save();
            ctx.beginPath();
            ctx.rect(tileX, tileY, tileSize, tileSize);
            ctx.clip();

            ctx.translate(tileX + tileSize, tileY);
            ctx.scale(-1, 1);
            ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, tileSize, tileSize);
            ctx.restore();

            // Seamless subtle border between adjacent tiles
            ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
            ctx.lineWidth = 1;
            ctx.strokeRect(tileX, tileY, tileSize, tileSize);

            // Display tile label badge for small grids (N <= 5)
            if (n <= 5) {
              const tileId = r * n + c + 1;
              const isCenter = Math.abs(c - centerCoord) < 0.5 && Math.abs(r - centerCoord) < 0.5;
              ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
              ctx.fillRect(tileX + 4, tileY + 4, 22, 16);
              ctx.fillStyle = isCenter ? "#00ff22" : "#ffffff";
              ctx.font = '800 10px "Space Mono", monospace';
              ctx.textAlign = "center";
              ctx.fillText(`${tileId}`, tileX + 15, tileY + 16);
            }
          }
        }
      } else {
        // Simple prompt when face region is searching
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = '600 13px "Space Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText(`SEARCHING FACE REGION FOR ${n}x${n} MATRIX...`, w / 2, h / 2);
      }
    } else {
      // Prompt when camera is inactive
      ctx.fillStyle = "#ffffff";
      ctx.font = '700 22px "Telegraf", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(`START WEBCAM TO VIEW ${gridDimension}x${gridDimension} FACE MATRIX`, w / 2, h / 2);
    }

    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, [isCameraActive, gridDimension, tileSize, cropPadding]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 1280;
      canvas.height = 720;
    }
    animationFrameRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [renderLoop]);

  return (
    <div className={styles.appContainer} style={{ background: "#0a0a0f", minHeight: "100vh" }}>
      {/* Sidebar Tool Panel */}
      <div className={styles.sidebar}>
        <div className={styles.brandTitle}>IMG300</div>
        <div className={styles.brandSubtitle}>{gridDimension}x{gridDimension} Face Region Matrix</div>

        {/* Camera Control Section */}
        <div className={styles.sectionHeader} style={{ marginTop: 20 }}>
          <span>Webcam Control</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          {!isCameraActive ? (
            <button
              className="primary"
              style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: 700 }}
              onClick={startCamera}
            >
              📷 Start Webcam
            </button>
          ) : (
            <button
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 700,
                color: "#ff3b30",
                borderColor: "#ff3b30",
                background: "rgba(255, 59, 48, 0.1)"
              }}
              onClick={stopCamera}
            >
              ⏹ Stop Camera
            </button>
          )}

          {cameraError && (
            <div style={{ color: "#ff3b30", fontSize: "11px", marginTop: "8px", lineHeight: 1.4 }}>
              {cameraError}
            </div>
          )}
        </div>

        {/* Dynamic N x N Matrix Controls */}
        <div className={styles.sectionHeader}>
          <span>Matrix Dimension Settings</span>
        </div>

        {/* Grid Dimension N x N Slider (1 to 10) */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Grid Matrix Dimension</span>
            <span className={styles.controlValue}>{gridDimension} x {gridDimension}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={gridDimension}
            onChange={(e) => setGridDimension(parseInt(e.target.value))}
          />
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Square Tile Size</span>
            <span className={styles.controlValue}>{tileSize}px</span>
          </div>
          <input
            type="range"
            min={20}
            max={320}
            step={5}
            value={tileSize}
            onChange={(e) => setTileSize(parseInt(e.target.value))}
          />
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Face Region Crop Margin</span>
            <span className={styles.controlValue}>{cropPadding}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={80}
            step={5}
            value={cropPadding}
            onChange={(e) => setCropPadding(parseInt(e.target.value))}
          />
        </div>

        {/* Status Indicator */}
        <div
          style={{
            background: isCameraActive ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "6px",
            padding: "12px",
            fontSize: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>AI Model Status</span>
            <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "11px" }}>
              {modelStatus}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Face Region Tracking</span>
            <span style={{ color: faceDetected ? "#ffffff" : "rgba(255, 255, 255, 0.4)", fontWeight: 700 }}>
              {faceDetected ? `TRACKED (${gridDimension}x${gridDimension} = ${gridDimension * gridDimension} TILES)` : "SEARCHING..."}
            </span>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div className={styles.canvasViewport} ref={containerRef}>
        <div className={styles.canvasWrapper} style={{ position: "relative" }}>
          {/* Video Stream Element */}
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ display: "none" }}
          />

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
          IMG300 Studio • Dynamic {gridDimension}x{gridDimension} Face Region Inward Convergence Matrix ({gridDimension * gridDimension} Tiles)
        </div>
      </div>
    </div>
  );
};
