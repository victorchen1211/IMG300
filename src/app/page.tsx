"use client";

import React from "react";
import styles from "./page.module.scss";
import { GalleryCard, CardData } from "../components/GalleryCard";

const CARDS: CardData[] = [
  {
    id: "blur-and-reveal",
    title: "Blur & Reveal",
    author: "Created By Victor Chen",
    href: "/blur-and-reveal",
    image: "/images/carousel/blur-and-reveal/image1.png",
    images: [
      "/images/carousel/blur-and-reveal/image1.png",
      "/images/carousel/blur-and-reveal/image2.jpg",
      "/images/carousel/blur-and-reveal/image3.jpg"
    ],
    likes: 12,
    remixes: 480,
    shares: 18
  },
  {
    id: "glass-effect",
    title: "Glass Effect",
    author: "Created By Victor Chen",
    href: "/glass-effect",
    image: "/images/carousel/glass-effect/image1.png",
    images: [
      "/images/carousel/glass-effect/image1.png",
      "/images/carousel/glass-effect/image2.jpg",
      "/images/carousel/glass-effect/image3.jpg"
    ],
    likes: 8,
    remixes: 230,
    shares: 6
  },
  {
    id: "social-media-identity",
    title: "Social Media Identity",
    author: "Created By Victor Chen",
    href: "/social-media-identity",
    image: "/images/carousel/social-media-identity/image1.jpg",
    images: [
      "/images/carousel/social-media-identity/image1.jpg",
      "/images/carousel/social-media-identity/image2.jpg",
      "/images/carousel/social-media-identity/image3.jpg"
    ],
    likes: 18,
    remixes: 410,
    shares: 25
  },
  {
    id: "halftone-matrix",
    title: "Halftone Matrix",
    author: "Created By Victor Chen",
    href: "#",
    image: "/images/carousel/halftone-matrix/image1.jpg",
    images: [
      "/images/carousel/halftone-matrix/image1.jpg",
      "/images/carousel/halftone-matrix/image2.jpg",
      "/images/carousel/halftone-matrix/image3.jpg"
    ],
    likes: 9,
    remixes: 992,
    shares: 29,
    isUpcoming: true
  },
  {
    id: "3d-prism-filter",
    title: "3D Prism Filter",
    author: "Created By Victor Chen",
    href: "#",
    image: "/images/carousel/3d-prism-filter/image1.jpg",
    images: [
      "/images/carousel/3d-prism-filter/image1.jpg",
      "/images/carousel/3d-prism-filter/image2.jpg",
      "/images/carousel/3d-prism-filter/image3.jpg"
    ],
    likes: 5,
    remixes: 368,
    shares: 12,
    isUpcoming: true
  },
  {
    id: "ascii-swarm",
    title: "ASCII Swarm",
    author: "Created By Victor Chen",
    href: "#",
    image: "/images/carousel/ascii-swarm/image1.jpg",
    images: [
      "/images/carousel/ascii-swarm/image1.jpg",
      "/images/carousel/ascii-swarm/image2.jpg",
      "/images/carousel/ascii-swarm/image3.jpg"
    ],
    likes: 14,
    remixes: 516,
    shares: 3,
    isUpcoming: true
  },
  {
    id: "voronoi-diagram",
    title: "Voronoi Generator",
    author: "Created By Victor Chen",
    href: "#",
    image: "/images/carousel/voronoi-generator/image1.jpg",
    images: [
      "/images/carousel/voronoi-generator/image1.jpg",
      "/images/carousel/voronoi-generator/image2.jpg",
      "/images/carousel/voronoi-generator/image3.jpg"
    ],
    likes: 5,
    remixes: 580,
    shares: 12,
    isUpcoming: true
  },
  {
    id: "subdivision-type",
    title: "Subdivision Type",
    author: "Created By Victor Chen",
    href: "#",
    image: "/images/carousel/subdivision-type/image1.jpg",
    images: [
      "/images/carousel/subdivision-type/image1.jpg",
      "/images/carousel/subdivision-type/image2.jpg",
      "/images/carousel/subdivision-type/image3.jpg"
    ],
    likes: 2,
    remixes: 597,
    shares: 19,
    isUpcoming: true
  }
];

export default function Home() {
  return (
    <div className={styles.homeContainer}>
      {/* Header */}
      <header className={styles.homeHeader}>
        <div>
          <h1 className={styles.homeTitle}>IMG300</h1>
          <p className={styles.homeSubtitle}>BRAND ASSET GENERATOR &amp; STUDIO TOOLS — CREATED BY VICTOR CHEN</p>
        </div>
      </header>

      {/* Gallery Grid */}
      <div className={styles.galleryGrid}>
        {CARDS.map((card) => (
          <GalleryCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
