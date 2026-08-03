"use client";

import React, { useState, useRef } from "react";
import styles from "../../app/page.module.scss";

interface SingleImageUploaderProps {
  hasImage: boolean;
  onUploadImage: (img: HTMLImageElement) => void;
  label?: string;
}

export const SingleImageUploader: React.FC<SingleImageUploaderProps> = ({
  hasImage,
  onUploadImage,
  label = "Upload Image"
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
      <div className={`${styles.sectionHeader} ${styles.first}`} style={{ marginBottom: 10 }}>
        <span>{label}</span>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

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
    </div>
  );
};
