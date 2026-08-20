import type { NextApiRequest, NextApiResponse } from "next";
import { pageUrl } from "@/lib/seo";
import { getCategories, getCollections, getProducts } from "@/services/api";
import type { Product } from "@/types";

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const urls: { loc: string; priority: string; lastmod?: string }[] = [
    { loc: pageUrl("/"), priority: "1.0" },
    { loc: pageUrl("/shop"), priority: "0.9" },
  ];

  try {
    const [categoriesRes, collectionsRes] = await Promise.all([
      getCategories(),
      getCollections(),
    ]);

    for (const collection of collectionsRes.data || []) {
      urls.push({
        loc: pageUrl(`/collections/${collection.slug}`),
        priority: "0.8",
        lastmod: collection.updatedAt,
      });
    }

    for (const category of categoriesRes.data || []) {
      urls.push({
        loc: pageUrl(`/shop?category=${encodeURIComponent(category.slug)}`),
        priority: "0.6",
      });
    }

    const products: Product[] = [];
    let page = 1;
    let pages = 1;

    do {
      const productsRes = await getProducts({ page, limit: 50 });
      products.push(...(productsRes.data?.products || []));
      pages = productsRes.data?.pagination?.pages || 1;
      page += 1;
    } while (page <= pages);

    for (const product of products) {
      urls.push({
        loc: pageUrl(`/shop/${product.slug}`),
        priority: "0.8",
        lastmod: product.updatedAt,
      });
    }
  } catch {
    // Keep static URLs if API is unavailable
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((url) => {
    const lastmod = url.lastmod
      ? `\n    <lastmod>${xmlEscape(url.lastmod.slice(0, 10))}</lastmod>`
      : "";
    return `  <url>
    <loc>${xmlEscape(url.loc)}</loc>${lastmod}
    <priority>${url.priority}</priority>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  res.write(xml);
  res.end();
}
