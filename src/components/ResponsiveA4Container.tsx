/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';

interface ResponsiveA4ContainerProps {
  children: React.ReactNode;
  baseWidth?: number;  // 820px
  baseHeight?: number; // 1120px
  className?: string;
  allowZoomToggle?: boolean;
}

export const ResponsiveA4Container: React.FC<ResponsiveA4ContainerProps> = ({
  children,
  baseWidth = 820,
  baseHeight = 1120,
  className = '',
  allowZoomToggle = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize scale immediately based on window width to avoid initial 820px flash/stretch
  const [scale, setScale] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      if (w < 820) {
        return Math.min(1, Math.max(0.1, (w - 26) / 820));
      }
    }
    return 1;
  });

  const [measuredHeight, setMeasuredHeight] = useState<number>(baseHeight);

  const getSafeAvailableWidth = (): number => {
    // 1. Get window inner width (capped)
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : baseWidth;
    // Account for container padding on small screens (minimum 24px)
    const maxViewportAllowed = Math.max(260, windowWidth - 24);

    if (!containerRef.current) return maxViewportAllowed;

    const clientW = containerRef.current.clientWidth;

    // If clientW is valid and strictly within maxViewportAllowed, use clientW
    if (clientW > 0 && clientW < maxViewportAllowed) {
      return clientW;
    }

    // Otherwise, strictly clamp to maxViewportAllowed so flex blowout NEVER prevents scaling
    return maxViewportAllowed;
  };

  const updateScale = () => {
    const availableWidth = getSafeAvailableWidth();
    if (availableWidth >= baseWidth) {
      setScale(1);
    } else {
      // Fits perfectly within screen width so NO horizontal scrolling is ever needed
      const computedScale = Math.min(1, Math.max(0.1, (availableWidth - 2) / baseWidth));
      setScale(computedScale);
    }

    if (contentRef.current) {
      const firstChild = contentRef.current.firstElementChild as HTMLElement | null;
      const h = firstChild
        ? Math.max(firstChild.scrollHeight, firstChild.offsetHeight)
        : contentRef.current.offsetHeight;
      if (h > 0) {
        setMeasuredHeight(h);
      }
    }
  };

  useLayoutEffect(() => {
    updateScale();
  }, [baseWidth]);

  useEffect(() => {
    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => {
        updateScale();
      });
      observer.observe(containerRef.current);
    }

    const timer = setTimeout(updateScale, 100);

    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [baseWidth]);

  const isScaled = scale < 0.98;
  const targetHeight = measuredHeight > 0 ? measuredHeight : baseHeight;
  const scaledWidth = Math.round(baseWidth * scale);
  const scaledHeight = Math.round(targetHeight * scale);

  return (
    <div className={`w-full max-w-full flex flex-col items-center overflow-x-hidden ${className}`}>
      {/* Informative pill on mobile/tablet informing of auto-fit */}
      {isScaled && (
        <div className="no-print mb-2 flex items-center justify-between w-full max-w-[820px] px-3 py-1 text-[11px] text-slate-600 bg-white/90 backdrop-blur-xs rounded-lg border border-slate-200 shadow-2xs">
          <span className="font-medium text-slate-700 flex items-center gap-1.5">
            <span>📱</span>
            <span>画面幅に最適化表示中 ({Math.round(scale * 100)}%)</span>
          </span>
          <span className="text-[10px] text-slate-500">
            横スクロール不要・A4比率維持
          </span>
        </div>
      )}

      {/* Outer Measurable Container (Strictly overflow-hidden to eliminate horizontal scroll) */}
      <div
        ref={containerRef}
        className="w-full max-w-full flex justify-center overflow-hidden"
      >
        <div
          className="transition-all duration-150 origin-top shadow-md rounded-xs relative overflow-hidden"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            maxWidth: '100%',
          }}
        >
          <div
            ref={contentRef}
            style={{
              width: `${baseWidth}px`,
              minHeight: `${targetHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
