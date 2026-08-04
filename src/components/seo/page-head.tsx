import Head from "next/head";
import { siteConfig, siteTitle } from "@/config/site";

interface PageHeadProps {
  title?: string;
  description?: string;
  /** When true, `title` is used as-is (no "· Brand" template) */
  absolute?: boolean;
}

export function PageHead({ title, description, absolute }: PageHeadProps) {
  const resolvedTitle = title
    ? absolute
      ? title
      : siteTitle(title)
    : siteTitle();
  const resolvedDescription = description || siteConfig.description;

  return (
    <Head>
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:site_name" content={siteConfig.name} />
    </Head>
  );
}
