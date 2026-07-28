"use client";

import React from "react";
import { BrandAssetGenerator } from "../../components/BrandAssetGenerator";

export default function BlurAndRevealPage() {
  return (
    <main style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <BrandAssetGenerator />
    </main>
  );
}
