import type { GetServerSideProps } from "next";
import { siteConfig } from "@/config/site";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const siteUrl = siteConfig.url;

  const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /dashboard/
Disallow: /checkout/
Disallow: /cart/

Sitemap: ${siteUrl}/sitemap.xml
`;

  res.setHeader("Content-Type", "text/plain");
  res.write(body);
  res.end();

  return { props: {} };
};

export default function Robots() {
  return null;
}
