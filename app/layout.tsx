import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getBrandScope } from "@/lib/brand";
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
  applicationName: "Artifact",
  title: {
    default: "Artifact — Yönetim Platformu",
    template: "%s · Artifact",
  },
  description:
    "Çok markalı e-ticaret yönetim platformu — satış, maliyet, performans ve şirket hafızası tek çatıda.",
  // Platform ikonları: sekme markı (app/icon.svg) + apple-touch (app/apple-icon.tsx)
  // Next.js dosya konvansiyonlarınca otomatik bağlanır; manifest'i burada bildiririz.
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Artifact",
    title: "Artifact — Yönetim Platformu",
    description:
      "Satış, maliyet, performans ve şirket hafızası — tüm şirketleriniz tek platformda.",
    locale: "tr_TR",
  },
};

// Next 16: themeColor / viewport ayrı `viewport` export'unda olmalı.
// Derin mürekkep — platform (Artifact) sekme markı zeminiyle tutarlı.
export const viewport: Viewport = {
  themeColor: "#14161d",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Marka kapsamı SUNUCUDA çözülür (flash yok): aktif şirket Jade Gold ise
  // sıcak Jade Gold teması, diğer her bağlamda platform (Artifact) teması.
  // Radix portalları <body>'ye bağlandığından öznitelik <html> üzerindedir.
  const brand = await getBrandScope();

  return (
    <html
      lang="tr"
      data-brand={brand}
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
        <SpeedInsights />
      </body>
    </html>
  );
}
