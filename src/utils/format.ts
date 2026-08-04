import type { Product, ProductVariant } from "@/types";
import { siteConfig } from "@/config/site";

export function formatPrice(value: string | number | null | undefined): string {
  const amount = Number(value || 0);
  return new Intl.NumberFormat(siteConfig.locale, {
    style: "currency",
    currency: siteConfig.currency,
    minimumFractionDigits: siteConfig.currencyMinimumFractionDigits,
  }).format(amount);
}

export function getProductPrice(
  product: Pick<Product, "price" | "salePrice">,
  variant?: Pick<ProductVariant, "price" | "salePrice"> | null
): number {
  if (variant) {
    if (variant.salePrice != null && variant.salePrice !== "") {
      return Number(variant.salePrice);
    }
    if (variant.price != null && variant.price !== "") {
      return Number(variant.price);
    }
  }

  if (product.salePrice != null && product.salePrice !== "") {
    return Number(product.salePrice);
  }

  return Number(product.price);
}

export function formatVariantLabel(attributes?: Record<string, string> | null): string {
  if (!attributes || Object.keys(attributes).length === 0) {
    return "";
  }

  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");
}

export function cartItemKey(productId: string, variantId?: string | null): string {
  return `${productId}:${variantId || "base"}`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
