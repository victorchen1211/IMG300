"use client";

import React from "react";
import styles from "../../app/page.module.scss";

interface ImageUploaderProps {
  hasImage: boolean;
  onUploadImage: (img: HTMLImageElement) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ hasImage, onUploadImage }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      onUploadImage(img);
      // Revoke ObjectURL to immediately free browser memory
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
    e.target.value = "";
  };

  return (
    <div>
      <div className={`${styles.sectionHeader} ${styles.first}`}>
        <span>Upload Image</span>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            display: "block",
            textAlign: "center",
            marginBottom: 8,
            cursor: "pointer",
            padding: "10px 12px",
            background: "#222222",
            color: "#ffffff",
            border: "1.5px solid #222222"
          }}
          className="button"
        >
          {hasImage ? "Replace Image" : "Upload Image"}
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
        </label>
      </div>
    </div>
  );
};
