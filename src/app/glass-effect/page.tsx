"use client";

import React from "react";
import { GlassEffectGenerator } from "../../components/GlassEffectGenerator";

export default function GlassEffectPage() {
  return (
    <main style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <GlassEffectGenerator />
    </main>
  );
}
