import Head from "next/head";
import { useRouter } from "next/router";
import { siteConfig, siteTitle } from "@/config/site";
import {
  absoluteUrl,
  defaultOgImage,
  metaDescription,
  ogLocale,
  pageUrl,
} from "@/lib/seo";

interface PageHeadProps {
  title?: string;
  description?: string;
  /** When true, `title` is used as-is (no "· Brand" template) */
  absolute?: boolean;
  /** Canonical path, e.g. `/shop/foo`. Defaults to the current path without query. */
  path?: string;
  image?: string | null;
  type?: "website" | "product";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function PageHead({
  title,
  description,
  absolute,
  path,
  image,
  type = "website",
  noindex = false,
  jsonLd,
}: PageHeadProps) {
  const router = useRouter();
  const resolvedTitle = title
    ? absolute
      ? title
      : siteTitle(title)
    : siteTitle();
  const resolvedDescription = metaDescription(description || siteConfig.description);
  const canonical = path
    ? pageUrl(path)
    : pageUrl((router.asPath || "/").split("?")[0].split("#")[0]);
  const ogImage = image ? absoluteUrl(image) : defaultOgImage();
  const robots = noindex ? "noindex, nofollow" : "index, follow";
  const jsonLdPayload = Array.isArray(jsonLd)
    ? {
        "@context": "https://schema.org",
        "@graph": jsonLd.map(({ "@context": _context, ...item }) => item),
      }
    : jsonLd;

  return (
    <Head>
      <title>{resolvedTitle}</title>
      <meta key="description" name="description" content={resolvedDescription} />
      <meta key="robots" name="robots" content={robots} />
      <link key="canonical" rel="canonical" href={canonical} />

      <meta key="og:title" property="og:title" content={resolvedTitle} />
      <meta key="og:description" property="og:description" content={resolvedDescription} />
      <meta key="og:type" property="og:type" content={type} />
      <meta key="og:url" property="og:url" content={canonical} />
      <meta key="og:image" property="og:image" content={ogImage} />
      <meta key="og:site_name" property="og:site_name" content={siteConfig.name} />
      <meta key="og:locale" property="og:locale" content={ogLocale()} />

      <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      <meta key="twitter:title" name="twitter:title" content={resolvedTitle} />
      <meta
        key="twitter:description"
        name="twitter:description"
        content={resolvedDescription}
      />
      <meta key="twitter:image" name="twitter:image" content={ogImage} />

      {jsonLdPayload && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdPayload) }}
        />
      )}
    </Head>
  );
}
