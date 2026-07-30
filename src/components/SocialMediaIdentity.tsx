"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import styles from "../app/page.module.scss";

const HUD_PRESET_COLORS = [
  "#ff0055", // Hot Pink / Magenta (Default)
  "#00e5ff", // Cyber Cyan
  "#ff3b30", // Neon Red
  "#ffcc00", // Electric Amber
  "#00ff66", // Matrix Green
  "#9d00ff"  // Deep Violet
];

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
  const [hudColor, setHudColor] = useState<string>("#ff0055");
  const [recOffsetY, setRecOffsetY] = useState<number>(85);
  const [showExportModal, setShowExportModal] = useState<boolean>(true);
  const [flashOpacity, setFlashOpacity] = useState<number>(0);

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

    // Add padding around cropped face
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

  // Export Canvas PNG with Camera Flash effect
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Trigger white flash animation
    setFlashOpacity(1.0);
    setTimeout(() => setFlashOpacity(0), 350);

    // Download PNG
    const link = document.createElement("a");
    link.download = `IMG300_Cyber_Dossier_${subjectId}_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
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

            // Update B&W face snapshot every 1.5s
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

      // 3. Render Target Tracking Box over Detected Face (Dynamic Accent Color)
      if (detectedBoundingBox) {
        const { x: bX, y: bY, w: bW, h: bH } = detectedBoundingBox;
        ctx.save();
        ctx.strokeStyle = hudColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = hudColor;
        ctx.shadowBlur = 10;
        ctx.strokeRect(bX, bY, bW, bH);

        // Corner Brackets for Face Box
        const bracket = Math.min(bW, bH) * 0.25;
        ctx.lineWidth = 4;
        ctx.strokeStyle = hudColor;

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

        // Tag under box
        ctx.fillStyle = hudColor;
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
      ctx.fillStyle = hudColor;
      ctx.fillRect(panelX, panelY, 190, 28);
      ctx.fillStyle = "#ffffff";
      ctx.font = '700 12px "Space Mono", monospace';
      ctx.fillText("SUBJECT IDENTIFIED", panelX + 12, panelY + 18);

      // B&W Photo Frame Container
      const photoY = panelY + 36;
      const photoW = 240;
      const photoH = 280;

      ctx.strokeStyle = hudColor;
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
      ctx.fillStyle = hudColor;
      ctx.fillRect(panelX + photoW - 110, idY, 110, 22);
      ctx.fillStyle = "#ffffff";
      ctx.font = '700 11px "Space Mono", monospace';
      ctx.fillText(`ID:${subjectId}`, panelX + photoW - 102, idY + 15);

      // Dossier Text Info Box
      const dossierY = idY + 30;
      const dossierH = 240;

      ctx.fillStyle = "rgba(10, 10, 16, 0.85)";
      ctx.fillRect(panelX, dossierY, panelW, dossierH);
      ctx.strokeStyle = hudColor;
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
      ctx.fillStyle = hudColor;
      ctx.fillRect(panelX, ctaY, panelW, 32);
      ctx.fillStyle = "#ffffff";
      ctx.font = '700 11px "Space Mono", monospace';
      ctx.fillText("DETAILED INFORMATION  ➔", panelX + 14, ctaY + 20);

      ctx.restore();

      // 6. Render Connecting Cyber Wire Line between B&W Photo Snapshot & Target Face Box
      if (detectedBoundingBox) {
        ctx.save();
        const startX = panelX + photoW;
        const startY = photoY + 20;
        const targetX = detectedBoundingBox.x;
        const targetY = detectedBoundingBox.y + 20;

        ctx.strokeStyle = hudColor;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = hudColor;
        ctx.shadowBlur = 8;
        ctx.setLineDash([6, 4]);

        ctx.beginPath();
        ctx.moveTo(startX, startY);

        const midX = startX + (targetX - startX) * 0.45;
        ctx.lineTo(midX, startY);
        ctx.lineTo(midX, targetY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = hudColor;
        ctx.beginPath();
        ctx.arc(startX, startY, 4, 0, Math.PI * 2);
        ctx.arc(targetX, targetY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 7. Render Right Side Snapshot Confirmation Pop-up Window (Matching Reference Image)
      if (showExportModal) {
        ctx.save();
        const winW = 330;
        const winH = 200;
        const winX = w - winW - 36;
        const winY = h - winH - 40;

        // Window Background & Glass Tint
        ctx.fillStyle = "rgba(10, 10, 16, 0.9)";
        ctx.fillRect(winX, winY, winW, winH);
        ctx.strokeStyle = hudColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(winX, winY, winW, winH);

        // Header Title Bar
        ctx.fillStyle = hudColor;
        ctx.fillRect(winX, winY, winW, 30);

        ctx.fillStyle = "#ffffff";
        ctx.font = '700 11px "Space Mono", monospace';
        ctx.fillText("DOSSIER #08-V/PURPLE", winX + 12, winY + 20);

        // Close X Button
        ctx.font = '700 14px "Space Mono", monospace';
        ctx.fillText("✕", winX + winW - 20, winY + 20);

        // Subtitle Text inside window
        ctx.fillStyle = "#ffffff";
        ctx.font = '700 10px "Space Mono", monospace';
        let wy = winY + 52;
        ctx.fillText("STATUS: CONFIDENTIAL TOP SECRET", winX + 12, wy); wy += 20;

        ctx.fillStyle = hudColor;
        ctx.font = '400 9px "Space Mono", monospace';
        ctx.fillText("SNAPSHOT HIGH-RES SURVEILLANCE DOSSIER?", winX + 12, wy);

        // Action Confirmation Button "YES, SNAPSHOT DOSSIER"
        const btnW = 290;
        const btnH = 42;
        const btnX = winX + 20;
        const btnY = winY + 130;

        ctx.fillStyle = hudColor;
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(btnX + 2, btnY + 2, btnW - 4, btnH - 4);

        ctx.fillStyle = "#ffffff";
        ctx.font = '700 12px "Space Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText("YES, SNAPSHOT DOSSIER (PNG)", btnX + btnW / 2, btnY + 26);

        ctx.restore();
      }

      // 8. Render Viewport Outer Four Corner Brackets
      ctx.save();
      ctx.strokeStyle = hudColor;
      ctx.lineWidth = 4;
      const margin = 20;
      const cornerLen = 50;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(margin, margin + cornerLen);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin + cornerLen, margin);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(w - margin - cornerLen, margin);
      ctx.lineTo(w - margin, margin);
      ctx.lineTo(w - margin, margin + cornerLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(margin, h - margin - cornerLen);
      ctx.lineTo(margin, h - margin);
      ctx.lineTo(margin + cornerLen, h - margin);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(w - margin - cornerLen, h - margin);
      ctx.lineTo(w - margin, h - margin);
      ctx.lineTo(w - margin, h - margin - cornerLen);
      ctx.stroke();

      ctx.restore();

      // 9. Render Top-Right Live REC & Timestamp
      ctx.save();
      const timestampY = recOffsetY;
      const recY = recOffsetY + 28;

      // Line 1: Date Timestamp
      const d = new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

      ctx.fillStyle = "#ffffff";
      ctx.font = '700 14px "Space Mono", monospace';
      ctx.textAlign = "right";
      ctx.fillText(dateStr, w - 40, timestampY);

      // Line 2: Blinking Red/HUD Color Dot + REC Text
      const isBlinkOn = Math.floor(now / 500) % 2 === 0;
      if (isBlinkOn) {
        ctx.fillStyle = hudColor;
        ctx.shadowColor = hudColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(w - 95, recY - 5, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = '700 18px "Space Mono", monospace';
      ctx.textAlign = "right";
      ctx.fillText("REC", w - 40, recY);

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

      ctx.fillStyle = hudColor;
      ctx.font = '700 24px "Telegraf", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("START WEBCAM FOR AI SURVEILLANCE DOSSIER", w / 2, h / 2);
    }

    // Render Camera Flash effect layer if triggered
    if (flashOpacity > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, [isCameraActive, subjectId, hudColor, recOffsetY, showExportModal, flashOpacity]);

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

  // Interactive Mouse Click Handler on Canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showExportModal || !isCameraActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 1280;
    const clickY = ((e.clientY - rect.top) / rect.height) * 720;

    // Check hit on YES, SNAPSHOT DOSSIER button (btnX: 930..1220, btnY: 590..635)
    if (clickX >= 930 && clickX <= 1220 && clickY >= 580 && clickY <= 635) {
      handleExportPNG();
    }

    // Check hit on Close X button (winX + winW - 30..winX + winW, winY..winY + 30)
    if (clickX >= 1180 && clickX <= 1220 && clickY >= 460 && clickY <= 490) {
      setShowExportModal(false);
    }
  };

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

        {/* Export Snapshot Action Section */}
        <div className={styles.sectionHeader}>
          <span>Export Snapshot</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <button
            className="primary"
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "12px",
              fontWeight: 700,
              background: hudColor,
              borderColor: hudColor
            }}
            onClick={handleExportPNG}
          >
            📸 Snapshot Full Dossier (PNG)
          </button>
        </div>

        {/* HUD Color Theme Controls */}
        <div className={styles.sectionHeader}>
          <span>HUD Accent Color</span>
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Theme Palette</span>
            <span className={styles.controlValue}>{hudColor.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, marginBottom: 12 }}>
            {HUD_PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setHudColor(c)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: c,
                  border: hudColor.toLowerCase() === c ? "2px solid #fff" : "1px solid rgba(255,255,255,0.2)",
                  cursor: "pointer",
                  padding: 0
                }}
              />
            ))}
            {/* Native Custom Color Picker */}
            <input
              type="color"
              value={hudColor.startsWith("#") ? hudColor : "#ff0055"}
              onChange={(e) => setHudColor(e.target.value)}
              style={{
                width: 26,
                height: 26,
                padding: 0,
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                background: "none"
              }}
              title="Custom Color Picker"
            />
          </div>
        </div>

        {/* REC & Timestamp Position Y Slider */}
        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>HUD Header Y Position</span>
            <span className={styles.controlValue}>{recOffsetY}px</span>
          </div>
          <input
            type="range"
            min={40}
            max={250}
            step={2}
            value={recOffsetY}
            onChange={(e) => setRecOffsetY(parseInt(e.target.value))}
          />
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
            background: `${hudColor}1a`,
            border: `1px solid ${hudColor}4d`,
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
          <span style={{ color: faceDetected ? hudColor : "rgba(255, 255, 255, 0.3)", fontWeight: 700 }}>
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
            onClick={handleCanvasClick}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              borderRadius: "8px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
              cursor: "pointer"
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
