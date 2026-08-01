"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/page.module.scss";

export const SocialMediaIdentity: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

    // Studio Background
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
      // 1. Render CENTER 20x20 PIXEL MATRIX CANVAS
      const cols = 20;
      const rows = 20;
      const matrixSize = 560; // 560px x 560px
      const matrixX = (w - matrixSize) / 2; // Centered X (360)
      const matrixY = (h - matrixSize) / 2; // Centered Y (80)

      // Offscreen sampling canvas for 20x20 pixel grid
      if (!sampleCanvasRef.current) {
        sampleCanvasRef.current = document.createElement("canvas");
      }
      const oCanvas = sampleCanvasRef.current;
      if (oCanvas.width !== cols || oCanvas.height !== rows) {
        oCanvas.width = cols;
        oCanvas.height = rows;
      }
      const oCtx = oCanvas.getContext("2d");

      if (oCtx) {
        // Draw video frame to 20x20 sample canvas (mirrored)
        oCtx.save();
        oCtx.translate(cols, 0);
        oCtx.scale(-1, 1);
        oCtx.drawImage(video, 0, 0, cols, rows);
        oCtx.restore();

        const sampleImgData = oCtx.getImageData(0, 0, cols, rows).data;

        // Render Center 20x20 Container Backdrop
        ctx.save();
        ctx.fillStyle = "rgba(10, 10, 16, 0.9)";
        ctx.fillRect(matrixX - 10, matrixY - 10, matrixSize + 20, matrixSize + 20);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.strokeRect(matrixX - 10, matrixY - 10, matrixSize + 20, matrixSize + 20);

        const cellW = matrixSize / cols;
        const cellH = matrixSize / rows;

        // Draw 20x20 Real-Time Color Pixel Matrix
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = (r * cols + c) * 4;
            const red = sampleImgData[idx];
            const green = sampleImgData[idx + 1];
            const blue = sampleImgData[idx + 2];

            const px = matrixX + c * cellW;
            const py = matrixY + r * cellH;

            ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
            ctx.fillRect(px, py, cellW - 1, cellH - 1);

            // Grid cell subtle border
            ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, cellW, cellH);
          }
        }

        // Center 20x20 Matrix Title Badge
        ctx.fillStyle = "#ffffff";
        ctx.font = '800 12px "Space Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText("CENTER 20x20 PIXEL CANVAS", matrixX + matrixSize / 2, matrixY - 20);

        ctx.restore();
      }

      // 2. Render LIVE WEBCAM PIP WINDOW IN BOTTOM RIGHT CORNER
      const pipW = 280;
      const pipH = 175;
      const pipX = w - pipW - 30; // 970
      const pipY = h - pipH - 30; // 515

      ctx.save();
      // Outer Shadow & Cyber Frame for Bottom-Right PIP
      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(pipX - 4, pipY - 4, pipW + 8, pipH + 8);

      // Draw Mirrored Live Webcam Feed in Bottom-Right Corner Box
      ctx.save();
      ctx.beginPath();
      ctx.rect(pipX, pipY, pipW, pipH);
      ctx.clip();

      ctx.translate(pipX + pipW, pipY);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, pipW, pipH);
      ctx.restore();

      // Border and Badge for Bottom-Right PIP Window
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 2;
      ctx.strokeRect(pipX, pipY, pipW, pipH);

      // Live PIP Header Tag
      ctx.fillStyle = "rgba(10, 10, 16, 0.85)";
      ctx.fillRect(pipX, pipY, 150, 22);
      ctx.fillStyle = "#00ff22";
      ctx.font = '800 10px "Space Mono", monospace';
      ctx.fillText("● LIVE WEBCAM PIP", pipX + 10, pipY + 15);

      ctx.restore();
    } else {
      // Offline Camera Prompt
      ctx.fillStyle = "#00ff22";
      ctx.font = '700 24px "Telegraf", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("START WEBCAM FOR CENTER 20x20 CANVAS & BOTTOM-RIGHT PIP", w / 2, h / 2);
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
        <div className={styles.brandSubtitle}>20x20 Matrix & Webcam PIP</div>

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
          IMG300 Studio • Center 20x20 Pixel Matrix Grid + Bottom-Right Live Webcam PIP
        </div>
      </div>
    </div>
  );
};
