"use client";

import React, { useState, useEffect } from "react";
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      // Interpolate progress smoothly from 0.0 at top to 1.0 after 180px scroll
      const progress = Math.min(1, Math.max(0, currentScroll / 180));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const categories = ["All", "Grid & Cutout Matrix", "Typography Geometry", "Generative Shaders", "Orthographic WebGL"];

  const filteredCards = CARDS.filter((card) => {
    const matchesCategory = activeCategory === "All" || card.category === activeCategory;
    const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (card.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate dynamic scale factor from 1.0 (giant) to 0.18 (sticky header logo size)
  const scale = 1 - scrollProgress * 0.81;

  return (
    <div className={styles.visuHomeRoot}>
      {/* Continuous Morphing #0000fe Stacked Logo */}
      <div
        className={styles.dynamicStackedLogoContainer}
        style={{
          transform: `scale(${scale})`,
          top: `${Math.max(12, 28 - scrollProgress * 14)}px`,
          left: `${Math.max(16, 40 - scrollProgress * 24)}px`
        }}
      >
        <div className={styles.stackedLogoText}>
          <span>IMG</span>
          <span>300</span>
        </div>
      </div>

      {/* Fixed Sticky Top Header Bar */}
      <header className={`${styles.visuTopBar} ${scrollProgress > 0.4 ? styles.scrolledTopBar : ""}`}>
        {/* Floating White Pill Menu / Action Bar (Matching Visu.Haus Screenshot) */}
        <div className={styles.visuFloatingPillDock}>
          <nav className={styles.visuPrimaryNavInline}>
            <button className={styles.visuNavItemLink}>Create</button>
            <button className={styles.visuNavItemLink}>Gallery</button>
            <button className={styles.visuNavItemLink}>Sign in</button>
          </nav>

          <button
            className={styles.visuSearchIconBtn}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Search generators"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.visuMainContent}>
        {/* Hero Section Layout */}
        <section className={styles.visuHeroHeader}>
          {/* Invisible Spacer for Hero Logo position */}
          <div className={styles.heroLogoSpacer} />

          {/* Subtitle Tagline on Right */}
          <div className={styles.heroSubtitleContainer}>
            <p className={styles.heroTaglineText}>
              Design Made Easy, Inspiration Made Instant.
            </p>
          </div>
        </section>

        {/* Expandable Search Input Bar */}
        {isSearchOpen && (
          <div className={styles.visuSearchExpandBar}>
            <input
              type="text"
              placeholder="Search tools &amp; generators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.visuSearchExpandInput}
              autoFocus
            />
          </div>
        )}

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
