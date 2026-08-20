import Document, { Html, Head, Main, NextScript } from "next/document";
import { siteConfig } from "@/config/site";
import { defaultOgImage, ogLocale } from "@/lib/seo";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang={siteConfig.htmlLang}>
        <Head>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/favicon.svg" />
          <meta name="theme-color" content="#000000" />
          <meta key="description" name="description" content={siteConfig.description} />
          <meta key="og:type" property="og:type" content="website" />
          <meta key="og:site_name" property="og:site_name" content={siteConfig.name} />
          <meta key="og:locale" property="og:locale" content={ogLocale()} />
          <meta key="og:image" property="og:image" content={defaultOgImage()} />
        </Head>
        <body className="min-h-screen bg-white font-sans text-neutral-900 antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
