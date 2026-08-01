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

  // Face Region Display Controls
  const [centerDisplaySize, setCenterDisplaySize] = useState<number>(320);
  const [cropPadding, setCropPadding] = useState<number>(30);

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

  // Main Render Loop
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

    // Subtle background grid accent
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

      // 2. Render CENTER CANVAS ONLY: PURE CLEAN CROPPED FACE REGION
      const normCrop = rawFaceCropRef.current;
      const centerW = centerDisplaySize;
      const centerH = centerDisplaySize * 1.15;
      const centerX = (w - centerW) / 2;
      const centerY = (h - centerH) / 2;

      if (normCrop) {
        // Calculate Source Video Crop Coordinates with Padding
        const padX = (cropPadding / w) * (normCrop.normMaxX - normCrop.normMinX);
        const padY = (cropPadding / h) * (normCrop.normMaxY - normCrop.normMinY);

        const cropMinX = Math.max(0, normCrop.normMinX - padX);
        const cropMinY = Math.max(0, normCrop.normMinY - padY);
        const cropMaxX = Math.min(1, normCrop.normMaxX + padX);
        const cropMaxY = Math.min(1, normCrop.normMaxY + padY);

        const srcX = cropMinX * vW;
        const srcY = cropMinY * vH;
        const srcW = (cropMaxX - cropMinX) * vW;
        const srcH = (cropMaxY - cropMinY) * vH;

        // Draw Pure Mirrored Face Region Crop in Center Canvas
        ctx.save();
        ctx.beginPath();
        ctx.rect(centerX, centerY, centerW, centerH);
        ctx.clip();

        ctx.translate(centerX + centerW, centerY);
        ctx.scale(-1, 1);
        ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, centerW, centerH);
        ctx.restore();
      } else {
        // Simple prompt when face region is searching
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = '600 13px "Space Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText("SEARCHING FACE REGION...", centerX + centerW / 2, centerY + centerH / 2);
      }
    } else {
      // Prompt when camera is inactive
      ctx.fillStyle = "#ffffff";
      ctx.font = '700 22px "Telegraf", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("START WEBCAM TO VIEW FACE REGION", w / 2, h / 2);
    }

    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, [isCameraActive, centerDisplaySize, cropPadding]);

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
        <div className={styles.brandSubtitle}>Face Region Viewport</div>

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

        {/* Face Region Display Controls */}
        <div className={styles.sectionHeader}>
          <span>Face Region Settings</span>
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Face Region Display Size</span>
            <span className={styles.controlValue}>{centerDisplaySize}px</span>
          </div>
          <input
            type="range"
            min={50}
            max={560}
            step={10}
            value={centerDisplaySize}
            onChange={(e) => setCenterDisplaySize(parseInt(e.target.value))}
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
              {faceDetected ? "TRACKED" : "SEARCHING..."}
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
          IMG300 Studio • Pure Face Region Viewport
        </div>
      </div>
    </div>
  );
};
