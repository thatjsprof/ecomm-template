/**
 * Single place to rebrand / reconfigure the storefront.
 *
 * Theme colors: `src/styles/globals.css` (`:root`)
 * Fonts are loaded in `src/pages/_app.tsx` (next/font needs static imports)
 * Corner radius: `radius` below (applied as CSS `--radius` in `_app.tsx`)
 */

export const siteConfig = {
  /**
   * Global corner radius (CSS length). Drives buttons, inputs, cards, etc.
   * Use `"0"` for sharp corners, or e.g. `"0.625rem"` for soft.
   */
  radius: "0",

  /** Display name (titles, copyright, admin) */
  name: "Alurd",
  /** Logo / hero text (often all-caps) */
  nameDisplay: "House of Alurd",
  /** Short title fragment e.g. "Atelier — Modern Essentials" */
  tagline: "Modern Essentials",
  /** Meta description / OG */
  description:
    "A curated selection of considered essentials. Quiet luxury for everyday living.",
  /** Default Open Graph / Twitter image (absolute URL or site-relative path) */
  ogImage:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
  /** Hero supporting line */
  heroTagline: "Considered essentials for a quieter kind of luxury.",
  /** Footer blurb */
  footerTagline:
    "Considered essentials for modern living. Quiet luxury, refined materials, lasting design.",
  /** Classic hero background image URL (used when homeHero.style is "classic") */
  heroImage:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=80",

  /**
   * Home hero style:
   * - "classic": single brand hero image + CTA
   * - "collectionSlideshow": fading full-bleed slides; each slide links to a collection
   *   (admin: Collections → enable "Show in hero")
   */
  homeHero: {
    style: "collectionSlideshow" as "classic" | "collectionSlideshow",
    /** Fade interval for collectionSlideshow */
    intervalMs: 5500,
  },

  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",

  locale: "en-NG",
  htmlLang: "en",
  currency: "NGN",
  currencyMinimumFractionDigits: 0,

  defaultCountry: "Nigeria",

  contact: {
    email: "",
    phone: "",
  },

  /** Manual bank transfer checkout option */
  bankTransfer: {
    enabled: true,
    accountName: "Alurd Official Enterprises",
    bankName: "Moniepoint Microfinance Bank",
    accountNumber: "8109101306",
  },

  /**
   * Floating WhatsApp chat button (bottom-right on storefront).
   * phone: country code + number, digits only preferred (e.g. "2348012345678")
   */
  whatsapp: {
    enabled: true,
    phone: "2348012345678",
    message: "Hi! I'd like to know more about your products.",
  },

  social: [] as { name: string; href: string }[],

  /** Documented for rebrands — swap imports in `_app.tsx` to match */
  fonts: {
    display: "Inter",
    sans: "Inter",
  },
} as const;

export function siteTitle(page?: string): string {
  if (!page) {
    return `${siteConfig.name} — ${siteConfig.tagline}`;
  }
  return `${page} · ${siteConfig.name}`;
}
