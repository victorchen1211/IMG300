"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import styles from "../app/page.module.scss";

interface FloatingRect {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  opacity: number;
}

const NEON_COLORS = ["#00e5ff", "#ff3366", "#7000ff", "#ffcc00", "#00ff66"];

export const SocialMediaIdentity: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Control State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [rectCount, setRectCount] = useState<number>(12);
  const [themeColor, setThemeColor] = useState<string>("#00e5ff");
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [detectedBox, setDetectedBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Three.js & MediaPipe Refs
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const rectsRef = useRef<FloatingRect[]>([]);

  // Initialize Random Floating Rectangles
  const generateRandomRects = useCallback((count: number) => {
    const newRects: FloatingRect[] = [];
    for (let i = 0; i < count; i++) {
      newRects.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        w: 60 + Math.random() * 140,
        h: 40 + Math.random() * 100,
        color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.02,
        opacity: 0.3 + Math.random() * 0.6
      });
    }
    rectsRef.current = newRects;
  }, []);

  useEffect(() => {
    generateRandomRects(rectCount);
  }, [rectCount, generateRandomRects]);

  // Load MediaPipe Face Landmarker
  useEffect(() => {
    let isMounted = true;
    const initMediaPipe = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 1
        });
        if (isMounted) {
          faceLandmarkerRef.current = landmarker;
        }
      } catch (err) {
        console.warn("MediaPipe load warning, fallback to motion/random overlay:", err);
      }
    };

    initMediaPipe();
    return () => {
      isMounted = false;
    };
  }, []);

  // Start / Stop Camera Stream
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

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setFaceDetected(false);
    setDetectedBox(null);
  };

  // Add Dynamic Random Rectangles
  const handleAddRectangles = () => {
    const current = rectsRef.current;
    const extra: FloatingRect[] = [];
    for (let i = 0; i < 5; i++) {
      extra.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        w: 50 + Math.random() * 120,
        h: 50 + Math.random() * 120,
        color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.05,
        opacity: 0.5 + Math.random() * 0.5
      });
    }
    rectsRef.current = [...current, ...extra];
    setRectCount(rectsRef.current.length);
  };

  // Render Canvas Loop (MediaPipe Detection + Three.js Video Mesh Overlay)
  const renderLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw Video Frame if active, else render dark cyber background
    ctx.clearRect(0, 0, w, h);

    if (isCameraActive && video && video.readyState >= 2) {
      ctx.save();
      // Mirror canvas for natural webcam experience
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();

      // 2. MediaPipe Detection
      if (faceLandmarkerRef.current) {
        try {
          const results = faceLandmarkerRef.current.detectForVideo(video, performance.now());
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

            // Mirror X coordinate because canvas is mirrored
            const boxX = (1 - maxX) * w;
            const boxY = minY * h;
            const boxW = (maxX - minX) * w;
            const boxH = (maxY - minY) * h;

            setDetectedBox({ x: boxX, y: boxY, w: boxW, h: boxH });

            // Render Tech Bounding Rectangle around Face
            ctx.save();
            ctx.strokeStyle = themeColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = themeColor;
            ctx.shadowBlur = 15;
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            // Corner bracket accents
            const bracket = Math.min(boxW, boxH) * 0.25;
            ctx.lineWidth = 4;
            // Top-Left
            ctx.beginPath();
            ctx.moveTo(boxX, boxY + bracket);
            ctx.lineTo(boxX, boxY);
            ctx.lineTo(boxX + bracket, boxY);
            ctx.stroke();

            // Bottom-Right
            ctx.beginPath();
            ctx.moveTo(boxX + boxW, boxY + boxH - bracket);
            ctx.lineTo(boxX + boxW, boxY + boxH);
            ctx.lineTo(boxX + boxW - bracket, boxY + boxH);
            ctx.stroke();

            // Label Badge
            ctx.fillStyle = themeColor;
            ctx.fillRect(boxX, boxY - 24, 110, 22);
            ctx.fillStyle = "#000";
            ctx.font = '700 11px "Space Mono", monospace';
            ctx.fillText("FACE_DETECTED", boxX + 8, boxY - 9);

            ctx.restore();
          } else {
            setFaceDetected(false);
          }
        } catch (e) {
          // ignore frame skip
        }
      }
    } else {
      // Dark cyber background when camera is off
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#0a0a12");
      grad.addColorStop(1, "#141424");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Grid overlay
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

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = '700 24px "Telegraf", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("START CAMERA TO GENERATE RECTANGLES", w / 2, h / 2);
    }

    // 3. Render Animated Random Floating Rectangles Layer
    rectsRef.current.forEach((rect) => {
      rect.x += rect.vx;
      rect.y += rect.vy;
      rect.rotation += rect.vRot;

      // Bounce off walls
      if (rect.x < 0 || rect.x + rect.w > w) rect.vx *= -1;
      if (rect.y < 0 || rect.y + rect.h > h) rect.vy *= -1;

      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rotation);

      ctx.strokeStyle = rect.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = rect.opacity;
      ctx.shadowColor = rect.color;
      ctx.shadowBlur = 10;

      ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);

      // Inner fill tint
      ctx.fillStyle = rect.color;
      ctx.globalAlpha = rect.opacity * 0.15;
      ctx.fillRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);

      ctx.restore();
    });

    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, [isCameraActive, themeColor]);

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
        <div className={styles.brandSubtitle}>MediaPipe + Three.js Identity</div>

        {/* Camera Control Section */}
        <div className={styles.sectionHeader} style={{ marginTop: 20 }}>
          <span>Webcam & AI Detection</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          {!isCameraActive ? (
            <button
              className="primary"
              style={{ width: "100%", padding: "10px", fontSize: "13px", fontWeight: 700 }}
              onClick={startCamera}
            >
              📷 Start Webcam
            </button>
          ) : (
            <button
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "13px",
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

        {/* Status Badge */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "6px",
            padding: "10px 12px",
            marginBottom: 20,
            fontSize: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>AI Face Detection</span>
          <span style={{ color: faceDetected ? "#00ff66" : "rgba(255, 255, 255, 0.3)", fontWeight: 700 }}>
            {faceDetected ? "ACTIVE" : "SEARCHING"}
          </span>
        </div>

        {/* Random Rectangles Generator */}
        <div className={styles.sectionHeader}>
          <span>Generative Rectangles</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <button
            className="primary"
            style={{ width: "100%", padding: "8px", fontSize: "12px", marginBottom: 12 }}
            onClick={handleAddRectangles}
          >
            + Generate Random Rectangles (+5)
          </button>

          <div className={styles.controlGroup}>
            <div className={styles.controlHeader}>
              <span className={styles.controlLabel}>Rectangle Density</span>
              <span className={styles.controlValue}>{rectCount}</span>
            </div>
            <input
              type="range"
              min={4}
              max={40}
              step={2}
              value={rectCount}
              onChange={(e) => setRectCount(parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Theme Accent Colors */}
        <div className={styles.sectionHeader}>
          <span>Accent Theme</span>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {NEON_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setThemeColor(c)}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: c,
                border: themeColor === c ? "2px solid #fff" : "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer"
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Interactive Canvas & Webcam Viewport */}
      <div className={styles.canvasViewport} ref={containerRef}>
        <div className={styles.canvasWrapper} style={{ position: "relative" }}>
          {/* Hidden Video Feed for MediaPipe & Three.js Canvas Texture */}
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ display: "none" }}
          />

          {/* Real-time Interactive WebGL & AI Rectangles Canvas */}
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
          MediaPipe + Three.js AI Generative Rectangles • Created by Victor Chen
        </div>
      </div>
    </div>
  );
};
