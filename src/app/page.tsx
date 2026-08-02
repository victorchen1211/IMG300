"use client";

import React, { useState } from "react";
import styles from "./page.module.scss";
import { GalleryCard, CardData } from "../components/GalleryCard";

const CARDS: CardData[] = [
  {
    id: "mosaic-effect",
    title: "Mosaic Grid Studio",
    category: "Grid & Cutout Matrix",
    href: "/mosaic-effect",
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
    aspectRatio: "0.75"
  },
  {
    id: "shape-mosaic",
    title: "Shape Mosaic Studio",
    category: "Typography Geometry",
    href: "/shape-mosaic",
    image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80",
    aspectRatio: "0.7"
  },
  {
    id: "halftone-matrix",
    title: "Halftone Density Generator",
    category: "Generative Shaders",
    href: "#",
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80",
    aspectRatio: "1.0",
    isUpcoming: true
  },
  {
    id: "3d-prism-filter",
    title: "3D Glass Prism Refraction",
    category: "Orthographic WebGL",
    href: "#",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    aspectRatio: "0.8",
    isUpcoming: true
  },
  {
    id: "ascii-swarm",
    title: "ASCII Monospace Swarm",
    category: "Typography Geometry",
    href: "#",
    image: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80",
    aspectRatio: "0.75",
    isUpcoming: true
  },
  {
    id: "voronoi-diagram",
    title: "Voronoi Triangulation Cells",
    category: "Generative Shaders",
    href: "#",
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80",
    aspectRatio: "0.9",
    isUpcoming: true
  },
  {
    id: "subdivision-type",
    title: "Recursive Quadtree Type",
    category: "Typography Geometry",
    href: "#",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    aspectRatio: "0.75",
    isUpcoming: true
  },
  {
    id: "kintsugi-gold",
    title: "Kintsugi Gold Fracture",
    category: "Generative Shaders",
    href: "#",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    aspectRatio: "1.0",
    isUpcoming: true
  }
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "Grid & Cutout Matrix", "Typography Geometry", "Generative Shaders", "Orthographic WebGL"];

  const filteredCards = CARDS.filter((card) => {
    const matchesCategory = activeCategory === "All" || card.category === activeCategory;
    const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          card.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={styles.visuHomeRoot}>
      {/* Visu.Haus Sticky Navigation Topbar */}
      <header className={styles.visuTopBar}>
        <div className={styles.visuBrandMark}>
          <span className={styles.visuBrandLogo}>IMG300</span>
          <span className={styles.visuBrandTag}>STUDIO</span>
        </div>

        <nav className={styles.visuPrimaryNav}>
          <button className={`${styles.visuNavItem} ${styles.activeNavItem}`}>Gallery</button>
          <button className={styles.visuNavItem}>Generators</button>
          <button className={styles.visuNavItem}>Showcase</button>
        </nav>

        <div className={styles.visuUserDock}>
          <div className={styles.visuSearchInputWrap}>
            <svg className={styles.visuSearchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search tools &amp; generators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.visuSearchInput}
            />
          </div>
          <button className={styles.visuCreateBtn}>Create Tool</button>
        </div>
      </header>

      {/* Visu.Haus Hero Tagline Section */}
      <main className={styles.visuMainContent}>
        <section className={styles.visuHeroSection}>
          <div className={styles.visuRotatorBadge}>
            <span className={styles.rotatorDot} />
            The tool that creates tools
          </div>
          <h1 className={styles.visuHeroTitle}>
            No-code creative studio for generative visual art.
          </h1>
          <p className={styles.visuHeroSubtitle}>
            Build, tweak, and export high-impact generative visual assets with live interactive controls.
          </p>

          {/* Category Filter Pills */}
          <div className={styles.visuFilterBar}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`${styles.visuFilterPill} ${activeCategory === cat ? styles.activeFilterPill : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Visu.Haus Masonry Gallery Grid */}
        <section className={styles.visuGridSection}>
          <div className={styles.visuGrid}>
            {filteredCards.map((card) => (
              <GalleryCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
