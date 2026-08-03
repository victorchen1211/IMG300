"use client";

import React, { useState, useRef } from "react";
import styles from "../../app/page.module.scss";
import { PosterLayer } from "../../hooks/useLayerManager";
import { BrikAccordionSection } from "../common/BrikAccordionSection";
import { BrikSliderControl } from "../common/BrikSliderControl";

interface MultiImageControlProps {
  imageLayers: PosterLayer[];
  selectedLayerId: string | null;
  onUploadNewImage: (img: HTMLImageElement, filename?: string) => void;
  onSelectImage: (id: string) => void;
  onUpdateImage: (id: string, updates: Partial<PosterLayer>) => void;
}

export const MultiImageControl: React.FC<MultiImageControlProps> = ({
  imageLayers,
  selectedLayerId,
  onUploadNewImage,
  onSelectImage,
  onUpdateImage
}) => {
  const [hoverAdd, setHoverAdd] = useState(false);
  const newFileInputRef = useRef<HTMLInputElement | null>(null);

  const activeImageIndex = imageLayers.findIndex((l) => l.id === selectedLayerId);
  const activeImage = activeImageIndex >= 0 ? imageLayers[activeImageIndex] : null;

  // Upload New Image Handler
  const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => {
        onUploadNewImage(img, file.name);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <BrikAccordionSection title={`Upload Multiple Images (${imageLayers.length})`} defaultOpen={true}>
      <div style={{ marginBottom: 12 }}>
        {/* Hidden Input for Upload New Image */}
        <input
          type="file"
          accept="image/*"
          ref={newFileInputRef}
          onChange={handleNewFileChange}
          style={{ display: "none" }}
        />

        {/* Image Tabs Header & Add Button */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          {imageLayers.map((img, idx) => (
            <button
              key={img.id}
              style={{
                fontSize: "11px",
                fontWeight: img.id === selectedLayerId ? 800 : 700,
                padding: "6px 10px",
                height: "36px",
                flex: "1 0 auto",
                minWidth: "60px",
                background: img.id === selectedLayerId ? "#000000" : "#ffffff",
                color: img.id === selectedLayerId ? "#ffffff" : "#000000",
                border: "2px solid #000000",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              onClick={() => onSelectImage(img.id)}
            >
              Image {idx + 1}
            </button>
          ))}

          {/* Unified Add Button with Hover Effect & Standard Size */}
          <button
            onMouseEnter={() => setHoverAdd(true)}
            onMouseLeave={() => setHoverAdd(false)}
            style={{
              height: "36px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 800,
              background: "#ffffff",
              color: "#000000",
              border: "2px solid #000000",
              borderRadius: "6px",
              cursor: "pointer",
              flex: "1 0 auto",
              transition: "all 0.15s ease",
              transform: hoverAdd ? "translateY(-1px)" : "none",
              boxShadow: hoverAdd ? "0 4px 12px rgba(0, 0, 0, 0.12)" : "none"
            }}
            onClick={() => newFileInputRef.current?.click()}
          >
            + Add Image
          </button>
        </div>

        {/* Selected Active Image Layer Controls */}
        {activeImage ? (
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#666666",
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span>Image {activeImageIndex + 1}</span>
              <span style={{ fontSize: "10px", color: "#888888", textTransform: "none" }}>
                {activeImage.name}
              </span>
            </div>

            {/* Individual Scale Slider */}
            <BrikSliderControl
              label="Image Scale"
              value={Math.round((activeImage.scale || 1.0) * 100)}
              min={20}
              max={300}
              step={5}
              valueDisplay={`${Math.round((activeImage.scale || 1.0) * 100)}%`}
              onChange={(val) => onUpdateImage(activeImage.id, { scale: val / 100 })}
              marginBottom={10}
            />

            {/* Individual Opacity Slider */}
            <BrikSliderControl
              label="Opacity"
              value={Math.round((activeImage.opacity ?? 1.0) * 100)}
              min={10}
              max={100}
              step={5}
              valueDisplay={`${Math.round((activeImage.opacity ?? 1.0) * 100)}%`}
              onChange={(val) => onUpdateImage(activeImage.id, { opacity: val / 100 })}
              marginBottom={10}
            />
          </div>
        ) : imageLayers.length > 0 ? (
          <div
            style={{
              fontSize: "11px",
              color: "#888888",
              textAlign: "center",
              padding: "10px",
              background: "#f9f9f9",
              borderRadius: "6px"
            }}
          >
            Select an image above or on the canvas to edit its scale & opacity.
          </div>
        ) : null}
      </div>
    </BrikAccordionSection>
  );
};
