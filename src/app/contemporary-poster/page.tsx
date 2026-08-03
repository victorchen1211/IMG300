"use client";

import React from "react";
import { ContemporaryPosterGenerator } from "@/components";

export default function ContemporaryPosterPage() {
  return (
    <main style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <ContemporaryPosterGenerator />
    </main>
  );
}
