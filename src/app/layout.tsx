import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Script from "next/script";
import { SITE_URL, SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/site";
import JsonLd from "@/components/seo/JsonLd";

// Portal pede Perfectly Nineties no display; nao e livre. O spec nomeia
// Playfair Display como substituto, e e o que o next/font serve.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600"] });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display", weight: "400" });
// Desvio: o Portal nao tem mono. Este site tem caminho de arquivo, id de
// modelo e coluna numerica — sem mono a tabela perde alinhamento e o recibo
// deixa de parecer recibo. Mantido, registrado no design.md.
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  // metadataBase e obrigatorio pra OG/canonical resolverem em URL absoluta —
  // sem isso o Next emite caminho relativo e o crawler/scraper social ignora.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    // Paginas internas viram "<algo> | CodeReviewBench" sem repetir a tagline.
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  verification: {
    google: "CoUvZZvMnZ5EXhHagUpNrsK-ARNNT3Lshr0uW_YN_8A",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark antialiased">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XWCNNFQE8E"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XWCNNFQE8E');
          `}
        </Script>
      </head>
      <body className={cn(
        inter.variable,
        playfair.variable,
        mono.variable,
        "font-sans bg-[var(--background)] text-[var(--foreground)] min-h-dvh flex flex-col relative"
      )}>
        {/* O grain saiu com o Portal: textura de filme e recurso de tema
            escuro. Sobre canvas #f7f7f7 ela nao le como grao, le como tela
            suja, e o Portal pede superficie chapada. */}
        <JsonLd />
        <Navbar />
        <main className="flex-1 flex flex-col relative">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
