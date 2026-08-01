"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/page.module.scss";

export const SocialMediaIdentity: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Control State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const animationFrameRef = useRef<number | null>(null);

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

    if (isCameraActive && video && video.readyState >= 2) {
      // Draw Clean Mirrored Live Webcam Stream
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();
    } else {
      // Dark Studio Background when camera is inactive
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "#08080e");
      bgGrad.addColorStop(1, "#12121c");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle background grid accent
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
      ctx.fillText("CLICK START WEBCAM TO OPEN LIVE CAMERA FEED", w / 2, h / 2);
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
      {/* Sidebar Tool Panel - Clean & Minimal */}
      <div className={styles.sidebar}>
        <div className={styles.brandTitle}>IMG300</div>
        <div className={styles.brandSubtitle}>Webcam Live Feed</div>

        {/* Camera Control Section Only */}
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

          {/* Clean Real-time Webcam Canvas */}
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
          IMG300 Studio • Clean Live Webcam Stream View
        </div>
      </div>
    </div>
  );
};
