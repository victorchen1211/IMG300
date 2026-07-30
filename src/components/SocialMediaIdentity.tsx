"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import styles from "../app/page.module.scss";

export const SocialMediaIdentity: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Control State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [subjectId, setSubjectId] = useState<string>("0-2727-07");

  // MediaPipe & Animation Refs
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasSnapshotRef = useRef<boolean>(false);
  const lastSnapshotTimeRef = useRef<number>(0);

  // Initialize MediaPipe Face Landmarker
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
    hasSnapshotRef.current = false;
  };

  // Capture B&W Face Snapshot onto offscreen snapshot canvas
  const updateFaceSnapshot = (
    video: HTMLVideoElement,
    srcX: number,
    srcY: number,
    srcW: number,
    srcH: number
  ) => {
    if (!snapshotCanvasRef.current) {
      snapshotCanvasRef.current = document.createElement("canvas");
      snapshotCanvasRef.current.width = 240;
      snapshotCanvasRef.current.height = 280;
    }
    const snapCanvas = snapshotCanvasRef.current;
    const snapCtx = snapCanvas.getContext("2d");
    if (!snapCtx) return;

    snapCtx.save();
    // High contrast Grayscale Noir B&W filter
    snapCtx.filter = "grayscale(100%) contrast(140%) brightness(105%)";
    snapCtx.clearRect(0, 0, 240, 280);

    // Add slight padding around cropped face
    const padX = srcW * 0.3;
    const padY = srcH * 0.4;
    const cropX = Math.max(0, srcX - padX);
    const cropY = Math.max(0, srcY - padY);
    const cropW = Math.min(video.videoWidth - cropX, srcW + padX * 2);
    const cropH = Math.min(video.videoHeight - cropY, srcH + padY * 2);

    snapCtx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, 240, 280);
    snapCtx.restore();

    // Add subtle TV scanline texture effect on snapshot
    snapCtx.fillStyle = "rgba(255, 255, 255, 0.04)";
    for (let y = 0; y < 280; y += 4) {
      snapCtx.fillRect(0, y, 240, 2);
    }

    hasSnapshotRef.current = true;
  };

  // Main Render Loop (AI Surveillance HUD Pipeline)
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
      let detectedBoundingBox: { x: number; y: number; w: number; h: number } | null = null;

      if (faceLandmarkerRef.current) {
        try {
          const results = faceLandmarkerRef.current.detectForVideo(video, now);
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

            // Video source coordinates (unmirrored) for snapshot cropping
            const rawSrcX = minX * video.videoWidth;
            const rawSrcY = minY * video.videoHeight;
            const rawSrcW = (maxX - minX) * video.videoWidth;
            const rawSrcH = (maxY - minY) * video.videoHeight;

            // Canvas coordinates (mirrored for display)
            const boxX = (1 - maxX) * w;
            const boxY = minY * h;
            const boxW = (maxX - minX) * w;
            const boxH = (maxY - minY) * h;

            detectedBoundingBox = { x: boxX, y: boxY, w: boxW, h: boxH };

            // Periodically update B&W face snapshot every 1.5s
            if (!hasSnapshotRef.current || now - lastSnapshotTimeRef.current > 1500) {
              updateFaceSnapshot(video, rawSrcX, rawSrcY, rawSrcW, rawSrcH);
              lastSnapshotTimeRef.current = now;
            }
          } else {
            setFaceDetected(false);
          }
        } catch (e) {
          // Frame skip
        }
      }

      const pinkColor = "#ff0055";

      // 3. Render Target Tracking Box over Detected Face (Hot Pink #ff0055)
      if (detectedBoundingBox) {
        const { x: bX, y: bY, w: bW, h: bH } = detectedBoundingBox;
        ctx.save();
        ctx.strokeStyle = pinkColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(bX, bY, bW, bH);

        // Corner Brackets for Face Box
        const bracket = Math.min(bW, bH) * 0.25;
        ctx.lineWidth = 4;
        ctx.strokeStyle = pinkColor;

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(bX, bY + bracket);
        ctx.lineTo(bX, bY);
        ctx.lineTo(bX + bracket, bY);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(bX + bW - bracket, bY);
        ctx.lineTo(bX + bW, bY);
        ctx.lineTo(bX + bW, bY + bracket);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(bX, bY + bH - bracket);
        ctx.lineTo(bX, bY + bH);
        ctx.lineTo(bX + bracket, bY + bH);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(bX + bW - bracket, bY + bH);
        ctx.lineTo(bX + bW, bY + bH);
        ctx.lineTo(bX + bW, bY + bH - bracket);
        ctx.stroke();

        // Small tag under box
        ctx.fillStyle = pinkColor;
        ctx.font = '700 10px "Space Mono", monospace';
        ctx.fillText("Subject Identified", bX, bY + bH + 16);

        ctx.restore();
      }

      // 4. Render Auxiliary Cyber White Bracket Reticles [ ] in Scene
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2;
      const auxReticles = [
        { x: w * 0.48, y: h * 0.12, size: 28 },
        { x: w * 0.72, y: h * 0.22, size: 36 },
        { x: w * 0.82, y: h * 0.75, size: 32 }
      ];
      auxReticles.forEach((r) => {
        const arm = 8;
        // Top-Left
        ctx.beginPath();
        ctx.moveTo(r.x, r.y + arm);
        ctx.lineTo(r.x, r.y);
        ctx.lineTo(r.x + arm, r.y);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(r.x + r.size - arm, r.y);
        ctx.lineTo(r.x + r.size, r.y);
        ctx.lineTo(r.x + r.size, r.y + arm);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(r.x, r.y + r.size - arm);
        ctx.lineTo(r.x, r.y + r.size);
        ctx.lineTo(r.x + arm, r.y + r.size);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(r.x + r.size - arm, r.y + r.size);
        ctx.lineTo(r.x + r.size, r.y + r.size);
        ctx.lineTo(r.x + r.size, r.y + r.size - arm);
        ctx.stroke();
      });
      ctx.restore();

      // 5. Render Cyber Crime Dossier HUD Panel (Left Side)
      ctx.save();
      const panelX = 36;
      const panelY = 40;
      const panelW = 310;

      // Header Badge "SUBJECT IDENTIFIED"
      ctx.fillStyle = pinkColor;
      ctx.fillRect(panelX, panelY, 190, 28);
      ctx.fillStyle = "#ffffff";
      ctx.font = '700 12px "Space Mono", monospace';
      ctx.fillText("SUBJECT IDENTIFIED", panelX + 12, panelY + 18);

      // B&W Photo Frame Container
      const photoY = panelY + 36;
      const photoW = 240;
      const photoH = 280;

      ctx.strokeStyle = pinkColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(panelX, photoY, photoW, photoH);

      // Draw B&W Face Snapshot if available
      if (hasSnapshotRef.current && snapshotCanvasRef.current) {
        ctx.drawImage(snapshotCanvasRef.current, panelX, photoY, photoW, photoH);
      } else {
        // Placeholder when searching
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(panelX, photoY, photoW, photoH);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = '700 12px "Space Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText("SEARCHING TARGET...", panelX + photoW / 2, photoY + photoH / 2);
        ctx.textAlign = "left";
      }

      // ID Tag Badge
      const idY = photoY + photoH + 12;
      ctx.fillStyle = pinkColor;
      ctx.fillRect(panelX + photoW - 110, idY, 110, 22);
      ctx.fillStyle = "#ffffff";
      ctx.font = '700 11px "Space Mono", monospace';
      ctx.fillText(`ID:${subjectId}`, panelX + photoW - 102, idY + 15);

      // Dossier Text Info Box
      const dossierY = idY + 30;
      const dossierH = 240;

      ctx.fillStyle = "rgba(10, 10, 16, 0.85)";
      ctx.fillRect(panelX, dossierY, panelW, dossierH);
      ctx.strokeStyle = pinkColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(panelX, dossierY, panelW, dossierH);

      // Dossier Text Content
      ctx.fillStyle = "#ffffff";
      ctx.font = '700 10px "Space Mono", monospace';
      let ty = dossierY + 22;

      ctx.fillText("DOSSIER: TARGET AGENT", panelX + 12, ty); ty += 18;
      ctx.fillText("STATUS: TOP SECRET", panelX + 12, ty); ty += 18;
      ctx.fillText("OBJECT: VISUAL ENGINEER", panelX + 12, ty); ty += 22;

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = '400 9px "Space Mono", monospace';
      ctx.fillText("LEGEND: Creative Technologist", panelX + 12, ty); ty += 15;
      ctx.fillText("building interactive WebGL shaders.", panelX + 12, ty); ty += 22;

      ctx.fillStyle = "#ffffff";
      ctx.font = '700 10px "Space Mono", monospace';
      ctx.fillText("TECHNICAL SPECS:", panelX + 12, ty); ty += 18;

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = '400 9px "Space Mono", monospace';
      ctx.fillText("System: Full MediaPipe & Three.js", panelX + 12, ty); ty += 15;
      ctx.fillText("Arsenal: AI Computer Vision & WebGL", panelX + 12, ty); ty += 15;

      // Bottom CTA Button "DETAILED INFORMATION ➔"
      const ctaY = dossierY + dossierH - 32;
      ctx.fillStyle = pinkColor;
      ctx.fillRect(panelX, ctaY, panelW, 32);
      ctx.fillStyle = "#ffffff";
      ctx.font = '700 11px "Space Mono", monospace';
      ctx.fillText("DETAILED INFORMATION  ➔", panelX + 14, ctaY + 20);

      ctx.restore();

      // 6. Render Viewport Outer Four Corner Brackets (Hot Pink #ff0055 L-shaped right angles)
      ctx.save();
      ctx.strokeStyle = pinkColor;
      ctx.lineWidth = 4;
      const margin = 20;
      const cornerLen = 50;

      // Top-Left Outer Corner
      ctx.beginPath();
      ctx.moveTo(margin, margin + cornerLen);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin + cornerLen, margin);
      ctx.stroke();

      // Top-Right Outer Corner
      ctx.beginPath();
      ctx.moveTo(w - margin - cornerLen, margin);
      ctx.lineTo(w - margin, margin);
      ctx.lineTo(w - margin, margin + cornerLen);
      ctx.stroke();

      // Bottom-Left Outer Corner
      ctx.beginPath();
      ctx.moveTo(margin, h - margin - cornerLen);
      ctx.lineTo(margin, h - margin);
      ctx.lineTo(margin + cornerLen, h - margin);
      ctx.stroke();

      // Bottom-Right Outer Corner
      ctx.beginPath();
      ctx.moveTo(w - margin - cornerLen, h - margin);
      ctx.lineTo(w - margin, h - margin);
      ctx.lineTo(w - margin, h - margin - cornerLen);
      ctx.stroke();

      ctx.restore();

      // 7. Render Top-Right Live REC & Timestamp (Blinking Red/Pink Dot + Timestamp)
      ctx.save();
      const recX = w - 190;
      const recY = 44;

      // Date Timestamp
      const d = new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

      ctx.fillStyle = "#ffffff";
      ctx.font = '700 13px "Space Mono", monospace';
      ctx.textAlign = "right";
      ctx.fillText(dateStr, w - 30, recY);

      // Blinking Red Dot
      const isBlinkOn = Math.floor(now / 500) % 2 === 0;
      if (isBlinkOn) {
        ctx.fillStyle = pinkColor;
        ctx.beginPath();
        ctx.arc(w - 180, recY - 4, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = '700 16px "Space Mono", monospace';
      ctx.fillText("REC", w - 130, recY + 1);

      ctx.restore();
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

      ctx.fillStyle = "#ff0055";
      ctx.font = '700 24px "Telegraf", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("START WEBCAM FOR AI SURVEILLANCE DOSSIER", w / 2, h / 2);
    }

    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, [isCameraActive, subjectId]);

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
        <div className={styles.brandSubtitle}>AI Surveillance Identity</div>

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

        {/* AI Target ID Input */}
        <div className={styles.sectionHeader}>
          <span>Target Settings</span>
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Subject ID</span>
          </div>
          <input
            type="text"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px",
              background: "rgba(0,0,0,0.4)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 4,
              fontSize: "12px",
              fontFamily: '"Space Mono", monospace'
            }}
          />
        </div>

        {/* AI Face Detection Status Indicator */}
        <div
          style={{
            background: "rgba(255, 0, 85, 0.1)",
            border: "1px solid rgba(255, 0, 85, 0.3)",
            borderRadius: "6px",
            padding: "10px 12px",
            marginBottom: 20,
            fontSize: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>AI Surveillance</span>
          <span style={{ color: faceDetected ? "#ff0055" : "rgba(255, 255, 255, 0.3)", fontWeight: 700 }}>
            {faceDetected ? "IDENTIFIED" : "SEARCHING..."}
          </span>
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
          AI Cyber Surveillance Identity HUD • Created by Victor Chen
        </div>
      </div>
    </div>
  );
};
