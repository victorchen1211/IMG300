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
    image: "/thumbnails/mosaic-effect.png",
    aspectRatio: "0.75"
  },
  {
    id: "shape-mosaic",
    title: "Shape Mosaic Studio",
    category: "Typography Geometry",
    href: "/shape-mosaic",
    image: "/thumbnails/shape-mosaic.png",
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
  const [deviceType, setDeviceType] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const progress = Math.min(1, Math.max(0, currentScroll / 180));
      setScrollProgress(progress);
    };

    const handleResize = () => {
      const w = window.innerWidth;
      if (w <= 640) {
        setDeviceType("mobile");
      } else if (w <= 1024) {
        setDeviceType("tablet");
      } else {
        setDeviceType("desktop");
      }
    };

    handleResize();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const categories = ["All", "Grid & Cutout Matrix", "Typography Geometry", "Generative Shaders", "Orthographic WebGL"];

  const filteredCards = CARDS.filter((card) => {
    return activeCategory === "All" || card.category === activeCategory;
  });

  // Calculate dynamic scale factor based on viewport device version (Desktop vs Tablet vs Mobile)
  let scale = 1 - scrollProgress * 0.81;
  let topPos = Math.max(14, 28 - scrollProgress * 14);
  let leftPos = Math.max(48, 48 - scrollProgress * 0);

  if (deviceType === "tablet") {
    scale = 1 - scrollProgress * 0.65;
    topPos = Math.max(12, 22 - scrollProgress * 10);
    leftPos = Math.max(24, 24 - scrollProgress * 0);
  } else if (deviceType === "mobile") {
    scale = 1 - scrollProgress * 0.58;
    topPos = Math.max(10, 18 - scrollProgress * 8);
    leftPos = Math.max(16, 16 - scrollProgress * 0);
  }

  const isMobileOrTablet = deviceType !== "desktop";

  return (
    <div className={styles.visuHomeRoot}>
      {/* Continuous Morphing #0000fe Stacked Logo */}
      <div
        className={styles.dynamicStackedLogoContainer}
        style={{
          transform: `scale(${scale})`,
          top: `${topPos}px`,
          left: `${leftPos}px`
        }}
      >
        <div className={styles.stackedLogoText}>
          <span>IMG</span>
          <span>300</span>
        </div>
      </div>

      {/* Fixed Sticky Top Header Bar */}
      <header className={`${styles.visuTopBar} ${scrollProgress > 0.4 ? styles.scrolledTopBar : ""}`}>
        {/* Floating White Pill Menu Dock */}
        <div className={styles.visuFloatingPillDock}>
          {!isMobileOrTablet ? (
            <nav className={styles.visuPrimaryNavInline}>
              <button className={styles.visuNavItemLink}>Create</button>
              <button className={styles.visuNavItemLink}>Gallery</button>
              <button className={styles.visuNavItemLink}>Sign in</button>
            </nav>
          ) : (
            <button
              className={styles.visuTwoLinesBtn}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
                <line x1="4" y1="9" x2="20" y2="9" />
                <line x1="4" y1="15" x2="20" y2="15" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Full-Screen Electric Blue Mobile/Tablet Navigation Menu */}
      {isMobileOrTablet && isMobileMenuOpen && (
        <div className={styles.fullScreenRedMenu}>
          {/* Top Right Close Button Pill */}
          <button
            className={styles.redMenuCloseBtn}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Large Stacked Nav Links */}
          <div className={styles.redMenuContent}>
            <button className={styles.redMenuItem} onClick={() => setIsMobileMenuOpen(false)}>
              Create
            </button>
            <button className={styles.redMenuItem} onClick={() => setIsMobileMenuOpen(false)}>
              Gallery
            </button>
            <button className={styles.redMenuItem} onClick={() => setIsMobileMenuOpen(false)}>
              Sign in
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={styles.visuMainContent}>
        {/* Hero Section Layout */}
        <section className={styles.visuHeroHeader}>
          <div className={styles.heroLogoSpacer} />

          {/* Subtitle Tagline on Right */}
          <div className={styles.heroSubtitleContainer}>
            <p className={styles.heroTaglineText}>
              Design Made Easy, Inspiration Made Instant.
            </p>
          </div>
        </section>

        {/* Category Filter Pills */}
        {/* <div className={styles.visuFilterBar}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.visuFilterPill} ${activeCategory === cat ? styles.activeFilterPill : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div> */}

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
