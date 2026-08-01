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

  // Face Crop Controls
  const [centerDisplaySize, setCenterDisplaySize] = useState<number>(320); // Center Face Size (200px ~ 600px)
  const [cropPadding, setCropPadding] = useState<number>(30); // Crop Padding

  // Refs for MediaPipe & Live Face Crop
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const rawFaceCropRef = useRef<{ normMinX: number; normMinY: number; normMaxX: number; normMaxY: number } | null>(null);

  // Initialize MediaPipe FaceLandmarker Model
  useEffect(() => {
    let isMounted = true;
    const initMediaPipe = async () => {
      try {
        setModelStatus("Loading MediaPipe Engine...");
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        setModelStatus("Loading Face Task...");
        let faceLandmarker: FaceLandmarker | null = null;

        try {
          // Attempt 1: GPU Delegate
          faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numFaces: 1
          });
        } catch (gpuErr) {
          // Attempt 2: CPU Fallback
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
          setModelStatus("AI Model Ready");
        }
      } catch (err: any) {
        console.warn("MediaPipe load error:", err);
        if (isMounted) {
          setModelStatus("Model Load Error");
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

    // Studio Background
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

      // 1. Perform AI Face Landmark Detection
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

      // 2. Render CENTER CANVAS: CROPPED FACE PORTRAIT ONLY
      const normCrop = rawFaceCropRef.current;
      const centerW = centerDisplaySize;
      const centerH = centerDisplaySize * 1.15; // Aspect ratio
      const centerX = (w - centerW) / 2;
      const centerY = (h - centerH) / 2;

      ctx.save();
      // Container Backdrop for Centered Cropped Face
      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(centerX - 8, centerY - 8, centerW + 16, centerH + 16);
      ctx.strokeStyle = "rgba(0, 255, 34, 0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(centerX - 8, centerY - 8, centerW + 16, centerH + 16);

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

        // Draw Mirrored Cropped Face Portrait in Center Canvas
        ctx.save();
        ctx.beginPath();
        ctx.rect(centerX, centerY, centerW, centerH);
        ctx.clip();

        ctx.translate(centerX + centerW, centerY);
        ctx.scale(-1, 1);
        ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, centerW, centerH);
        ctx.restore();

        // Cyber Glowing Corner Brackets for Center Cropped Face
        const bracketLength = Math.max(6, Math.min(20, Math.floor(centerW * 0.15)));
        ctx.lineWidth = Math.max(2, Math.min(4, Math.floor(centerW * 0.03)));
        ctx.strokeStyle = "#00ff22";

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + bracketLength);
        ctx.lineTo(centerX, centerY);
        ctx.lineTo(centerX + bracketLength, centerY);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(centerX + centerW - bracketLength, centerY);
        ctx.lineTo(centerX + centerW, centerY);
        ctx.lineTo(centerX + centerW, centerY + bracketLength);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + centerH - bracketLength);
        ctx.lineTo(centerX, centerY + centerH);
        ctx.lineTo(centerX + bracketLength, centerY + centerH);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(centerX + centerW - bracketLength, centerY + centerH);
        ctx.lineTo(centerX + centerW, centerY + centerH);
        ctx.lineTo(centerX + centerW, centerY + centerH - bracketLength);
        ctx.stroke();
      } else {
        // Prompt inside center box when face is searching
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = '600 14px "Space Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText("SEARCHING FACE FOR CENTER CROP...", centerX + centerW / 2, centerY + centerH / 2);
      }

      // Title Tag for Center Cropped Face
      ctx.fillStyle = "#00ff22";
      ctx.font = '800 11px "Space Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText(`CENTER CANVAS: CROPPED FACE REGION (${Math.round(centerDisplaySize)}px)`, centerX + centerW / 2, centerY - 18);

      ctx.restore();

      // 3. Render LIVE WEBCAM PREVIEW IN BOTTOM-LEFT CORNER
      const pipW = 280;
      const pipH = 175;
      const pipX = 30; // Bottom-Left X
      const pipY = h - pipH - 30; // Bottom-Left Y

      ctx.save();
      // Backdrop Frame for Bottom-Left PIP
      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(pipX - 4, pipY - 4, pipW + 8, pipH + 8);

      // Draw Mirrored Full Video Feed in Bottom-Left Corner
      ctx.save();
      ctx.beginPath();
      ctx.rect(pipX, pipY, pipW, pipH);
      ctx.clip();

      ctx.translate(pipX + pipW, pipY);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, pipW, pipH);
      ctx.restore();

      // Draw Face Bounding Box overlay inside Bottom-Left PIP
      if (normCrop) {
        const boxX = pipX + (1 - normCrop.normMaxX) * pipW;
        const boxY = pipY + normCrop.normMinY * pipH;
        const boxW = (normCrop.normMaxX - normCrop.normMinX) * pipW;
        const boxH = (normCrop.normMaxY - normCrop.normMinY) * pipH;

        ctx.strokeStyle = "#00ff22";
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);
      }

      // Border and Neon Badge for Bottom-Left PIP
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 2;
      ctx.strokeRect(pipX, pipY, pipW, pipH);

      // Header Tag for Bottom-Left PIP
      ctx.fillStyle = "rgba(10, 10, 16, 0.85)";
      ctx.fillRect(pipX, pipY, 170, 22);
      ctx.fillStyle = "#00e5ff";
      ctx.font = '800 10px "Space Mono", monospace';
      ctx.textAlign = "left";
      ctx.fillText("● LIVE WEBCAM PIP (LEFT)", pipX + 10, pipY + 15);

      ctx.restore();
    } else {
      // Dark Studio Background when camera is inactive
      ctx.fillStyle = "#00ff22";
      ctx.font = '700 24px "Telegraf", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("START WEBCAM FOR CENTER CROPPED FACE & BOTTOM-LEFT PIP", w / 2, h / 2);
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
        <div className={styles.brandSubtitle}>Center Face Crop & Bottom-Left PIP</div>

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

        {/* Center Face Size Adjuster */}
        <div className={styles.sectionHeader}>
          <span>Center Canvas Settings</span>
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Center Face Display Size</span>
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
            <span className={styles.controlLabel}>Crop Margin Padding</span>
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
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>AI Engine Status</span>
            <span style={{ color: "#00e5ff", fontWeight: 700, fontSize: "11px" }}>
              {modelStatus}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Face AI Tracking</span>
            <span style={{ color: faceDetected ? "#00ff22" : "rgba(255, 255, 255, 0.4)", fontWeight: 700 }}>
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
          IMG300 Studio • Center Cropped Face Portrait + Bottom-Left Live Webcam PIP
        </div>
      </div>
    </div>
  );
};
