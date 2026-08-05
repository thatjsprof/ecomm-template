"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, ZoomIn, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  alt: string;
  /** When set, scroll/select this image if it exists in `images` */
  focusImageUrl?: string | null;
}

export function ProductGallery({ images, alt, focusImageUrl }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [hoverNav, setHoverNav] = useState(false);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [thumbOverflow, setThumbOverflow] = useState({ left: false, right: false });

  useEffect(() => {
    if (!focusImageUrl || images.length === 0) return;
    const index = images.indexOf(focusImageUrl);
    if (index >= 0) setActiveIndex(index);
  }, [focusImageUrl, images]);

  useEffect(() => {
    if (activeIndex >= images.length) {
      setActiveIndex(Math.max(0, images.length - 1));
    }
  }, [images.length, activeIndex]);

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
  }, [images.length]);

  useEffect(() => {
    const el = thumbRef.current;
    if (!el) return;
    const thumb = el.querySelector<HTMLElement>(`[data-thumb="${activeIndex}"]`);
    thumb?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") {
        setActiveIndex((i) => (i - 1 + images.length) % images.length);
        setLightboxZoom(1);
      }
      if (e.key === "ArrowRight") {
        setActiveIndex((i) => (i + 1) % images.length);
        setLightboxZoom(1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, images.length]);

  function go(delta: number) {
    if (images.length === 0) return;
    setActiveIndex((i) => (i + delta + images.length) % images.length);
    setLightboxZoom(1);
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-neutral-100 text-sm text-neutral-400">
        No image
      </div>
    );
  }

  const current = images[activeIndex];

  return (
    <>
      <div
        className="group relative"
        onMouseEnter={() => setHoverNav(true)}
        onMouseLeave={() => setHoverNav(false)}
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100 shadow-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => {
              setLightboxOpen(true);
              setLightboxZoom(1);
            }}
            aria-label="Open image gallery"
          >
            <Image
              src={current}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
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
                onClick={() => go(1)}
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
            onClick={() => {
              setLightboxOpen(true);
              setLightboxZoom(1);
            }}
            className="absolute bottom-3 right-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow"
            aria-label="Expand image"
          >
            <Expand className="size-4" />
          </button>
        </div>

        {images.length > 1 && (
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
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "relative h-20 w-16 shrink-0 overflow-hidden rounded-lg",
                    activeIndex === index ? "ring-2 ring-neutral-900" : "opacity-80 hover:opacity-100"
                  )}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-neutral-950/95 text-white">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <p className="text-sm text-white/70">
              {activeIndex + 1} / {images.length}
            </p>
            <div className="flex items-center gap-2">
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

          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto px-4">
            <div
              className="relative mx-auto h-[70vh] w-full max-w-5xl transition-transform duration-200"
              style={{ transform: `scale(${lightboxZoom})` }}
            >
              <Image
                src={current}
                alt={alt}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex items-center justify-center gap-3 pb-8 pt-4">
              <button
                type="button"
                onClick={() => go(-1)}
                className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => go(1)}
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
