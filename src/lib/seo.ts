import { siteConfig } from "@/config/site";
import type { Product } from "@/types";
import { getProductPrice } from "@/utils/format";

export function siteOrigin(): string {
  return siteConfig.url.replace(/\/$/, "");
}

export function pageUrl(path = "/"): string {
  const origin = siteOrigin();
  if (!path || path === "/") return origin;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}

export function canonicalUrl(path = "/"): string {
  return pageUrl(path.split("#")[0]);
}

export function absoluteUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return siteOrigin();
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith("//")) return `https:${pathOrUrl}`;

  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  if (path.startsWith("/uploads/")) {
    const apiOrigin = siteConfig.apiUrl.replace(/\/api\/?$/, "");
    return `${apiOrigin}${path}`;
  }

  return `${siteOrigin()}${path}`;
}

export function metaDescription(text?: string | null, max = 160): string {
  const value = (text || "").replace(/\s+/g, " ").trim();
  if (!value) return siteConfig.description;
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

export function defaultOgImage(): string {
  return absoluteUrl(siteConfig.ogImage);
}

export function ogLocale(): string {
  return siteConfig.locale.replace("-", "_");
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteOrigin(),
    description: siteConfig.description,
    logo: absoluteUrl("/favicon.svg"),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteOrigin(),
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteOrigin()}/shop?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function productJsonLd(product: Product) {
  const url = canonicalUrl(`/shop/${product.slug}`);
  const images = (product.images || []).map((image) => absoluteUrl(image));
  const inStock =
    (product.variants || []).some((variant) => variant.active !== false && variant.stock > 0) ||
    product.stock > 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: images.length ? images : [defaultOgImage()],
    sku: product.sku || undefined,
    brand: { "@type": "Brand", name: siteConfig.name },
    category: product.category?.name,
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: siteConfig.currency,
      price: String(getProductPrice(product)),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: pageUrl(item.path),
    })),
  };
}

export function collectionJsonLd(name: string, path: string, description?: string | null) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description: description || undefined,
    url: canonicalUrl(path),
    isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteOrigin() },
  };
}
