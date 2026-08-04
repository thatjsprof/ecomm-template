import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.writeHead(301, { Location: "/api/sitemap" });
  res.end();
  return { props: {} };
};

export default function SitemapRedirect() {
  return null;
}
