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

  // Real-time Pencil Sketch Shader & Cross-Hatch Rendering Engine
  const renderPencilSketch = (
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    landmarks: any[],
    canvasW: number,
    canvasH: number
  ) => {
    // 1. Compute Face Bounding Box
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

    // 2. Offscreen canvas for Sobel Pencil Edge Extraction
    const sampleW = Math.max(120, Math.floor(boxW / 2));
    const sampleH = Math.max(120, Math.floor(boxH / 2));

    if (!sketchOffscreenCanvasRef.current) {
      sketchOffscreenCanvasRef.current = document.createElement("canvas");
    }
    const oCanvas = sketchOffscreenCanvasRef.current;
    if (oCanvas.width !== sampleW || oCanvas.height !== sampleH) {
      oCanvas.width = sampleW;
      oCanvas.height = sampleH;
    }
    const oCtx = oCanvas.getContext("2d");
    if (!oCtx) return;

    // Video crop coordinates
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

    const srcImgData = oCtx.getImageData(0, 0, sampleW, sampleH);
    const srcData = srcImgData.data;

    // Grayscale Luminance Map
    const gray = new Float32Array(sampleW * sampleH);
    for (let i = 0; i < sampleW * sampleH; i++) {
      const r = srcData[i * 4];
      const g = srcData[i * 4 + 1];
      const b = srcData[i * 4 + 2];
      gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    const outImgData = oCtx.createImageData(sampleW, sampleH);
    const outData = outImgData.data;

    // Sobel Edge Detection + Cross-Hatching Pencil Shader
    for (let y = 1; y < sampleH - 1; y++) {
      for (let x = 1; x < sampleW - 1; x++) {
        const idx = y * sampleW + x;

        // Sobel Gradient Kernels
        const gx =
          -gray[idx - sampleW - 1] + gray[idx - sampleW + 1] +
          -2 * gray[idx - 1] + 2 * gray[idx + 1] +
          -gray[idx + sampleW - 1] + gray[idx + sampleW + 1];

        const gy =
          -gray[idx - sampleW - 1] - 2 * gray[idx - sampleW] - gray[idx - sampleW + 1] +
          gray[idx + sampleW - 1] + 2 * gray[idx + sampleW] + gray[idx + sampleW + 1];

        const edge = Math.sqrt(gx * gx + gy * gy) * sketchContrast;
        const lum = gray[idx];

        // Charcoal Graphite Intensity (0 = Paper White, 255 = Charcoal Dark)
        let charcoal = edge;

        // Add Cross-Hatch Pencil Shading in dark areas
        if (lum < 110) {
          if ((x + y) % 4 === 0) charcoal += (110 - lum) * 0.9;
        }
        if (lum < 60) {
          if ((x - y) % 4 === 0) charcoal += (60 - lum) * 1.1;
        }

        const pencilVal = Math.max(0, Math.min(255, 255 - charcoal));

        const outIdx = idx * 4;
        outData[outIdx] = pencilVal;     // R
        outData[outIdx + 1] = pencilVal; // G
        outData[outIdx + 2] = pencilVal; // B
        outData[outIdx + 3] = 245;       // Alpha
      }
    }

    oCtx.putImageData(outImgData, 0, 0);

    // 3. Render Pencil Sketch clipped strictly to Face Oval Contour
    ctx.save();
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
    ctx.clip();

    // Draw processed Pencil Sketch Canvas over Face
    ctx.drawImage(oCanvas, boxX, boxY, boxW, boxH);

    // Subtle Graphite Pencil Outline Badge
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

      // 2. MediaPipe HandLandmarker Pinch Gesture Detection (Index Tip 8 <-> Thumb Tip 4)
      let detectedPinch = false;
      const detectedHandLandmarks: any[] = [];

      if (handLandmarkerRef.current) {
        try {
          const handResults = handLandmarkerRef.current.detectForVideo(video, now);
          if (handResults.landmarks && handResults.landmarks.length > 0) {
            handResults.landmarks.forEach((handPoints) => {
              detectedHandLandmarks.push(handPoints);
              const thumbTip = handPoints[4]; // Thumb tip
              const indexTip = handPoints[8]; // Index finger tip

              if (thumbTip && indexTip) {
                const pinchDist = Math.hypot(
                  thumbTip.x - indexTip.x,
                  thumbTip.y - indexTip.y,
                  (thumbTip.z || 0) - (indexTip.z || 0)
                );

                // Pinch threshold: distance < 0.048
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

      // 3. MediaPipe AI Real-time Face Detection
      if (faceLandmarkerRef.current) {
        try {
          const results = faceLandmarkerRef.current.detectForVideo(video, now);
          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            setFaceDetected(true);
            const landmarks = results.faceLandmarks[0];

            // Render Pencil Sketch Art Effect over Face Contour when Pinching
            if (isSketchActive) {
              renderPencilSketch(ctx, video, landmarks, w, h);
            }
          } else {
            setFaceDetected(false);
          }
        } catch (e) {
          // Frame skip
        }
      }

      // 4. Render Hand Pinch Indicator Target Lines over Hands
      detectedHandLandmarks.forEach((handPoints) => {
        const thumbTip = handPoints[4];
        const indexTip = handPoints[8];
        if (thumbTip && indexTip) {
          const tx = (1 - thumbTip.x) * w;
          const ty = thumbTip.y * h;
          const ix = (1 - indexTip.x) * w;
          const iy = indexTip.y * h;

          ctx.save();
          ctx.strokeStyle = detectedPinch ? "#00ff22" : "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = detectedPinch ? 3 : 1.5;

          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(ix, iy);
          ctx.stroke();

          ctx.fillStyle = detectedPinch ? "#00ff22" : "#ffffff";
          ctx.beginPath();
          ctx.arc(tx, ty, 4, 0, Math.PI * 2);
          ctx.arc(ix, iy, 4, 0, Math.PI * 2);
          ctx.fill();

          if (detectedPinch) {
            ctx.font = '800 11px "Space Mono", monospace';
            ctx.fillText("👌 PINCH (SKETCH)", ix + 10, iy);
          }

          ctx.restore();
        }
      });
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
      ctx.fillText("PINCH INDEX TO THUMB 👌 FOR FACE PENCIL SKETCH ART", w / 2, h / 2);
    }

    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, [isCameraActive, manualSketchMode, sketchContrast]);

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
        <div className={styles.brandSubtitle}>Pinch Gesture Face Sketch</div>

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

        {/* Pencil Sketch Controls Section */}
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

        {/* Sketch Contrast Slider */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Pencil Edge Contrast</span>
            <span className={styles.controlValue}>{sketchContrast.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={1.0}
            max={3.0}
            step={0.1}
            value={sketchContrast}
            onChange={(e) => setSketchContrast(parseFloat(e.target.value))}
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
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Pinch Gesture 👌</span>
            <span style={{ color: isPinchActive || manualSketchMode ? "#00ff22" : "rgba(255, 255, 255, 0.4)", fontWeight: 700 }}>
              {isPinchActive || manualSketchMode ? "👌 SKETCH ACTIVE" : "RELEASED"}
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
          AI Pinch Gesture Face Sketch Art • Pinch Index & Thumb 👌 to Transform Face into Pencil Portrait
        </div>
      </div>
    </div>
  );
};
