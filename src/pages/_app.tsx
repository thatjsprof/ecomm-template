import type { AppProps } from "next/app";
import type { CSSProperties } from "react";
import Head from "next/head";
import { Inter } from "next/font/google";
import { useRouter } from "next/router";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Providers } from "@/components/providers";
import { siteConfig, siteTitle } from "@/config/site";
import "@/styles/globals.css";

/** Swap this font when rebranding — keep name in sync with `config/site.ts` */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAdmin = router.pathname.startsWith("/admin");

  return (
    <>
      <Head>
        <title>{siteTitle()}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {isAdmin && (
          <>
            <meta name="robots" content="noindex, nofollow" />
            <title>{`Admin · ${siteConfig.name}`}</title>
          </>
        )}
      </Head>
      <div
        className={inter.variable}
        style={{ ["--radius"]: siteConfig.radius } as CSSProperties}
      >
        <Providers>
          {isAdmin ? (
            <AdminLayout>
              <Component {...pageProps} />
            </AdminLayout>
          ) : (
            <>
              <Header />
              <main className="min-h-[70vh]">
                <Component {...pageProps} />
              </main>
              <Footer />
              <WhatsAppButton />
            </>
          )}
        </Providers>
      </div>
    </>
  );
}
