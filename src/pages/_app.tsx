import type { AppProps } from "next/app";
import Head from "next/head";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { useRouter } from "next/router";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Providers } from "@/components/providers";
import { siteTitle } from "@/config/site";
import "@/styles/globals.css";

/** Swap these fonts when rebranding — keep names in sync with `config/site.ts` */
const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sans = Manrope({
  variable: "--font-sans",
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
      </Head>
      <div className={`${display.variable} ${sans.variable}`}>
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
            </>
          )}
        </Providers>
      </div>
    </>
  );
}
