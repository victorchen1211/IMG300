"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FilesetResolver, FaceLandmarker, HandLandmarker } from "@mediapipe/tasks-vision";
import styles from "../app/page.module.scss";

// MediaPipe Face Oval Contour Landmark Indices
const FACE_OVAL_LANDMARKS = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377,
  152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
];

export const SocialMediaIdentity: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sketchOffscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Control State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [isPinchActive, setIsPinchActive] = useState<boolean>(false);
  const [manualSketchMode, setManualSketchMode] = useState<boolean>(false);
  const [gridSize, setGridSize] = useState<number>(20); // Default 20x20 Grid
  const [sketchContrast, setSketchContrast] = useState<number>(1.8);

  // Refs for MediaPipe Models & Animation
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize MediaPipe Face & Hand Landmarker Models
  useEffect(() => {
    let isMounted = true;
    const initMediaPipe = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        // Face Landmarker Model
        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 1
        });

        // Hand Landmarker Model for Index-to-Thumb Pinch Detection
        const handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });

        if (isMounted) {
          faceLandmarkerRef.current = faceLandmarker;
          handLandmarkerRef.current = handLandmarker;
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
    setIsPinchActive(false);
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

    // Dark Cyber Studio Background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#08080e");
    bgGrad.addColorStop(1, "#12121c");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle background grid pattern
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
      // 1. Hand Detection & Pinch Gesture Recognition (Index Tip 8 <-> Thumb Tip 4)
      let detectedPinch = false;
      const detectedHandLandmarks: any[] = [];

      if (handLandmarkerRef.current) {
        try {
          const handResults = handLandmarkerRef.current.detectForVideo(video, now);
          if (handResults.landmarks && handResults.landmarks.length > 0) {
            handResults.landmarks.forEach((handPoints) => {
              detectedHandLandmarks.push(handPoints);
              const thumbTip = handPoints[4];
              const indexTip = handPoints[8];

              if (thumbTip && indexTip) {
                const pinchDist = Math.hypot(
                  thumbTip.x - indexTip.x,
                  thumbTip.y - indexTip.y,
                  (thumbTip.z || 0) - (indexTip.z || 0)
                );

                if (pinchDist < 0.048) {
                  detectedPinch = true;
                }
              }
            });
          }
        } catch (e) {
          // Hand frame skip
        }
      }

      setIsPinchActive(detectedPinch);
      const isSketchActive = detectedPinch || manualSketchMode;

      // 2. MediaPipe AI Real-time Face Detection
      let landmarks: any = null;
      if (faceLandmarkerRef.current) {
        try {
          const results = faceLandmarkerRef.current.detectForVideo(video, now);
          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            setFaceDetected(true);
            landmarks = results.faceLandmarks[0];
          } else {
            setFaceDetected(false);
          }
        } catch (e) {
          // Frame skip
        }
      }

      // 3. Render CENTER 20x20 PIXEL MATRIX CANVAS
      const matrixSize = 560; // 560px x 560px
      const matrixX = (w - matrixSize) / 2; // Centered X (360)
      const matrixY = (h - matrixSize) / 2; // Centered Y (80)

      // Offscreen sampling canvas for 20x20 pixel grid
      const cols = gridSize;
      const rows = gridSize;

      if (!sketchOffscreenCanvasRef.current) {
        sketchOffscreenCanvasRef.current = document.createElement("canvas");
      }
      const oCanvas = sketchOffscreenCanvasRef.current;
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

        // Render 20x20 Center Pixel Grid Container Backdrop
        ctx.save();
        ctx.fillStyle = "rgba(10, 10, 16, 0.9)";
        ctx.fillRect(matrixX - 10, matrixY - 10, matrixSize + 20, matrixSize + 20);
        ctx.strokeStyle = isSketchActive ? "#00ff22" : "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.strokeRect(matrixX - 10, matrixY - 10, matrixSize + 20, matrixSize + 20);

        const cellW = matrixSize / cols;
        const cellH = matrixSize / rows;

        // Draw 20x20 Pixel Matrix Grid Cells
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = (r * cols + c) * 4;
            const red = sampleImgData[idx];
            const green = sampleImgData[idx + 1];
            const blue = sampleImgData[idx + 2];

            const px = matrixX + c * cellW;
            const py = matrixY + r * cellH;

            if (isSketchActive) {
              // --- 20x20 PENCIL SKETCH ART MODE ---
              const gray = 0.299 * red + 0.587 * green + 0.114 * blue;
              let sketchVal = Math.max(0, Math.min(255, (255 - gray) * sketchContrast));

              if (sketchVal > 40) {
                ctx.fillStyle = "#000000";
                ctx.fillRect(px, py, cellW - 1, cellH - 1);
                ctx.strokeStyle = "#00ff22";
                ctx.lineWidth = 1;
                ctx.strokeRect(px + 0.5, py + 0.5, cellW - 1, cellH - 1);
              } else {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(px, py, cellW - 1, cellH - 1);
              }
            } else {
              // --- 20x20 REAL-TIME COLOR PIXEL MATRIX MODE ---
              ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
              ctx.fillRect(px, py, cellW - 1, cellH - 1);

              // Grid cell subtle border
              ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
              ctx.lineWidth = 1;
              ctx.strokeRect(px, py, cellW, cellH);
            }
          }
        }

        // Center 20x20 Matrix Title Badge
        ctx.fillStyle = isSketchActive ? "#00ff22" : "#ffffff";
        ctx.font = '800 12px "Space Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText(
          isSketchActive
            ? `CENTER 20x20 PIXEL CANVAS [👌 SKETCH ACTIVE]`
            : `CENTER 20x20 PIXEL CANVAS [REAL-TIME MATRIX]`,
          matrixX + matrixSize / 2,
          matrixY - 20
        );

        ctx.restore();
      }

      // 4. Render LIVE WEBCAM PIP WINDOW IN BOTTOM RIGHT CORNER
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

      // Border and Neon Badge for Bottom-Right PIP Window
      ctx.strokeStyle = isSketchActive ? "#00ff22" : "#00e5ff";
      ctx.lineWidth = 2;
      ctx.strokeRect(pipX, pipY, pipW, pipH);

      // Live PIP Header Tag
      ctx.fillStyle = "rgba(10, 10, 16, 0.85)";
      ctx.fillRect(pipX, pipY, 150, 22);
      ctx.fillStyle = "#00ff22";
      ctx.font = '800 10px "Space Mono", monospace';
      ctx.fillText("● LIVE WEBCAM PIP", pipX + 10, pipY + 15);

      // Draw Hand Pinch Lines inside PIP Window
      detectedHandLandmarks.forEach((handPoints) => {
        const thumbTip = handPoints[4];
        const indexTip = handPoints[8];
        if (thumbTip && indexTip) {
          const tx = pipX + (1 - thumbTip.x) * pipW;
          const ty = pipY + thumbTip.y * pipH;
          const ix = pipX + (1 - indexTip.x) * pipW;
          const iy = pipY + indexTip.y * pipH;

          ctx.strokeStyle = detectedPinch ? "#00ff22" : "rgba(255, 255, 255, 0.6)";
          ctx.lineWidth = detectedPinch ? 2.5 : 1.5;

          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(ix, iy);
          ctx.stroke();

          ctx.fillStyle = detectedPinch ? "#00ff22" : "#ffffff";
          ctx.beginPath();
          ctx.arc(tx, ty, 3, 0, Math.PI * 2);
          ctx.arc(ix, iy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.restore();
    } else {
      // Offline Camera Prompt
      ctx.fillStyle = "#00ff22";
      ctx.font = '700 24px "Telegraf", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("START WEBCAM FOR CENTER 20x20 CANVAS & BOTTOM-RIGHT PIP", w / 2, h / 2);
    }

    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, [isCameraActive, manualSketchMode, gridSize, sketchContrast]);

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
        <div className={styles.brandSubtitle}>Center 20x20 & Bottom-Right PIP</div>

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

        {/* 20x20 Matrix Grid Controls Section */}
        <div className={styles.sectionHeader}>
          <span>Center Grid Settings</span>
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Grid Matrix Resolution</span>
            <span className={styles.controlValue}>{gridSize}x{gridSize}</span>
          </div>
          <input
            type="range"
            min={10}
            max={40}
            step={2}
            value={gridSize}
            onChange={(e) => setGridSize(parseInt(e.target.value))}
          />
        </div>

        {/* Pinch Sketch Controls Section */}
        <div className={styles.sectionHeader}>
          <span>Pencil Sketch Gesture</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <button
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "12px",
              fontWeight: 700,
              color: manualSketchMode || isPinchActive ? "#000" : "#fff",
              background: manualSketchMode || isPinchActive ? "#00ff22" : "rgba(255, 255, 255, 0.08)",
              border: "1px solid #00ff22"
            }}
            onClick={() => setManualSketchMode((prev) => !prev)}
          >
            👌 {manualSketchMode || isPinchActive ? "Sketch Mode ON" : "Toggle Sketch Mode (or Pinch 👌)"}
          </button>
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
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Webcam Viewport</span>
            <span style={{ color: "#00ff22", fontWeight: 700 }}>
              BOTTOM-RIGHT PIP
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Center Matrix</span>
            <span style={{ color: "#00ff22", fontWeight: 700 }}>
              {gridSize}x{gridSize} GRID
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Pinch Gesture 👌</span>
            <span style={{ color: isPinchActive || manualSketchMode ? "#00ff22" : "rgba(255, 255, 255, 0.4)", fontWeight: 700 }}>
              {isPinchActive || manualSketchMode ? "👌 SKETCH ACTIVE" : "RELEASED"}
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

          {/* Real-time Cyber Canvas */}
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
          AI Cyber Identity • Center 20x20 Pixel Matrix Grid + Bottom-Right Live Webcam PIP Window
        </div>
      </div>
    </div>
  );
};
