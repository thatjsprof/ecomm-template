"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, ZoomIn, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  alt: string;
  focusImageUrl?: string | null;
}

function imageIndex(images: string[], url: string | null | undefined): number {
  if (!url) return -1;
  const exact = images.indexOf(url);
  if (exact >= 0) return exact;
  return images.findIndex(
    (img) => img === url || img.split("?")[0] === url.split("?")[0]
  );
}

function wrapIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

export function ProductGallery({ images, alt, focusImageUrl }: ProductGalleryProps) {
  const n = images.length;
  const looping = n > 1;

  // Track position includes clones when looping: [last, ...images, first]
  // Real slides live at 1..n
  const [trackPos, setTrackPos] = useState(looping ? 1 : 0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitionOn, setTransitionOn] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [lightboxPos, setLightboxPos] = useState(looping ? 1 : 0);
  const [lightboxTransitionOn, setLightboxTransitionOn] = useState(true);
  const [hoverNav, setHoverNav] = useState(false);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [thumbOverflow, setThumbOverflow] = useState({ left: false, right: false });
  const animatingRef = useRef(false);
  const lightboxAnimatingRef = useRef(false);
  const panDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const [panning, setPanning] = useState(false);

  const mainSlides = looping ? [images[n - 1], ...images, images[0]] : images;
  const lightboxSlides = mainSlides;

  const jumpMainTo = useCallback(
    (index: number) => {
      const real = wrapIndex(index, n);
      setTransitionOn(false);
      setActiveIndex(real);
      setTrackPos(looping ? real + 1 : real);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionOn(true));
      });
    },
    [looping, n]
  );

  const jumpLightboxTo = useCallback(
    (index: number) => {
      const real = wrapIndex(index, n);
      setLightboxTransitionOn(false);
      setLightboxPos(looping ? real + 1 : real);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setLightboxTransitionOn(true));
      });
    },
    [looping, n]
  );

  // Variant image → jump main (and lightbox if open) to that slide
  useEffect(() => {
    const index = imageIndex(images, focusImageUrl);
    if (index < 0) return;
    jumpMainTo(index);
    if (lightboxOpen) jumpLightboxTo(index);
  }, [focusImageUrl, images, jumpMainTo, jumpLightboxTo, lightboxOpen]);

  useEffect(() => {
    if (activeIndex >= n && n > 0) {
      jumpMainTo(n - 1);
    }
  }, [n, activeIndex, jumpMainTo]);

  function updateThumbOverflow() {
    const el = thumbRef.current;
    if (!el) return;
    setThumbOverflow({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }

  useEffect(() => {
    updateThumbOverflow();
    const el = thumbRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateThumbOverflow, { passive: true });
    const ro = new ResizeObserver(updateThumbOverflow);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateThumbOverflow);
      ro.disconnect();
    };
  }, [n]);

  useEffect(() => {
    const el = thumbRef.current;
    if (!el) return;
    const thumb = el.querySelector<HTMLElement>(`[data-thumb="${activeIndex}"]`);
    thumb?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeIndex]);

  function onMainTransitionEnd() {
    if (!looping) {
      animatingRef.current = false;
      return;
    }
    if (trackPos === 0) {
      setTransitionOn(false);
      setTrackPos(n);
      setActiveIndex(n - 1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionOn(true);
          animatingRef.current = false;
        });
      });
      return;
    }
    if (trackPos === n + 1) {
      setTransitionOn(false);
      setTrackPos(1);
      setActiveIndex(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionOn(true);
          animatingRef.current = false;
        });
      });
      return;
    }
    setActiveIndex(trackPos - 1);
    animatingRef.current = false;
  }

  function onLightboxTransitionEnd() {
    if (!looping) {
      lightboxAnimatingRef.current = false;
      return;
    }
    if (lightboxPos === 0) {
      setLightboxTransitionOn(false);
      setLightboxPos(n);
      setActiveIndex(n - 1);
      jumpMainTo(n - 1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setLightboxTransitionOn(true);
          lightboxAnimatingRef.current = false;
        });
      });
      return;
    }
    if (lightboxPos === n + 1) {
      setLightboxTransitionOn(false);
      setLightboxPos(1);
      setActiveIndex(0);
      jumpMainTo(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setLightboxTransitionOn(true);
          lightboxAnimatingRef.current = false;
        });
      });
      return;
    }
    const real = lightboxPos - 1;
    setActiveIndex(real);
    jumpMainTo(real);
    lightboxAnimatingRef.current = false;
  }

  function goMain(delta: number) {
    if (!looping || animatingRef.current) return;
    animatingRef.current = true;
    setTransitionOn(true);
    setTrackPos((p) => p + delta);
  }

  function goLightbox(delta: number) {
    if (!looping || lightboxAnimatingRef.current) return;
    lightboxAnimatingRef.current = true;
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    setLightboxTransitionOn(true);
    setLightboxPos((p) => p + delta);
  }

  function openLightbox() {
    jumpLightboxTo(activeIndex);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    setLightboxOpen(true);
  }

  function toggleLightboxZoom() {
    setLightboxZoom((z) => {
      if (z >= 1.75) {
        setLightboxPan({ x: 0, y: 0 });
        return 1;
      }
      return z + 0.5;
    });
  }

  function onPanPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (lightboxZoom <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    panDragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: lightboxPan.x,
      originY: lightboxPan.y,
      moved: false,
    };
    setPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPanPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = panDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;
    setLightboxPan({ x: drag.originX + dx, y: drag.originY + dy });
  }

  function onPanPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const drag = panDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    panDragRef.current = null;
    setPanning(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") goLightbox(-1);
      if (e.key === "ArrowRight") goLightbox(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, lightboxPos, n]);

  if (n === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-neutral-100 text-sm text-neutral-400">
        No image
      </div>
    );
  }

  const lightboxCounter = looping
    ? wrapIndex(lightboxPos - 1, n) + 1
    : activeIndex + 1;

  return (
    <>
      <div
        className="group relative"
        onMouseEnter={() => setHoverNav(true)}
        onMouseLeave={() => setHoverNav(false)}
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100 shadow-sm">
          <div
            className={cn(
              "flex h-full",
              transitionOn && "transition-transform duration-300 ease-out"
            )}
            style={{ transform: `translateX(-${trackPos * 100}%)` }}
            onTransitionEnd={(e) => {
              if (e.target !== e.currentTarget) return;
              onMainTransitionEnd();
            }}
          >
            {mainSlides.map((img, index) => (
              <button
                key={`main-${index}-${img}`}
                type="button"
                className="relative h-full w-full min-w-full shrink-0 basis-full"
                onClick={openLightbox}
                aria-label={`View image ${wrapIndex(looping ? index - 1 : index, n) + 1}`}
              >
                <Image
                  src={img}
                  alt={`${alt} ${wrapIndex(looping ? index - 1 : index, n) + 1}`}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={index === (looping ? 1 : 0)}
                />
              </button>
            ))}
          </div>

          {looping && (
            <>
              <button
                type="button"
                onClick={() => goMain(-1)}
                className={cn(
                  "absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg bg-white/90 text-neutral-900 shadow transition-opacity",
                  hoverNav ? "opacity-100" : "opacity-0"
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => goMain(1)}
                className={cn(
                  "absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg bg-white/90 text-neutral-900 shadow transition-opacity",
                  hoverNav ? "opacity-100" : "opacity-0"
                )}
                aria-label="Next image"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={openLightbox}
            className="absolute bottom-3 right-3 z-10 flex size-10 items-center justify-center rounded-lg bg-white/90 text-neutral-900 shadow"
            aria-label="Expand image"
          >
            <Expand className="size-4" />
          </button>
        </div>

        {looping && (
          <div className="relative mt-4">
            {thumbOverflow.left && (
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent" />
            )}
            {thumbOverflow.right && (
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent" />
            )}
            <div
              ref={thumbRef}
              className="flex gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {images.map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  type="button"
                  data-thumb={index}
                  onClick={() => {
                    jumpMainTo(index);
                    if (lightboxOpen) {
                      jumpLightboxTo(index);
                      setLightboxZoom(1);
                      setLightboxPan({ x: 0, y: 0 });
                    }
                  }}
                  className={cn(
                    "relative h-20 w-16 shrink-0 rounded-lg border-2 p-0.5 transition-opacity",
                    activeIndex === index
                      ? "border-neutral-900"
                      : "border-transparent opacity-80 hover:opacity-100"
                  )}
                >
                  <span className="relative block size-full overflow-hidden rounded-md">
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-neutral-950/95 text-white"
          onClick={() => setLightboxOpen(false)}
          role="presentation"
        >
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <p className="text-sm text-white/70">
              {lightboxCounter} / {n}
            </p>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={toggleLightboxZoom}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
              >
                <ZoomIn className="size-4" />
                {lightboxZoom > 1 ? "Reset zoom" : "Zoom"}
              </button>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="flex size-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/15"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div
              className={cn(
                "flex h-full",
                lightboxTransitionOn && !panning && "transition-transform duration-300 ease-out"
              )}
              style={{ transform: `translateX(-${lightboxPos * 100}%)` }}
              onTransitionEnd={(e) => {
                if (e.target !== e.currentTarget) return;
                onLightboxTransitionEnd();
              }}
            >
              {lightboxSlides.map((img, index) => (
                <div
                  key={`lb-${index}-${img}`}
                  className="relative flex h-full w-full min-w-full shrink-0 basis-full items-center justify-center px-4"
                >
                  {/* Intrinsic box so letterbox / empty stage clicks close the lightbox */}
                  <div
                    className={cn(
                      "relative max-h-full max-w-full touch-none",
                      lightboxZoom > 1 && (panning ? "cursor-grabbing" : "cursor-grab"),
                      !panning && "transition-transform duration-200"
                    )}
                    style={{
                      transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxZoom})`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={onPanPointerDown}
                    onPointerMove={onPanPointerMove}
                    onPointerUp={onPanPointerUp}
                    onPointerCancel={onPanPointerUp}
                  >
                    <Image
                      src={img}
                      alt={alt}
                      width={1600}
                      height={2000}
                      draggable={false}
                      className="h-auto max-h-[min(100%,calc(100vh-11rem))] w-auto max-w-[min(100%,72rem)] object-contain select-none"
                      sizes="100vw"
                      priority
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {looping && (
            <div
              className="flex items-center justify-center gap-3 pb-8 pt-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => goLightbox(-1)}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => goLightbox(1)}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
