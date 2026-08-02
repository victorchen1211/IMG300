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
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const categories = ["All", "Grid & Cutout Matrix", "Typography Geometry", "Generative Shaders", "Orthographic WebGL"];

  const filteredCards = CARDS.filter((card) => {
    const matchesCategory = activeCategory === "All" || card.category === activeCategory;
    const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (card.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={styles.visuHomeRoot}>
      {/* Visu.Haus Dynamic Sticky Header Bar */}
      <header className={`${styles.visuTopBar} ${isScrolled ? styles.scrolledTopBar : ""}`}>
        {/* Sticky Mini Logo (Shown when scrolled) */}
        <div className={`${styles.stickyLogoWrap} ${isScrolled ? styles.visibleStickyLogo : ""}`}>
          <div className={styles.stackedLogoMini}>
            <span>IMG</span>
            <span>300</span>
          </div>
        </div>

        {/* Right Navigation Dock */}
        <div className={styles.visuTopBarRightDock}>
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

      {/* Hero Section with Giant Stacked Logo (#0000fe) */}
      <main className={styles.visuMainContent}>
        <section className={styles.visuHeroHeader}>
          {/* Giant 2-Line Stacked Logo: IMG / 300 */}
          <div className={`${styles.stackedLogoHero} ${isScrolled ? styles.hiddenHeroLogo : ""}`}>
            <h1 className={styles.heroLogoText}>
              <span className={styles.heroLine1}>IMG</span>
              <span className={styles.heroLine2}>300</span>
            </h1>
          </div>

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
