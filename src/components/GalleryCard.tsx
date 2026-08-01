"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "../app/page.module.scss";

export interface CardData {
  id: string;
  title: string;
  author: string;
  href: string;
  image: string; // Default main thumbnail
  images?: string[]; // Multiple images for carousel
  likes: number;
  remixes: number;
  shares: number;
  isUpcoming?: boolean;
}

interface GalleryCardProps {
  card: CardData;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({ card }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // List of images for carousel (falls back to single image)
  const imageList = card.images && card.images.length > 0 ? card.images : [card.image];
  const totalImages = imageList.length;

  // Continuous Automatic Auto-Play Carousel (Rotates every 3 seconds automatically!)
  useEffect(() => {
    if (totalImages <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalImages);
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalImages]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % totalImages);
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  const content = (
    <div
      className={styles.cardItem}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.cardThumbnailWrapper}>
        {/* Render Carousel Slides with Cross-Fade */}
        {imageList.map((imgSrc, idx) => (
          <div
            key={`${imgSrc}-${idx}`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: idx === currentIndex ? 1 : 0,
              transition: "opacity 0.6s ease-in-out",
              pointerEvents: idx === currentIndex ? "auto" : "none"
            }}
          >
            <Image
              src={imgSrc}
              alt={`${card.title} slide ${idx + 1}`}
              width={600}
              height={375}
              className={styles.cardThumbnail}
              unoptimized
            />
          </div>
        ))}

        {card.isUpcoming && <span className={styles.cardBadge}>Upcoming</span>}

        {/* Carousel Navigation Arrows & Dots Indicator */}
        {totalImages > 1 && (
          <>
            <button
              className={styles.carouselArrowLeft}
              onClick={handlePrev}
              title="Previous Image"
            >
              ‹
            </button>
            <button
              className={styles.carouselArrowRight}
              onClick={handleNext}
              title="Next Image"
            >
              ›
            </button>

            {/* Carousel Dot Indicators */}
            <div className={styles.carouselDotsWrapper}>
              {imageList.map((_, idx) => (
                <span
                  key={idx}
                  className={`${styles.carouselDot} ${idx === currentIndex ? styles.carouselDotActive : ""}`}
                  onClick={(e) => handleDotClick(e, idx)}
                />
              ))}
            </div>
          </>
        )}
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
