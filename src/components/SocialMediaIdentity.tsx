"use client";

import React, { useState } from "react";
import styles from "../app/page.module.scss";

interface IdentityCard {
  id: string;
  platform: string;
  username: string;
  title: string;
  tagline: string;
  accentColor: string;
  avatar: string;
  followers: string;
  posts: string;
  engagement: string;
  badges: string[];
}

const DEFAULT_CARDS: IdentityCard[] = [
  {
    id: "card-1",
    platform: "INSTAGRAM",
    username: "@victorchen_design",
    title: "VICTOR CHEN",
    tagline: "Creative Technologist & WebGL Shader Designer",
    accentColor: "#ff3366",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    followers: "128.5K",
    posts: "342",
    engagement: "8.4%",
    badges: ["WebGL Specialist", "Generative Art", "UI Architecture"]
  },
  {
    id: "card-2",
    platform: "TWITTER / X",
    username: "@victor_dev",
    title: "VICTOR.DEV",
    tagline: "Building interactive generative tools & next-gen web UI",
    accentColor: "#00e5ff",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    followers: "64.2K",
    posts: "1.2K",
    engagement: "12.1%",
    badges: ["Open Source", "Design Systems", "Three.js"]
  },
  {
    id: "card-3",
    platform: "LINKEDIN",
    username: "in/victorchen-design",
    title: "VICTOR CHEN",
    tagline: "Senior Creative Technologist & Brand Design Systems Engineer",
    accentColor: "#7000ff",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    followers: "42.8K",
    posts: "189",
    engagement: "6.9%",
    badges: ["Design Systems", "Lead Architect", "UI Design"]
  }
];

export const SocialMediaIdentity: React.FC = () => {
  const [cards, setCards] = useState<IdentityCard[]>(DEFAULT_CARDS);
  const [activeTab, setActiveTab] = useState<string>("all");

  return (
    <div className={styles.appContainer} style={{ flexDirection: "column", padding: "40px", overflowY: "auto" }}>
      {/* Header Banner */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
              IMG300 ARCHITECTURE
            </span>
            <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#fff", margin: "8px 0 4px 0", fontFamily: '"Telegraf", system-ui, sans-serif' }}>
              Social Media Identity
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0 }}>
              Interactive brand identity preview & social card showcase. Tool created by Victor Chen.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            {["all", "INSTAGRAM", "TWITTER / X", "LINKEDIN"].map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "active" : ""}
                style={{
                  fontSize: "12px",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  textTransform: "uppercase",
                  letterSpacing: "1px"
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid Container */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "28px"
        }}
      >
        {cards
          .filter((c) => activeTab === "all" || c.platform === activeTab)
          .map((card) => (
            <div
              key={card.id}
              style={{
                background: "rgba(20, 20, 26, 0.75)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                padding: "28px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                transition: "transform 0.3s ease, border-color 0.3s ease",
                cursor: "pointer"
              }}
            >
              {/* Top Accent Line */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: `linear-gradient(90deg, ${card.accentColor}, transparent)`
                }}
              />

              {/* Platform Header Badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    color: card.accentColor,
                    textTransform: "uppercase"
                  }}
                >
                  {card.platform}
                </span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{card.username}</span>
              </div>

              {/* Avatar & Title Section */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <img
                  src={card.avatar}
                  alt={card.title}
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: `2px solid ${card.accentColor}`
                  }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#fff" }}>{card.title}</h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                    {card.tagline}
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "12px",
                  padding: "14px",
                  marginBottom: "20px",
                  textAlign: "center"
                }}
              >
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>{card.followers}</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginTop: "2px" }}>
                    Followers
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>{card.posts}</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginTop: "2px" }}>
                    Content
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>{card.engagement}</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginTop: "2px" }}>
                    Engage
                  </div>
                </div>
              </div>

              {/* Tag Badges */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {card.badges.map((badge, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.8)",
                      border: "1px solid rgba(255,255,255,0.1)"
                    }}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
