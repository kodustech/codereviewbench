import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Script from "next/script";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700"] });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], variable: "--font-display", weight: "400" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "CodeReviewBench | AI Code Review Benchmark",
  description: "Open benchmark for AI code review. We test how well LLMs find realistic bugs across 5 languages. Compare models, explore traces, audit every score.",
  keywords: ["ai code review benchmark", "llm code review", "ai code review", "code review benchmark", "llm benchmark", "ai code review comparison"],
  openGraph: {
    title: "CodeReviewBench | AI Code Review Benchmark",
    description: "Open benchmark for AI code review. We test how well LLMs find realistic bugs across 5 languages.",
    type: "website",
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
        dmSans.variable,
        instrumentSerif.variable,
        mono.variable,
        "font-sans bg-[var(--background)] text-[var(--foreground)] min-h-dvh flex flex-col relative"
      )}>
        {/* Grain texture overlay */}
        <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />
        <Navbar />
        <main className="flex-1 flex flex-col relative">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
