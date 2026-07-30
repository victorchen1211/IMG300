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
    image: "/thumbnails/blur-and-reveal.png",
    likes: 12,
    remixes: 480,
    shares: 18
  },
  {
    id: "glass-effect",
    title: "Glass Effect",
    author: "Created By Victor Chen",
    href: "/glass-effect",
    image: "/thumbnails/glass-effect.png",
    likes: 8,
    remixes: 230,
    shares: 6
  },
  {
    id: "social-media-identity",
    title: "Social Media Identity",
    author: "Created By Victor Chen",
    href: "/social-media-identity",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    likes: 18,
    remixes: 410,
    shares: 25
  },
  {
    id: "halftone-matrix",
    title: "Halftone Matrix",
    author: "Created By Victor Chen",
    href: "#",
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80",
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
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80",
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
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
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
    image: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&q=80",
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
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80",
    likes: 2,
    remixes: 597,
    shares: 19,
    isUpcoming: true
  },
  {
    id: "shatter-stack",
    title: "Shatter Stack",
    author: "Created By Victor Chen",
    href: "#",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80",
    likes: 8,
    remixes: 438,
    shares: 23,
    isUpcoming: true
  },
  {
    id: "topographic-wave",
    title: "Topographic Wave",
    author: "Created By Victor Chen",
    href: "#",
    image: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=600&q=80",
    likes: 11,
    remixes: 712,
    shares: 15,
    isUpcoming: true
  },
  {
    id: "pixel-mosaic",
    title: "Pixel Mosaic",
    author: "Created By Victor Chen",
    href: "#",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
    likes: 7,
    remixes: 340,
    shares: 8,
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
