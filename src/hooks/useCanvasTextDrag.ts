"use client";

import { useState, useRef, useCallback } from "react";
import { PosterLayer } from "./useLayerManager";

interface UseCanvasTextDragOptions {
  layers: PosterLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, updates: Partial<PosterLayer>) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  enabled?: boolean;
}

export function useCanvasTextDrag({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  canvasRef,
  enabled = true
}: UseCanvasTextDragOptions) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);

  // Store drag origin coordinates
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    startPosX: number;
    startPosY: number;
    id: string;
    cutoutIndex?: number;
  } | null>(null);

  // Helper to convert MouseEvent into Canvas coordinate space
  const getCanvasCoordinates = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      return { mouseX, mouseY, canvasWidth: canvas.width, canvasHeight: canvas.height };
    },
    [canvasRef]
  );

  // Mouse Down Event: Detect if user clicked on any Layer (Image, Text, or Mask Ellipse Cutout)
  const onMouseDownCanvas = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!enabled) return;
      const coords = getCanvasCoordinates(e);
      if (!coords) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      const { mouseX, mouseY, canvasWidth, canvasHeight } = coords;

      // Reverse iterate so top-most layers are tested first
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (!layer.visible) continue;

        const posX = canvasWidth * layer.posX;
        const posY = canvasHeight * layer.posY;

        let minX = 0;
        let maxX = 0;
        let minY = 0;
        let maxY = 0;
        const padding = 20; // Grab hit target padding

        if (layer.type === "image" && layer.imageElement) {
          const imgW = layer.imageElement.naturalWidth || 400;
          const imgH = layer.imageElement.naturalHeight || 300;
          const drawW = imgW * (layer.scale || 1.0);
          const drawH = imgH * (layer.scale || 1.0);

          minX = posX - drawW / 2 - padding;
          maxX = posX + drawW / 2 + padding;
          minY = posY - drawH / 2 - padding;
          maxY = posY + drawH / 2 + padding;
        } else if (layer.type === "text" && layer.text) {
          const lines = layer.text.split("\n");
          let maxLineWidth = 0;

          if (ctx) {
            ctx.font = `700 ${layer.fontSize || 48}px ${layer.fontFamily || "sans-serif"}`;
            lines.forEach((line) => {
              const w = ctx.measureText(line).width;
              if (w > maxLineWidth) maxLineWidth = w;
            });
          }

          if (maxLineWidth === 0) {
            maxLineWidth = (layer.fontSize || 48) * 0.65 * Math.max(...lines.map((l) => l.length));
          }

          const lineHeight = (layer.fontSize || 48) * 1.2;
          const totalHeight = lines.length * lineHeight;

          minX = posX - maxLineWidth / 2 - padding;
          maxX = posX + maxLineWidth / 2 + padding;

          if (layer.textAlign === "left") {
            minX = posX - padding;
            maxX = posX + maxLineWidth + padding;
          } else if (layer.textAlign === "right") {
            minX = posX - maxLineWidth - padding;
            maxX = posX + padding;
          }

          minY = posY - totalHeight / 2 - padding;
          maxY = posY + totalHeight / 2 + padding;
        } else if (layer.type === "mask") {
          const maskW = canvasWidth * (layer.scale || 1.0);
          const maskH = canvasHeight * (layer.scale || 1.0);

          minX = posX - maskW / 2 - padding;
          maxX = posX + maskW / 2 + padding;
          minY = posY - maskH / 2 - padding;
          maxY = posY + maskH / 2 + padding;
        } else if (layer.type === "shape") {
          const aspect = layer.aspectRatio ?? 1.0;
          const shapeW = 200 * (layer.scale || 1.0) * aspect;
          const shapeH = 200 * (layer.scale || 1.0);

          minX = posX - shapeW / 2 - padding;
          maxX = posX + shapeW / 2 + padding;
          minY = posY - shapeH / 2 - padding;
          maxY = posY + shapeH / 2 + padding;
        }

        // Check hit
        if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY) {
          onSelectLayer(layer.id);
          setIsDragging(true);
          setDraggedLayerId(layer.id);

          dragStartRef.current = {
            mouseX,
            mouseY,
            startPosX: layer.posX,
            startPosY: layer.posY,
            id: layer.id
          };
          return;
        }
      }
    },
    [enabled, layers, getCanvasCoordinates, canvasRef, onSelectLayer]
  );

  // Mouse Move Event: Drag active layer or individual ellipse cutout
  const onMouseMoveCanvas = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !dragStartRef.current) return;

      const coords = getCanvasCoordinates(e);
      if (!coords) return;

      const { mouseX, mouseY, canvasWidth, canvasHeight } = coords;
      const dragStart = dragStartRef.current;

      const deltaX = mouseX - dragStart.mouseX;
      const deltaY = mouseY - dragStart.mouseY;

      // Dragging layer position
      const newPosX = Math.max(-0.5, Math.min(1.5, dragStart.startPosX + deltaX / canvasWidth));
      const newPosY = Math.max(-0.5, Math.min(1.5, dragStart.startPosY + deltaY / canvasHeight));

      onUpdateLayer(dragStart.id, {
        posX: newPosX,
        posY: newPosY
      });
    },
    [isDragging, getCanvasCoordinates, layers, onUpdateLayer]
  );

  // Mouse Up / Mouse Leave Events
  const onMouseUpCanvas = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedLayerId(null);
      dragStartRef.current = null;
    }
  }, [isDragging]);

  const onMouseLeaveCanvas = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedLayerId(null);
      dragStartRef.current = null;
    }
  }, [isDragging]);

  return {
    onMouseDownCanvas,
    onMouseMoveCanvas,
    onMouseUpCanvas,
    onMouseLeaveCanvas,
    isDragging,
    draggedLayerId,
    cursor: isDragging ? "grabbing" : "pointer"
  };
}
