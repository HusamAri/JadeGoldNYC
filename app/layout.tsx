import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Jade Gold NYC",
  title: {
    default: "Jade Gold NYC — Yönetim Paneli",
    template: "%s · Jade Gold NYC",
  },
  description:
    "Jade Gold NYC Etsy mağazası için uçtan uca yönetim, loglama ve raporlama paneli.",
  // Marka ikonları: sekme markı (app/icon.svg) + apple-touch (app/apple-icon.tsx)
  // Next.js dosya konvansiyonlarınca otomatik bağlanır; manifest'i burada bildiririz.
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Jade Gold NYC",
    title: "Jade Gold NYC — Yönetim Paneli",
    description:
      "Satış, maliyet, performans ve şirket hafızası — mağazanızın tüm süreçleri tek panelde.",
    locale: "tr_TR",
  },
};

// Next 16: themeColor / viewport ayrı `viewport` export'unda olmalı.
// Kömür (CHAR #131313) tema rengi marka monogram zemini ve manifest ile tutarlı.
export const viewport: Viewport = {
  themeColor: "#131313",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
