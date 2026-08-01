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

  // Refs for MediaPipe & Live Bounding Box
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const activeBoxRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

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
    activeBoxRef.current = null;
  };

  // Main Render Loop - Step 1: Real-Time Dynamic Face Tracking Bounding Box
  const renderLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (isCameraActive && video && video.readyState >= 2) {
      // 1. Draw Clean Mirrored Live Webcam Feed
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();

      // 2. Perform AI Face Landmark Detection
      if (faceLandmarkerRef.current) {
        try {
          const nowMs = performance.now();
          if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            const results = faceLandmarkerRef.current.detectForVideo(video, nowMs);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              setFaceDetected(true);
              const landmarks = results.faceLandmarks[0];

              // Calculate bounding box across all face landmarks (jaw, eyes, nose, mouth, forehead)
              let minX = 1, maxX = 0, minY = 1, maxY = 0;
              landmarks.forEach((pt) => {
                if (pt.x < minX) minX = pt.x;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.y > maxY) maxY = pt.y;
              });

              const padding = 20;
              // Mirrored Canvas Calculation
              const targetX = (1 - maxX) * w - padding;
              const targetY = minY * h - padding;
              const targetW = (maxX - minX) * w + padding * 2;
              const targetH = (maxY - minY) * h + padding * 2;

              // Smooth 60FPS motion tracking interpolation
              if (!activeBoxRef.current) {
                activeBoxRef.current = { x: targetX, y: targetY, w: targetW, h: targetH };
              } else {
                const lerpSpeed = 0.4;
                activeBoxRef.current = {
                  x: activeBoxRef.current.x + (targetX - activeBoxRef.current.x) * lerpSpeed,
                  y: activeBoxRef.current.y + (targetY - activeBoxRef.current.y) * lerpSpeed,
                  w: activeBoxRef.current.w + (targetW - activeBoxRef.current.w) * lerpSpeed,
                  h: activeBoxRef.current.h + (targetH - activeBoxRef.current.h) * lerpSpeed
                };
              }
            } else {
              setFaceDetected(false);
              activeBoxRef.current = null;
            }
          }
        } catch (e) {
          // Detection frame skip
        }
      }

      // 3. Render Real-Time Dynamic Green Bounding Box
      const currBox = activeBoxRef.current;
      if (currBox) {
        const { x: boxX, y: boxY, w: boxW, h: boxH } = currBox;

        ctx.save();
        // Green Bounding Rectangle
        ctx.strokeStyle = "#00ff22";
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Cyber Corner Brackets
        const bracketLength = 25;
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#00ff22";

        // Top-Left Corner
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + bracketLength);
        ctx.lineTo(boxX, boxY);
        ctx.lineTo(boxX + bracketLength, boxY);
        ctx.stroke();

        // Top-Right Corner
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - bracketLength, boxY);
        ctx.lineTo(boxX + boxW, boxY);
        ctx.lineTo(boxX + boxW, boxY + bracketLength);
        ctx.stroke();

        // Bottom-Left Corner
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + boxH - bracketLength);
        ctx.lineTo(boxX, boxY + boxH);
        ctx.lineTo(boxX + bracketLength, boxY + boxH);
        ctx.stroke();

        // Bottom-Right Corner
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - bracketLength, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH - bracketLength);
        ctx.stroke();

        // Top Label Tag: FACE DETECTED
        ctx.fillStyle = "rgba(0, 255, 34, 0.25)";
        ctx.fillRect(boxX, boxY - 26, 140, 22);
        ctx.strokeStyle = "#00ff22";
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY - 26, 140, 22);

        ctx.fillStyle = "#00ff22";
        ctx.font = '800 11px "Space Mono", monospace';
        ctx.fillText("● FACE DETECTED", boxX + 10, boxY - 10);

        ctx.restore();
      }
    } else {
      // Dark Studio Background when camera is inactive
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "#08080e");
      bgGrad.addColorStop(1, "#12121c");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Background grid accent
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
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

      ctx.fillStyle = "#00ff22";
      ctx.font = '700 24px "Telegraf", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("START WEBCAM FOR STEP 1: DYNAMIC FACE TRACKING BOUNDING BOX", w / 2, h / 2);
    }

    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, [isCameraActive]);

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
        <div className={styles.brandSubtitle}>Step 1: AI Dynamic Face Tracking</div>

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
          Step 1: Real-Time Dynamic Face Motion Tracking Bounding Box HUD
        </div>
      </div>
    </div>
  );
};
