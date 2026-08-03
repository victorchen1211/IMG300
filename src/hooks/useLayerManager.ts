"use client";

import { useState, useCallback } from "react";

export type LayerType = "image" | "text" | "mask" | "shape";
export type VectorShapeType = "rectangle" | "ellipse" | "polygon";

export interface EllipseCutoutItem {
  id: string;
  offsetX: number; // Horizontal offset relative to mask center
  offsetY: number; // Vertical offset relative to mask center
  radiusX: number; // Ellipse width radius
  radiusY: number; // Ellipse height radius
  rotation: number; // Rotation angle in degrees
}

export function generateRandomEllipseCutouts(count: number = 4): EllipseCutoutItem[] {
  const items: EllipseCutoutItem[] = [];
  const safeCount = Math.max(3, Math.min(8, count));
  for (let i = 0; i < safeCount; i++) {
    const angle = (i / safeCount) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
    const dist = 60 + Math.random() * 120;
    items.push({
      id: `ellipse-${i}-${Date.now()}`,
      offsetX: Math.round(Math.cos(angle) * dist),
      offsetY: Math.round(Math.sin(angle) * dist),
      radiusX: 75,
      radiusY: 45,
      rotation: Math.round(Math.random() * 180)
    });
  }
  return items;
}

export interface PosterLayer {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  posX: number; // 0 to 1 relative to canvas width
  posY: number; // 0 to 1 relative to canvas height
  scale: number; // Scale factor (default 1.0)
  opacity?: number; // Opacity factor (0 to 1.0)
  // Image Specific Props
  imageElement?: HTMLImageElement;
  imageSrc?: string;
  // Text Specific Props
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  // Mask Specific Props
  maskColor?: string;
  maskOpacity?: number;
  ellipseCutouts?: EllipseCutoutItem[];
  // Shape Specific Props
  vectorShapeType?: VectorShapeType;
  isCutout?: boolean;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  rotation?: number; // 0° to 360°
  sides?: number; // Polygon sides (3 to 10)
  aspectRatio?: number; // Aspect stretch factor for ellipse/rectangle (0.2 to 3.0)
}

export function useLayerManager(initialLayers: PosterLayer[] = []) {
  const [layers, setLayers] = useState<PosterLayer[]>(initialLayers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    initialLayers.length > 0 ? initialLayers[0].id : null
  );

  // Add a new Text Layer
  const addTextLayer = useCallback((initialText: string = "SWISS POSTER") => {
    const newId = `text-${Date.now()}`;
    const newLayer: PosterLayer = {
      id: newId,
      type: "text",
      name: `Text ${newId.slice(-4)}`,
      visible: true,
      posX: 0.5,
      posY: 0.5,
      scale: 1.0,
      opacity: 1.0,
      text: initialText,
      fontSize: 64,
      fontFamily: '"Telegraf", system-ui, sans-serif',
      color: "#000000",
      textAlign: "center"
    };

    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newId);
    return newId;
  }, []);

  // Add a new Image Layer
  const addImageLayer = useCallback((img: HTMLImageElement, filename?: string) => {
    const newId = `image-${Date.now()}`;
    const newLayer: PosterLayer = {
      id: newId,
      type: "image",
      name: filename || `Image ${newId.slice(-4)}`,
      visible: true,
      posX: 0.5,
      posY: 0.5,
      scale: 1.0,
      opacity: 1.0,
      imageElement: img,
      imageSrc: img.src
    };

    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newId);
    return newId;
  }, []);

  // Add a new Mask Layer
  const addMaskLayer = useCallback(() => {
    const newId = `mask-${Date.now()}`;
    const newLayer: PosterLayer = {
      id: newId,
      type: "mask",
      name: `Mask ${newId.slice(-4)}`,
      visible: true,
      posX: 0.5,
      posY: 0.5,
      scale: 1.0,
      opacity: 1.0,
      maskColor: "#000000",
      maskOpacity: 0.85,
      ellipseCutouts: generateRandomEllipseCutouts(4)
    };

    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newId);
    return newId;
  }, []);

  // Add a new Vector Shape Layer
  const addShapeLayer = useCallback((shapeType: VectorShapeType = "rectangle") => {
    const newId = `shape-${Date.now()}`;
    const newLayer: PosterLayer = {
      id: newId,
      type: "shape",
      name: `Shape ${newId.slice(-4)}`,
      visible: true,
      posX: 0.5,
      posY: 0.5,
      scale: 1.0,
      opacity: 1.0,
      vectorShapeType: shapeType,
      fillColor: "#ff3b30",
      strokeColor: "#000000",
      strokeWidth: 0,
      rotation: 0,
      sides: 5,
      aspectRatio: 1.0
    };

    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newId);
    return newId;
  }, []);

  // Remove a Layer
  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => {
      const next = prev.filter((l) => l.id !== id);
      if (selectedLayerId === id) {
        setSelectedLayerId(next.length > 0 ? next[next.length - 1].id : null);
      }
      return next;
    });
  }, [selectedLayerId]);

  // Update properties of a layer
  const updateLayer = useCallback((id: string, updates: Partial<PosterLayer>) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  }, []);

  // Toggle Visibility
  const toggleVisibility = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  }, []);

  // Reorder Layers Array by index
  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setLayers((prev) => {
      if (
        fromIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex < 0 ||
        toIndex >= prev.length
      ) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  // Reorder Layers Array by ID for Drag-and-Drop
  const reorderLayersById = useCallback((draggedId: string, targetId: string) => {
    setLayers((prev) => {
      const fromIndex = prev.findIndex((l) => l.id === draggedId);
      const toIndex = prev.findIndex((l) => l.id === targetId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  // Move Layer Up (Bring Forward in Z-Stack)
  const moveLayerUp = useCallback((id: string) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx + 1];
      next[idx + 1] = temp;
      return next;
    });
  }, []);

  // Move Layer Down (Send Backward in Z-Stack)
  const moveLayerDown = useCallback((id: string) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx - 1];
      next[idx - 1] = temp;
      return next;
    });
  }, []);

  // Bring to Front (Top of Z-Stack)
  const bringToFront = useCallback((id: string) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const next = prev.filter((l) => l.id !== id);
      const target = prev[idx];
      return [...next, target];
    });
  }, []);

  // Send to Back (Bottom of Z-Stack)
  const sendToBack = useCallback((id: string) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx <= 0) return prev;
      const next = prev.filter((l) => l.id !== id);
      const target = prev[idx];
      return [target, ...next];
    });
  }, []);

  return {
    layers,
    selectedLayerId,
    setSelectedLayerId,
    addTextLayer,
    addImageLayer,
    addMaskLayer,
    addShapeLayer,
    removeLayer,
    updateLayer,
    toggleVisibility,
    reorderLayers,
    reorderLayersById,
    moveLayerUp,
    moveLayerDown,
    bringToFront,
    sendToBack
  };
}
