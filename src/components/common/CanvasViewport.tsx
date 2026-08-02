"use client";

import React from "react";
import styles from "../../app/page.module.scss";

interface CanvasViewportProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef?: React.RefObject<HTMLDivElement>;
  onClickCanvas?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseDownCanvas?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMoveCanvas?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUpCanvas?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseLeaveCanvas?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  cursor?: string;
  canvasStyle?: React.CSSProperties;
  isMobileCollapsed?: boolean;
  children?: React.ReactNode;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  canvasRef,
  containerRef,
  onClickCanvas,
  onMouseDownCanvas,
  onMouseMoveCanvas,
  onMouseUpCanvas,
  onMouseLeaveCanvas,
  cursor = "default",
  canvasStyle,
  isMobileCollapsed,
  children
}) => {
  return (
    <div
      className={`${styles.canvasViewport} ${isMobileCollapsed === false ? styles.expandedDrawer : ""}`}
      ref={containerRef}
    >
      <div className={styles.canvasWrapper} style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          className={styles.canvasElement}
          onClick={onClickCanvas}
          onMouseDown={onMouseDownCanvas}
          onMouseMove={onMouseMoveCanvas}
          onMouseUp={onMouseUpCanvas}
          onMouseLeave={onMouseLeaveCanvas}
          style={{
            maxWidth: "100%",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
            cursor,
            ...canvasStyle
          }}
        />
        {children}
      </div>
    </div>
  );
};
