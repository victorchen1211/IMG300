"use client";

import React, { useState, useRef } from "react";
import { BrikSliderControl } from "../common/BrikSliderControl";

interface MosaicSubjectImageUploaderProps {
  hasImage: boolean;
  onUploadImage: (img: HTMLImageElement) => void;
  subjectScale: number;
  onChangeSubjectScale: (scale: number) => void;
}

export const MosaicSubjectImageUploader: React.FC<MosaicSubjectImageUploaderProps> = ({
  hasImage,
  onUploadImage,
  subjectScale,
  onChangeSubjectScale
}) => {
  const [hover, setHover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => {
        onUploadImage(img);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Upload / Replace Subject Image Button */}
      <button
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: "100%",
          height: "36px",
          padding: "8px 12px",
          fontSize: "12px",
          fontWeight: 800,
          background: "#ffffff",
          color: "#000000",
          border: "2px solid #000000",
          borderRadius: "6px",
          cursor: "pointer",
          transition: "all 0.15s ease",
          transform: hover ? "translateY(-1px)" : "none",
          boxShadow: hover ? "0 4px 12px rgba(0, 0, 0, 0.12)" : "none",
          marginBottom: 14
        }}
      >
        + Add Image
      </button>

      {/* Cutout Subject Size Scale Slider */}
      {hasImage && (
        <div style={{ marginTop: 4 }}>
          <BrikSliderControl
            label="Cutout Subject Size"
            value={subjectScale}
            min={0.2}
            max={2.0}
            step={0.05}
            valueDisplay={`${Math.round(subjectScale * 100)}%`}
            onChange={onChangeSubjectScale}
            marginBottom={10}
          />
        </div>
      )}
    </div>
  );
};
