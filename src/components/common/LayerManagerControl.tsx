"use client";

import React, { useState } from "react";
import styles from "../../app/page.module.scss";
import { PosterLayer } from "../../hooks/useLayerManager";
import { BrikAccordionSection } from "./BrikAccordionSection";

interface LayerManagerControlProps {
  layers: PosterLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onRemoveLayer: (id: string) => void;
  onReorderLayers: (draggedId: string, targetId: string) => void;
}

export const LayerManagerControl: React.FC<LayerManagerControlProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onRemoveLayer,
  onReorderLayers
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Display layers in top-to-bottom stack order (reverse of array index)
  const displayLayers = [...layers].reverse();

  // Drag and Drop Handlers for List Item Reordering
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = (id: string) => {
    if (dragOverId === id) {
      setDragOverId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain") || draggedId;
    if (sourceId && sourceId !== targetId) {
      onReorderLayers(sourceId, targetId);
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <BrikAccordionSection title={`Layers (${layers.length})`} defaultOpen={true}>
      <div style={{ marginBottom: 12 }}>
        {/* Drag and Drop Layer List Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {displayLayers.length === 0 ? (
            <div
              style={{
                fontSize: "11px",
                color: "#888888",
                textAlign: "center",
                padding: "14px 0",
                background: "#f8f9fa",
                borderRadius: "8px",
                border: "1px dashed #e2e8f0"
              }}
            >
              No layers yet. Upload an image or add text.
            </div>
          ) : (
            displayLayers.map((layer) => {
              const isSelected = selectedLayerId === layer.id;
              const isDraggingThis = draggedId === layer.id;
              const isDragOverThis = dragOverId === layer.id;

              // Separate layer types to find exact 1-based index (Image 1, Text 1, Mask 1, Shape 1)
              const imageLayers = layers.filter((l) => l.type === "image");
              const textLayers = layers.filter((l) => l.type === "text");
              const maskLayers = layers.filter((l) => l.type === "mask");
              const shapeLayers = layers.filter((l) => l.type === "shape");

              let displayText = "";
              if (layer.type === "text") {
                const textIdx = textLayers.findIndex((l) => l.id === layer.id) + 1;
                displayText = `Text ${textIdx}: ${layer.text || "Untitled"}`;
              } else if (layer.type === "mask") {
                const maskIdx = maskLayers.findIndex((l) => l.id === layer.id) + 1;
                displayText = `Mask ${maskIdx}`;
              } else if (layer.type === "shape") {
                const shapeIdx = shapeLayers.findIndex((l) => l.id === layer.id) + 1;
                displayText = `Shape ${shapeIdx} (${layer.vectorShapeType || "rectangle"})`;
              } else {
                const imgIdx = imageLayers.findIndex((l) => l.id === layer.id) + 1;
                displayText = `Image ${imgIdx}`;
              }

              return (
                <div
                  key={layer.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, layer.id)}
                  onDragOver={(e) => handleDragOver(e, layer.id)}
                  onDragLeave={() => handleDragLeave(layer.id)}
                  onDrop={(e) => handleDrop(e, layer.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelectLayer(layer.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: isSelected ? "#000000" : "#ffffff",
                    color: isSelected ? "#ffffff" : "#111111",
                    border: isDragOverThis
                      ? "2px dashed #000000"
                      : isSelected
                        ? "1.5px solid #000000"
                        : "1px solid #e2e8f0",
                    borderRadius: "8px",
                    cursor: isDraggingThis ? "grabbing" : "grab",
                    opacity: isDraggingThis ? 0.4 : 1,
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
                    userSelect: "none"
                  }}
                >
                  {/* Left: Layer Display Name with Ellipsis */}
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      flex: 1,
                      paddingRight: "8px"
                    }}
                    title={displayText}
                  >
                    {displayText}
                  </span>

                  {/* Right: Trash Bin SVG Icon Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveLayer(layer.id);
                    }}
                    style={{
                      padding: "4px",
                      background: "transparent",
                      border: "none",
                      color: isSelected ? "#ffffff" : "#666666",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "4px",
                      transition: "color 0.15s ease"
                    }}
                    title="Delete Layer"
                  >
                    {/* SVG Trash Can Icon */}
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BrikAccordionSection>
  );
};
