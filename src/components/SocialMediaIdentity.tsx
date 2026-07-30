"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FilesetResolver, FaceLandmarker, HandLandmarker } from "@mediapipe/tasks-vision";
import styles from "../app/page.module.scss";

const HUD_PRESET_COLORS = [
  "#00ff22", // Neon Lime Green (Reference Image Style)
  "#ff0055", // Hot Pink / Magenta
  "#00e5ff", // Cyber Cyan
  "#ff3b30", // Neon Red
  "#ffcc00", // Electric Amber
  "#9d00ff"  // Deep Violet
];

interface AIAttributes {
  gender: "MALE" | "FEMALE";
  hasHat: boolean;
  hasGlasses: boolean;
  ageRange: string;
  threatLevel: "LOW" | "ELEVATED" | "CRITICAL";
}

export const SocialMediaIdentity: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Control State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [handsDetectedCount, setHandsDetectedCount] = useState<number>(0);
  const [isFistActive, setIsFistActive] = useState<boolean>(false);
  const [manualFaceFill, setManualFaceFill] = useState<boolean>(false);
  const [subjectId, setSubjectId] = useState<string>("0-2727-07");
  const [hudColor, setHudColor] = useState<string>("#00ff22"); // Neon Lime Green Default
  const [recOffsetY, setRecOffsetY] = useState<number>(85);
  const [showExportModal, setShowExportModal] = useState<boolean>(true);
  const [flashOpacity, setFlashOpacity] = useState<number>(0);

  // AI Feature Attribute Recognition State
  const [aiAttributes, setAiAttributes] = useState<AIAttributes>({
    gender: "MALE",
    hasHat: false,
    hasGlasses: false,
    ageRange: "25-32 YRS",
    threatLevel: "LOW"
  });

  // MediaPipe & Animation Refs
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasSnapshotRef = useRef<boolean>(false);
  const lastSnapshotTimeRef = useRef<number>(0);

  // Initialize MediaPipe Face & Hand Landmarkers
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

        // Hand Landmarker Model for AI Hand & Fist Tracking
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
    setHandsDetectedCount(0);
    setIsFistActive(false);
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

      // 2. MediaPipe AI Real-time Face Detection & Attribute Analysis
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

            // Analyze Facial Landmark Ratios
            const jawWidth = Math.abs(landmarks[454].x - landmarks[234].x);
            const faceHeight = Math.abs(landmarks[152].y - landmarks[10].y);
            const jawRatio = jawWidth / (faceHeight || 1);

            const topForeheadY = landmarks[10].y;
            const eyebrowY = landmarks[151].y;
            const foreheadRatio = Math.abs(eyebrowY - topForeheadY);
            const detectedHat = foreheadRatio < 0.04 || minY < 0.05;

            const eyeBridgeDist = Math.abs(landmarks[298].x - landmarks[68].x);
            const detectedGlasses = eyeBridgeDist > 0.22;

            const estimatedGender: "MALE" | "FEMALE" = jawRatio > 0.81 ? "MALE" : "FEMALE";

            setAiAttributes((prev) => ({
              ...prev,
              gender: estimatedGender,
              hasHat: detectedHat,
              hasGlasses: detectedGlasses
            }));

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

      // 3. MediaPipe AI Real-time Hand Detection & Fist Gesture Recognition
      const detectedHandBoxes: { x: number; y: number; w: number; h: number }[] = [];
      let detectedFist = false;

      if (handLandmarkerRef.current) {
        try {
          const handResults = handLandmarkerRef.current.detectForVideo(video, now);
          if (handResults.landmarks && handResults.landmarks.length > 0) {
            setHandsDetectedCount(handResults.landmarks.length);

            handResults.landmarks.forEach((handPoints) => {
              let hMinX = 1, hMaxX = 0, hMinY = 1, hMaxY = 0;
              handPoints.forEach((pt) => {
                if (pt.x < hMinX) hMinX = pt.x;
                if (pt.x > hMaxX) hMaxX = pt.x;
                if (pt.y < hMinY) hMinY = pt.y;
                if (pt.y > hMaxY) hMaxY = pt.y;
              });

              // Check Fist Gesture: finger tips close to wrist relative to palm size
              const wrist = handPoints[0];
              const palmDist = Math.hypot(handPoints[9].x - wrist.x, handPoints[9].y - wrist.y);
              const indexDist = Math.hypot(handPoints[8].x - wrist.x, handPoints[8].y - wrist.y);
              const middleDist = Math.hypot(handPoints[12].x - wrist.x, handPoints[12].y - wrist.y);
              const ringDist = Math.hypot(handPoints[16].x - wrist.x, handPoints[16].y - wrist.y);
              const pinkyDist = Math.hypot(handPoints[20].x - wrist.x, handPoints[20].y - wrist.y);

              if (
                indexDist < palmDist * 1.3 &&
                middleDist < palmDist * 1.3 &&
                ringDist < palmDist * 1.3 &&
                pinkyDist < palmDist * 1.3
              ) {
                detectedFist = true;
              }

              const hPad = 0.02;
              const hBoxX = Math.max(0, (1 - hMaxX - hPad)) * w;
              const hBoxY = Math.max(0, (hMinY - hPad)) * h;
              const hBoxW = Math.min(1, (hMaxX - hMinX + hPad * 2)) * w;
              const hBoxH = Math.min(1, (hMaxY - hMinY + hPad * 2)) * h;

              detectedHandBoxes.push({ x: hBoxX, y: hBoxY, w: hBoxW, h: hBoxH });
            });
          } else {
            setHandsDetectedCount(0);
          }
        } catch (e) {
          // Hand frame skip
        }
      }

      setIsFistActive(detectedFist);

      // 4. Render Target Tracking Box over Detected Face (Fills ONLY the Face Box on Fist Gesture!)
      if (detectedBoundingBox) {
        const { x: bX, y: bY, w: bW, h: bH } = detectedBoundingBox;
        const shouldFillFaceBox = detectedFist || manualFaceFill;

        ctx.save();

        // Fill Face Bounding Box with Solid HUD Accent Color when Fist Gesture is active!
        if (shouldFillFaceBox) {
          ctx.fillStyle = hudColor;
          ctx.globalAlpha = 0.55; // 55% vibrant semi-transparent fill
          ctx.fillRect(bX, bY, bW, bH);
          ctx.globalAlpha = 1.0;
        }

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
        ctx.fillText(shouldFillFaceBox ? "Subject Identified [FIST FILLED]" : "Subject Identified", bX, bY + bH + 16);

        ctx.restore();
      }

      // 5. Render Target Bounding Boxes around Detected Hands
      detectedHandBoxes.forEach((hBox, idx) => {
        ctx.save();
        ctx.strokeStyle = hudColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = hudColor;
        ctx.shadowBlur = 10;
        ctx.strokeRect(hBox.x, hBox.y, hBox.w, hBox.h);

        // Corner Brackets for Hand Box
        const hBracket = Math.min(hBox.w, hBox.h) * 0.25;
        ctx.lineWidth = 4;
        ctx.strokeStyle = hudColor;

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(hBox.x, hBox.y + hBracket);
        ctx.lineTo(hBox.x, hBox.y);
        ctx.lineTo(hBox.x + hBracket, hBox.y);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(hBox.x + hBox.w - hBracket, hBox.y);
        ctx.lineTo(hBox.x + hBox.w, hBox.y);
        ctx.lineTo(hBox.x + hBox.w, hBox.y + hBracket);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(hBox.x, hBox.y + hBox.h - hBracket);
        ctx.lineTo(hBox.x, hBox.y + hBox.h);
        ctx.lineTo(hBox.x + hBracket, hBox.y + hBox.h);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(hBox.x + hBox.w - hBracket, hBox.y + hBox.h);
        ctx.lineTo(hBox.x + hBox.w, hBox.y + hBox.h);
        ctx.lineTo(hBox.x + hBox.w, hBox.y + hBox.h - hBracket);
        ctx.stroke();

        // Label Badge under Hand Box
        ctx.fillStyle = hudColor;
        ctx.font = '700 10px "Space Mono", monospace';
        ctx.fillText(detectedFist ? "✊ FIST GESTURE" : `HAND TRACKED #${idx + 1}`, hBox.x, hBox.y + hBox.h + 15);

        ctx.restore();
      });

      // 6. Render Auxiliary Cyber White Bracket Reticles [ ] in Scene
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

      // 7. Render Cyber Crime Dossier HUD Panel (Left Side)
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
      ctx.fillText(`GENDER: ${aiAttributes.gender}`, panelX + 12, ty); ty += 18;
      ctx.fillText(`HEADWEAR: ${aiAttributes.hasHat ? "HAT DETECTED" : "NONE"}`, panelX + 12, ty); ty += 18;
      ctx.fillText(`GESTURE: ${detectedFist || manualFaceFill ? "✊ FIST (FACE FILLED)" : "NORMAL"}`, panelX + 12, ty); ty += 20;

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = '400 9px "Space Mono", monospace';
      ctx.fillText(`AGE ESTIMATE: ${aiAttributes.ageRange}`, panelX + 12, ty); ty += 15;
      ctx.fillText(`THREAT LEVEL: ${aiAttributes.threatLevel}`, panelX + 12, ty); ty += 20;

      ctx.fillStyle = "#ffffff";
      ctx.font = '700 10px "Space Mono", monospace';
      ctx.fillText("TECHNICAL SPECS:", panelX + 12, ty); ty += 16;

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = '400 9px "Space Mono", monospace';
      ctx.fillText("System: MediaPipe Face & Hand AI", panelX + 12, ty); ty += 14;

      // Bottom CTA Button "DETAILED INFORMATION ➔"
      const ctaY = dossierY + dossierH - 32;
      ctx.fillStyle = hudColor;
      ctx.fillRect(panelX, ctaY, panelW, 32);
      ctx.fillStyle = "#ffffff";
      ctx.font = '700 11px "Space Mono", monospace';
      ctx.fillText("DETAILED INFORMATION  ➔", panelX + 14, ctaY + 20);

      ctx.restore();

      // 8. Render Clean Right-Side Two Stacked Solid Green Info Tag Badges
      ctx.save();
      const tagW = 320;
      const tagH = 26;
      const tagX = w - tagW - 60;
      const tag1Y = 220;
      const tag2Y = 254;

      // --- Tag Badge 1 ---
      ctx.fillStyle = hudColor;
      ctx.fillRect(tagX, tag1Y, tagW, tagH);
      ctx.fillStyle = "#000000";
      ctx.font = '800 11px "Space Mono", monospace';
      ctx.fillText("TOP : YELLOW LONG SLEEVE TEE", tagX + 12, tag1Y + 17);

      // --- Tag Badge 2 ---
      ctx.fillStyle = hudColor;
      ctx.fillRect(tagX, tag2Y, tagW, tagH);
      ctx.fillStyle = "#000000";
      ctx.font = '800 11px "Space Mono", monospace';
      ctx.fillText('SHOE : NIKE AIR MAX 95 "BIG BUBBLE"', tagX + 12, tag2Y + 17);

      ctx.restore();

      // 9. Render SINGLE Clean Line connecting Right Info Tag Badges to Face Box
      if (detectedBoundingBox) {
        ctx.save();
        ctx.strokeStyle = hudColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = hudColor;
        ctx.shadowBlur = 8;
        ctx.setLineDash([]); // 100% Solid Single Line!

        const tagLineStartX = tagX;
        const tagLineStartY = tag2Y + 2;
        const faceRightEdgeX = detectedBoundingBox.x + detectedBoundingBox.w;
        const faceRightEdgeY = detectedBoundingBox.y + detectedBoundingBox.h * 0.4;

        ctx.beginPath();
        ctx.moveTo(tagLineStartX, tagLineStartY);

        const midPolyX = tagLineStartX - (tagLineStartX - faceRightEdgeX) * 0.4;
        ctx.lineTo(midPolyX, tagLineStartY);
        ctx.lineTo(midPolyX, faceRightEdgeY);
        ctx.lineTo(faceRightEdgeX, faceRightEdgeY);
        ctx.stroke();

        ctx.fillStyle = hudColor;
        ctx.beginPath();
        ctx.arc(tagLineStartX, tagLineStartY, 3.5, 0, Math.PI * 2);
        ctx.arc(faceRightEdgeX, faceRightEdgeY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 10. Render Right Side Snapshot Confirmation Pop-up Window
      if (showExportModal) {
        ctx.save();
        const winW = 330;
        const winH = 190;
        const winX = w - winW - 36;
        const winY = h - winH - 30;

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
        const btnH = 40;
        const btnX = winX + 20;
        const btnY = winY + 125;

        ctx.fillStyle = hudColor;
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(btnX + 2, btnY + 2, btnW - 4, btnH - 4);

        ctx.fillStyle = "#ffffff";
        ctx.font = '700 12px "Space Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText("YES, SNAPSHOT DOSSIER (PNG)", btnX + btnW / 2, btnY + 25);

        ctx.restore();
      }

      // 11. Render Viewport Outer Four Corner Brackets
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

      // 12. Render Top-Right Live REC & Timestamp
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
  }, [isCameraActive, subjectId, hudColor, recOffsetY, showExportModal, flashOpacity, aiAttributes, handsDetectedCount, manualFaceFill]);

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

        {/* Fist Gesture & Face Box Fill Section */}
        <div className={styles.sectionHeader}>
          <span>Fist Gesture Face Fill</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <button
            style={{
              width: "100%",
              padding: "9px",
              fontSize: "12px",
              fontWeight: 700,
              color: manualFaceFill ? "#000" : "#fff",
              background: manualFaceFill ? hudColor : "rgba(255, 255, 255, 0.08)",
              border: `1px solid ${hudColor}`
            }}
            onClick={() => setManualFaceFill((prev) => !prev)}
          >
            ✊ {manualFaceFill ? "Face Box Fill ON" : "Toggle Face Fill (or Fist ✊)"}
          </button>
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

        {/* AI Attribute Overrides */}
        <div className={styles.sectionHeader}>
          <span>AI Feature Recognition</span>
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 10 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Gender Classification</span>
          </div>
          <select
            value={aiAttributes.gender}
            onChange={(e) => setAiAttributes((prev) => ({ ...prev, gender: e.target.value as "MALE" | "FEMALE" }))}
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
          >
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
          </select>
        </div>

        <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>Headwear Detection</span>
          </div>
          <select
            value={aiAttributes.hasHat ? "HAT DETECTED" : "NONE"}
            onChange={(e) => setAiAttributes((prev) => ({ ...prev, hasHat: e.target.value === "HAT DETECTED" }))}
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
          >
            <option value="NONE">NONE</option>
            <option value="HAT DETECTED">HAT DETECTED</option>
          </select>
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
              value={hudColor.startsWith("#") ? hudColor : "#00ff22"}
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

        {/* AI Detection Status Indicator */}
        <div
          style={{
            background: `${hudColor}1a`,
            border: `1px solid ${hudColor}4d`,
            borderRadius: "6px",
            padding: "10px 12px",
            marginBottom: 20,
            fontSize: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Face Detection</span>
            <span style={{ color: faceDetected ? hudColor : "rgba(255, 255, 255, 0.3)", fontWeight: 700 }}>
              {faceDetected ? "IDENTIFIED" : "SEARCHING..."}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Fist Face Fill</span>
            <span style={{ color: isFistActive || manualFaceFill ? hudColor : "rgba(255, 255, 255, 0.3)", fontWeight: 700 }}>
              {isFistActive || manualFaceFill ? "✊ FACE FILLED" : "NONE"}
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
