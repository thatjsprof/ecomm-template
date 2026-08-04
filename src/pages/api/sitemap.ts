import type { NextApiRequest, NextApiResponse } from "next";
import { siteConfig } from "@/config/site";
import { getCategories, getProducts } from "@/services/api";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const siteUrl = siteConfig.url;

  const urls = [
    { loc: siteUrl, priority: "1.0" },
    { loc: `${siteUrl}/shop`, priority: "0.9" },
    { loc: `${siteUrl}/login`, priority: "0.3" },
    { loc: `${siteUrl}/register`, priority: "0.3" },
  ];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      getProducts({ limit: 50 }),
      getCategories(),
    ]);

    for (const product of productsRes.data?.products || []) {
      urls.push({ loc: `${siteUrl}/shop/${product.slug}`, priority: "0.8" });
    }

    for (const category of categoriesRes.data || []) {
      urls.push({
        loc: `${siteUrl}/shop?category=${category.slug}`,
        priority: "0.6",
      });
    }
  } catch {
    // Keep static URLs if API is unavailable
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.write(xml);
  res.end();
}
