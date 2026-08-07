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
      <section className="relative flex min-h-dvh items-end bg-neutral-900 px-6 pb-20 pt-28 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="font-display text-5xl tracking-tight text-white sm:text-7xl">
            {siteConfig.tagline}
          </h1>
          <p className="mt-4 max-w-xl text-xl text-white/80 sm:text-2xl">{siteConfig.heroTagline}</p>
          <Link
            href="/shop"
            className={cn(
              buttonVariants({ size: "lg", variant: "secondary" }),
              "mt-8 h-14 rounded-lg bg-white px-10 text-sm font-bold uppercase tracking-wide text-neutral-900 hover:bg-white/90"
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
      className="relative min-h-dvh bg-neutral-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0 overflow-hidden">
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
      </div>

      <div className="pointer-events-none relative z-[2] mx-auto flex min-h-dvh max-w-7xl flex-col justify-end px-6 pb-20 pt-28 lg:px-8">
        <div key={current.id}>
          <h1 className="animate-in fade-in fill-mode-both duration-700 font-display text-5xl tracking-tight text-white sm:text-7xl">
            {current.name}
          </h1>
          <p className="mt-4 max-w-lg animate-in fade-in fill-mode-both text-xl text-white/80 duration-700 delay-300 sm:text-2xl">
            {current.description?.trim() || siteConfig.heroTagline}
          </p>
          <div className="pointer-events-auto mt-8 animate-in fade-in fill-mode-both duration-700 delay-500">
            <Link
              href={`/collections/${current.slug}`}
              className={cn(
                buttonVariants({ size: "lg", variant: "secondary" }),
                "h-14 rounded-lg bg-white px-10 text-sm font-bold uppercase tracking-wide text-neutral-900 hover:bg-white/90"
              )}
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-0 right-20 z-[3] flex translate-y-1/2 items-center gap-3 sm:right-24">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(-1)}
            className="flex size-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-md transition hover:bg-neutral-50"
          >
            <ChevronLeft className="size-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(1)}
            className="flex size-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-md transition hover:bg-neutral-50"
          >
            <ChevronRight className="size-5" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </section>
  );
}
