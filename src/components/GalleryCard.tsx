"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "../app/page.module.scss";

export interface CardData {
  id: string;
  title: string;
  author: string;
  href: string;
  image: string;
  likes: number;
  remixes: number;
  shares: number;
  isUpcoming?: boolean;
}

interface GalleryCardProps {
  card: CardData;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({ card }) => {
  const content = (
    <div className={styles.cardItem}>
      <div className={styles.cardThumbnailWrapper}>
        <Image
          src={card.image}
          alt={card.title}
          width={600}
          height={375}
          className={styles.cardThumbnail}
          unoptimized
        />
        {card.isUpcoming && <span className={styles.cardBadge}>Upcoming</span>}
      </div>
      <h2 className={styles.cardTitle}>{card.title}</h2>
      <p className={styles.cardAuthor}>{card.author}</p>
    </div>
  );

  if (card.isUpcoming) {
    return (
      <div style={{ opacity: 0.7, cursor: "not-allowed" }}>
        {content}
      </div>
    );
  }

  return (
    <Link href={card.href} style={{ textDecoration: "none" }}>
      {content}
    </Link>
  );
};
