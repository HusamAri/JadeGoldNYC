import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono, Fraunces } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getBrandScope } from "@/lib/brand";
import "./globals.css";

// Amuletta tip sistemi — "analitik + estetik":
//  • Space Grotesk (UI/başlık): geometrik, teknik, ayırt edici — analitik ses.
//  • JetBrains Mono (sayısal okumalar): tabular, hassas — veriye saygı.
//  • Fraunces (display/wordmark): yüksek kontrastlı, optik-ölçekli zarif serif
//    — kuyumcuya yakışan estetik; harf yapısı yine hassas/yapısal.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin", "latin-ext"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin", "latin-ext"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Amuletta",
  title: {
    default: "Amuletta — Yönetim Platformu",
    template: "%s · Amuletta",
  },
  description:
    "Çok markalı e-ticaret yönetim platformu — satış, maliyet, performans ve şirket hafızası tek çatıda.",
  // Platform ikonları: sekme markı (app/icon.svg) + apple-touch (app/apple-icon.tsx)
  // Next.js dosya konvansiyonlarınca otomatik bağlanır; manifest'i burada bildiririz.
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Amuletta",
    title: "Amuletta — Yönetim Platformu",
    description:
      "Satış, maliyet, performans ve şirket hafızası — tüm şirketleriniz tek platformda.",
    locale: "tr_TR",
  },
};

// Next 16: themeColor / viewport ayrı `viewport` export'unda olmalı.
// NeumorphGlass yüzey renkleri — açıkta off-white, koyuda kömür.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eaecf3" },
    { media: "(prefers-color-scheme: dark)", color: "#262935" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Marka kapsamı SUNUCUDA çözülür (flash yok): aktif şirket Jade Gold ise
  // sıcak Jade Gold teması, diğer her bağlamda platform (Amuletta) teması.
  // Radix portalları <body>'ye bağlandığından öznitelik <html> üzerindedir.
  const brand = await getBrandScope();

  return (
    <html
      lang="tr"
      data-brand={brand}
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${fraunces.variable} h-full antialiased`}
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
