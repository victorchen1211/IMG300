"use client";

import React from "react";
import { MosaicEffectGenerator } from "../../components/MosaicEffectGenerator";

export default function MosaicEffectPage() {
  return (
    <main style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <MosaicEffectGenerator />
    </main>
  );
}
