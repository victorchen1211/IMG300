"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "../app/page.module.scss";

export interface CardData {
  id: string;
  title: string;
  category?: string;
  author?: string;
  href: string;
  image: string;
  aspectRatio?: string;
  likes?: number;
  remixes?: number;
  shares?: number;
  isUpcoming?: boolean;
}

interface GalleryCardProps {
  card: CardData;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({ card }) => {
  const [aspect, setAspect] = useState<string>(card.aspectRatio || "0.75");
  const [isLandscape, setIsLandscape] = useState<boolean>(false);

  const handleImageLoad = (img: HTMLImageElement) => {
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      // If width > height, automatically switch to dynamic landscape aspect ratio!
      setAspect(`${img.naturalWidth} / ${img.naturalHeight}`);
      if (ratio > 1.15) {
        setIsLandscape(true);
      }
    }
  };

  const cardInner = (
    <div className={`${styles.visuCard} ${isLandscape ? styles.landscapeCard : ""}`}>
      <div
        className={styles.visuCardMedia}
        style={{ aspectRatio: aspect }}
      >
        <Image
          src={card.image}
          alt={card.title}
          width={600}
          height={800}
          className={styles.visuCardImage}
          onLoadingComplete={handleImageLoad}
          unoptimized
        />
        
        {/* Status Badge */}
        <div className={styles.visuCardBadge}>
          {card.isUpcoming ? "COMING SOON" : "LIVE TOOL"}
        </div>

        {/* Visu.Haus Hover Overlay */}
        <div className={styles.visuCardOverlay}>
          <div className={styles.visuCardOverlayInfo}>
            <span className={styles.visuCardCategory}>{card.category || "Studio Tool"}</span>
            <h3 className={styles.visuCardTitle}>{card.title}</h3>
          </div>
          <div className={styles.visuCardPlayBtn}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M8 5.5v13l10-6.5z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );

  if (card.isUpcoming) {
    return (
      <div className={styles.visuCardDisabled} title="Upcoming Tool">
        {cardInner}
      </div>
    );
  }

  return (
    <Link href={card.href} style={{ textDecoration: "none" }}>
      {cardInner}
    </Link>
  );
};
