"use client";

import React from "react";
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
  const cardInner = (
    <div className={styles.visuCard}>
      <div
        className={styles.visuCardMedia}
        style={{ aspectRatio: card.aspectRatio || "0.75" }}
      >
        <Image
          src={card.image}
          alt={card.title}
          width={600}
          height={800}
          className={styles.visuCardImage}
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
