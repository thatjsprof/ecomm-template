"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types";
import { formatPrice, getProductPrice } from "@/utils/format";

export function ProductCard({ product }: { product: Product }) {
  const price = getProductPrice(product);
  const hasSale = product.salePrice != null && Number(product.salePrice) < Number(product.price);
  const image = product.images?.[0];

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100 shadow-sm transition-shadow duration-300 group-hover:shadow-md">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            No image
          </div>
        )}
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="text-base font-medium tracking-wide text-neutral-900">{product.name}</h3>
        <div className="flex items-center gap-2 text-base">
          <span className="text-neutral-900">{formatPrice(price)}</span>
          {hasSale && (
            <span className="text-neutral-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
