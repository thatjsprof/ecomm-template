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
  const [lightboxPos, setLightboxPos] = useState(looping ? 1 : 0);
  const [lightboxTransitionOn, setLightboxTransitionOn] = useState(true);
  const [hoverNav, setHoverNav] = useState(false);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [thumbOverflow, setThumbOverflow] = useState({ left: false, right: false });
  const animatingRef = useRef(false);
  const lightboxAnimatingRef = useRef(false);

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
    setLightboxTransitionOn(true);
    setLightboxPos((p) => p + delta);
  }

  function openLightbox() {
    jumpLightboxTo(activeIndex);
    setLightboxZoom(1);
    setLightboxOpen(true);
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
                  "absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow transition-opacity",
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
                  "absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow transition-opacity",
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
            className="absolute bottom-3 right-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow"
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
                    if (lightboxOpen) jumpLightboxTo(index);
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
                onClick={() => setLightboxZoom((z) => (z >= 1.75 ? 1 : z + 0.5))}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
              >
                <ZoomIn className="size-4" />
                {lightboxZoom > 1 ? "Reset zoom" : "Zoom"}
              </button>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          <div
            className="relative min-h-0 flex-1 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                "flex h-full",
                lightboxTransitionOn && "transition-transform duration-300 ease-out"
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
                  <div
                    className="relative h-full max-h-full w-full max-w-6xl transition-transform duration-200"
                    style={{ transform: `scale(${lightboxZoom})` }}
                  >
                    <Image
                      src={img}
                      alt={alt}
                      fill
                      className="object-contain"
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
                className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => goLightbox(1)}
                className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
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
