"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { siteConfig } from "@/config/site";
import type { Collection } from "@/types";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface CollectionHeroSlideshowProps {
  collections: Collection[];
}

export function CollectionHeroSlideshow({ collections }: CollectionHeroSlideshowProps) {
  const slides = collections.filter((c) => c.image);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, siteConfig.homeHero.intervalMs);
    return () => window.clearInterval(id);
  }, [slides.length, paused, index]);

  function go(delta: number) {
    if (slides.length <= 1) return;
    setIndex((i) => (i + delta + slides.length) % slides.length);
  }

  if (slides.length === 0) {
    return (
      <section className="relative flex min-h-[calc(100dvh-4rem)] items-end bg-neutral-900 px-6 pb-20 pt-28 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <p className="font-display text-5xl tracking-tight text-white sm:text-7xl">
            {siteConfig.nameDisplay}
          </p>
          <p className="mt-4 max-w-xl text-lg text-white/80">{siteConfig.heroTagline}</p>
          <Link
            href="/shop"
            className={cn(
              buttonVariants({ size: "lg", variant: "secondary" }),
              "mt-8 rounded-full bg-white px-8 text-neutral-900 hover:bg-white/90"
            )}
          >
            Shop Now
          </Link>
        </div>
      </section>
    );
  }

  const current = slides[index];
  const ctaLabel = current.ctaLabel?.trim() || "Shop Now";

  return (
    <section
      className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-neutral-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <Link
          key={slide.id}
          href={`/collections/${slide.slug}`}
          aria-hidden={i !== index}
          tabIndex={i === index ? 0 : -1}
          className={cn(
            "absolute inset-0 block transition-opacity duration-[1200ms] ease-in-out",
            i === index ? "z-[1] opacity-100" : "z-0 opacity-0 pointer-events-none"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image!}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/55 via-neutral-950/20 to-neutral-950/10" />
        </Link>
      ))}

      <div className="pointer-events-none relative z-[2] mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl flex-col justify-end px-6 pb-20 pt-28 lg:px-8">
        <div key={current.id}>
          <p className="animate-in fade-in fill-mode-both duration-700 font-display text-5xl tracking-tight text-white sm:text-7xl">
            {siteConfig.nameDisplay}
          </p>
          <div className="animate-in fade-in fill-mode-both duration-700 delay-300">
            <h1 className="mt-4 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">
              {current.name}
            </h1>
            {current.description ? (
              <p className="mt-2 max-w-lg text-sm text-white/70">{current.description}</p>
            ) : (
              <p className="mt-2 max-w-lg text-sm text-white/70">{siteConfig.heroTagline}</p>
            )}
          </div>
          <div className="pointer-events-auto mt-8 animate-in fade-in fill-mode-both duration-700 delay-500">
            <Link
              href={`/collections/${current.slug}`}
              className={cn(
                buttonVariants({ size: "lg", variant: "secondary" }),
                "rounded-full bg-white px-8 text-neutral-900 hover:bg-white/90"
              )}
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-6 right-6 z-[3] flex items-center gap-2 sm:bottom-8 sm:right-8">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(-1)}
            className="flex size-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-sm transition hover:bg-white/90"
          >
            <ChevronLeft className="size-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(1)}
            className="flex size-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-sm transition hover:bg-white/90"
          >
            <ChevronRight className="size-5" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </section>
  );
}
