import Document, { Html, Head, Main, NextScript } from "next/document";
import { siteConfig, siteTitle } from "@/config/site";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang={siteConfig.htmlLang}>
        <Head>
          <meta name="description" content={siteConfig.description} />
          <meta property="og:title" content={siteTitle()} />
          <meta property="og:description" content={siteConfig.description} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content={siteConfig.name} />
        </Head>
        <body className="min-h-screen bg-white font-sans text-neutral-900 antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
