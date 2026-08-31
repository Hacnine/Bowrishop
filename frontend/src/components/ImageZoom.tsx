'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn } from 'lucide-react';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageZoom({ src, alt, className = '' }: ImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // ── Desktop: hover lens state ──────────────────────────────────────────
  const [isHovering, setIsHovering] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });       // lens center (%)
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });

  // ── Mobile: draggable button state ────────────────────────────────────
  const [zoomActive, setZoomActive] = useState(false);
  const [btnPos, setBtnPos] = useState({ x: 50, y: 50 });        // button pos (%)
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, bx: 0, by: 0 });

  const ZOOM = 2.5;       // zoom magnification
  const LENS = 120;       // lens size px

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(pointer: coarse)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Desktop handlers ───────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const cx = Math.min(Math.max(x, 0), 100);
    const cy = Math.min(Math.max(y, 0), 100);
    setLensPos({ x: cx, y: cy });
    setBgPos({ x: cx, y: cy });
  }, []);

  // ── Mobile drag handlers ───────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    isDragging.current = true;
    const t = e.touches[0];
    dragStart.current = { x: t.clientX, y: t.clientY, bx: btnPos.x, by: btnPos.y };
  }, [btnPos]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = e.touches[0];
    const dx = ((t.clientX - dragStart.current.x) / rect.width) * 100;
    const dy = ((t.clientY - dragStart.current.y) / rect.height) * 100;
    setBtnPos({
      x: Math.min(Math.max(dragStart.current.bx + dx, 5), 95),
      y: Math.min(Math.max(dragStart.current.by + dy, 5), 95),
    });
  }, []);

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
    setZoomActive(false);           // finger তুললেই zoom off
    setBtnPos({ x: 50, y: 50 });   // button আবার center-এ
  }, []);

  // ── Zoomed background position (inverted for natural feel) ─────────────
  const zoomedBg = (pos: { x: number; y: number }) =>
    `${pos.x}% ${pos.y}%`;

  // ── Mobile: full-image zoom overlay centered on btn ────────────────────
  const mobileZoomStyle = zoomActive ? {
    backgroundImage: `url(${src})`,
    backgroundSize: `${ZOOM * 100}%`,
    backgroundPosition: zoomedBg(btnPos),
    backgroundRepeat: 'no-repeat',
  } : {};

  return (
    <div className={`relative select-none ${className}`}>
      {/* ── Main image container ── */}
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden rounded-2xl bg-gray-100"
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && setIsHovering(false)}
        onMouseMove={!isMobile ? handleMouseMove : undefined}
        onTouchMove={zoomActive ? onTouchMove : undefined}
        onTouchEnd={zoomActive ? onTouchEnd : undefined}
        style={{ touchAction: zoomActive ? 'none' : 'auto' }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* ── Desktop: lens circle ── */}
        {!isMobile && isHovering && (
          <div
            className="absolute pointer-events-none rounded-full border-2 border-white/70 shadow-lg overflow-hidden"
            style={{
              width: LENS,
              height: LENS,
              left: `calc(${lensPos.x}% - ${LENS / 2}px)`,
              top: `calc(${lensPos.y}% - ${LENS / 2}px)`,
              backgroundImage: `url(${src})`,
              backgroundSize: `${ZOOM * 100}%`,
              backgroundPosition: zoomedBg(bgPos),
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}

        {/* ── Mobile: zoom overlay ── */}
        {isMobile && zoomActive && (
          <div
            className="absolute inset-0 rounded-2xl"
            style={mobileZoomStyle}
          />
        )}

        {/* ── Mobile: draggable zoom button ── */}
        {isMobile && (
          <button
            className={`absolute z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
              zoomActive
                ? 'bg-indigo-600 text-white'
                : 'bg-white/90 text-gray-700'
            }`}
            style={{
              left: `calc(${btnPos.x}% - 20px)`,
              top: `calc(${btnPos.y}% - 20px)`,
              touchAction: 'none',
            }}
            onTouchStart={(e) => {
              setZoomActive(true);  // hold শুরু = zoom on
              onTouchStart(e);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onTouchEnd();
            }}
            onClick={() => {}}  // hold করো zoom দেখতে
            title='Hold & drag to zoom'
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Desktop: zoomed preview panel (right side) ── */}
      {!isMobile && isHovering && (
        <div
          className="absolute top-0 left-[calc(100%+12px)] w-full h-full rounded-2xl border border-gray-200 shadow-xl overflow-hidden z-20 pointer-events-none"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: `${ZOOM * 100}%`,
            backgroundPosition: zoomedBg(bgPos),
            backgroundRepeat: 'no-repeat',
            minWidth: '100%',
          }}
        />
      )}
    </div>
  );
}
