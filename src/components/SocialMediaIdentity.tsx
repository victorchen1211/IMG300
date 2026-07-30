"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import styles from "../app/page.module.scss";

// MediaPipe Face Oval Contour Landmark Indices (in order around face)
const FACE_OVAL_LANDMARKS = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377,
  152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
];

export const SocialMediaIdentity: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mosaicOffscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Control State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [isMosaicActive, setIsMosaicActive] = useState<boolean>(true);
  const [mosaicSize, setMosaicSize] = useState<number>(18); // Block size in px
  const [glassOpacity, setGlassOpacity] = useState<number>(0.5); // 0.2 ~ 0.8

  // Refs for MediaPipe & Animation
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize MediaPipe Face Landmarker
  useEffect(() => {
    let isMounted = true;
    const initMediaPipe = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 1
        });

        if (isMounted) {
          faceLandmarkerRef.current = faceLandmarker;
        }
      } catch (err) {
        console.warn("MediaPipe load warning:", err);
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
  };

  // Render Clean Semi-Transparent Glass Pixel Mosaic clipped STRICTLY to inner face contour
  const renderGlassMosaic = (
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    landmarks: any[],
    canvasW: number,
    canvasH: number
  ) => {
    // 1. Calculate tight bounding box of face landmarks
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    FACE_OVAL_LANDMARKS.forEach((idx) => {
      const pt = landmarks[idx];
      if (pt) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      }
    });

    const boxX = (1 - maxX) * canvasW;
    const boxY = minY * canvasH;
    const boxW = (maxX - minX) * canvasW;
    const boxH = (maxY - minY) * canvasH;

    if (boxW <= 0 || boxH <= 0) return;

    // 2. Setup offscreen low-res pixel sampling canvas
    const sampleW = Math.max(8, Math.floor(boxW / mosaicSize));
    const sampleH = Math.max(8, Math.floor(boxH / mosaicSize));

    if (!mosaicOffscreenCanvasRef.current) {
      mosaicOffscreenCanvasRef.current = document.createElement("canvas");
    }
    const oCanvas = mosaicOffscreenCanvasRef.current;
    if (oCanvas.width !== sampleW || oCanvas.height !== sampleH) {
      oCanvas.width = sampleW;
      oCanvas.height = sampleH;
    }
    const oCtx = oCanvas.getContext("2d");
    if (!oCtx) return;

    // Video coordinates (unmirrored for sampling)
    const vW = video.videoWidth;
    const vH = video.videoHeight;
    const cropX = Math.max(0, (1 - (boxX + boxW) / canvasW) * vW);
    const cropY = Math.max(0, (boxY / canvasH) * vH);
    const cropW = Math.min(vW - cropX, (boxW / canvasW) * vW);
    const cropH = Math.min(vH - cropY, (boxH / canvasH) * vH);

    oCtx.save();
    oCtx.translate(sampleW, 0);
    oCtx.scale(-1, 1);
    oCtx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, sampleW, sampleH);
    oCtx.restore();

    const imgData = oCtx.getImageData(0, 0, sampleW, sampleH).data;

    const blockW = boxW / sampleW;
    const blockH = boxH / sampleH;

    ctx.save();

    // 3. Clip rendering context strictly to the Face Oval Contour (No hair, forehead, ears, or neck!)
    ctx.beginPath();
    FACE_OVAL_LANDMARKS.forEach((idx, i) => {
      const pt = landmarks[idx];
      if (pt) {
        const px = (1 - pt.x) * canvasW;
        const py = pt.y * canvasH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
    });
    ctx.closePath();
    ctx.clip(); // Restrict glass mosaic strictly inside face contour!

    // 4. Loop through mosaic pixel blocks - Clean seamless glass fill
    for (let gy = 0; gy < sampleH; gy++) {
      for (let gx = 0; gx < sampleW; gx++) {
        const idx = (gy * sampleW + gx) * 4;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];

        const posX = boxX + gx * blockW;
        const posY = boxY + gy * blockH;

        // Semi-Transparent Glass Color Fill
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${glassOpacity})`;
        ctx.fillRect(posX, posY, blockW + 0.5, blockH + 0.5);
      }
    }

    ctx.restore();
  };

  // Main Render Loop
  const renderLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const now = performance.now();

    ctx.clearRect(0, 0, w, h);

    if (isCameraActive && video && video.readyState >= 2) {
      // 1. Draw Mirrored Live Webcam Feed
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();

      // 2. MediaPipe AI Real-time Face Detection
      if (faceLandmarkerRef.current) {
        try {
          const results = faceLandmarkerRef.current.detectForVideo(video, now);
          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            setFaceDetected(true);
            const landmarks = results.faceLandmarks[0];

            // 3. Render Clean Semi-Transparent Glass Mosaic STRICTLY over Face Contour
            if (isMosaicActive) {
              renderGlassMosaic(ctx, video, landmarks, w, h);
            }
          } else {
            setFaceDetected(false);
          }
        } catch (e) {
          // Frame skip
        }
      }
    } else {
      // Dark cyber background when camera is off
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#0a0a12");
      grad.addColorStop(1, "#141424");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Grid lines background accent
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.fillStyle = "#00ff22";
      ctx.font = '700 24px "Telegraf", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("START WEBCAM FOR REAL-TIME TRANSPARENT FACE MOSAIC", w / 2, h / 2);
    }

    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, [isCameraActive, isMosaicActive, mosaicSize, glassOpacity]);

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
        <div className={styles.brandSubtitle}>Transparent Face Mosaic</div>

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

        {/* Glass Mosaic Settings Section */}
        <div className={styles.sectionHeader}>
          <span>Transparent Mosaic Controls</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <button
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "12px",
              fontWeight: 700,
              color: isMosaicActive ? "#000" : "#fff",
              background: isMosaicActive ? "#00ff22" : "rgba(255, 255, 255, 0.08)",
              border: "1px solid #00ff22"
            }}
            onClick={() => setIsMosaicActive((prev) => !prev)}
          >
            🔲 {isMosaicActive ? "Glass Mosaic ON" : "Mosaic OFF"}
          </button>
        </div>

        {/* Mosaic Pixel Block Size Slider */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Mosaic Pixel Size</span>
            <span className={styles.controlValue}>{mosaicSize}px</span>
          </div>
          <input
            type="range"
            min={8}
            max={40}
            step={2}
            value={mosaicSize}
            onChange={(e) => setMosaicSize(parseInt(e.target.value))}
          />
        </div>

        {/* Glass Opacity Slider */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Glass Transparency</span>
            <span className={styles.controlValue}>{Math.round(glassOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.15}
            max={0.85}
            step={0.05}
            value={glassOpacity}
            onChange={(e) => setGlassOpacity(parseFloat(e.target.value))}
          />
        </div>

        {/* Status Indicator */}
        <div
          style={{
            background: isCameraActive ? "rgba(0, 255, 34, 0.1)" : "rgba(255, 255, 255, 0.05)",
            border: isCameraActive ? "1px solid rgba(0, 255, 34, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "6px",
            padding: "12px",
            fontSize: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Face AI Tracking</span>
            <span style={{ color: faceDetected ? "#00ff22" : "rgba(255, 255, 255, 0.4)", fontWeight: 700 }}>
              {faceDetected ? "TRACKED" : "SEARCHING..."}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Glass Mosaic Mode</span>
            <span style={{ color: isMosaicActive ? "#00ff22" : "rgba(255, 255, 255, 0.4)", fontWeight: 700 }}>
              {isMosaicActive ? "TRANSPARENT" : "DISABLED"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Webcam Viewport */}
      <div className={styles.canvasViewport} ref={containerRef}>
        <div className={styles.canvasWrapper} style={{ position: "relative" }}>
          {/* Video Stream Element */}
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ display: "none" }}
          />

          {/* Real-time Cyber Surveillance HUD Canvas */}
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
          AI Transparent Face Mosaic • Created by Victor Chen
        </div>
      </div>
    </div>
  );
};
