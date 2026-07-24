import type { Metadata, Viewport } from "next";
import { Sora, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getBrandScope } from "@/lib/brand";
import "./globals.css";

// Amuletta tip sistemi — design system + lab referansları (Spatial/Liquid/
// Materials/Liquid_Dark) ile BİREBİR:
//  • Sora (UI/başlık/gövde) — bold-minimalist
//  • JetBrains Mono (dijital okumalar, .idx index başlıkları)
//  • Cormorant Garamond (--font-serif) — editorial serif; başlıklarda
//    italik `em` vurgular (lab'lardaki `h2 em` dili)
//  • California Paradise (display) — YALNIZ hero başlıklar/wordmark
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin", "latin-ext"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin", "latin-ext"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const california = localFont({
  src: [
    { path: "./fonts/CaliforniaParadise.woff2", weight: "400", style: "normal" },
    { path: "./fonts/CaliforniaParadise-Italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-california",
  display: "swap",
});

// NEXT_PUBLIC_SITE_URL tanımlıysa onu kullan; değilse production alan adına
// düş. localhost fallback'i prod build'de og:image / twitter:image URL'lerini
// kırıyordu (sosyal önizleme kartı boş geliyordu).
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://amuletta.artifactstudio.info";

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
    { media: "(prefers-color-scheme: dark)", color: "#14161e" },
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
      className={`${sora.variable} ${jetbrainsMono.variable} ${cormorant.variable} ${california.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
        {children}
        {/* Cam refraction filtreleri (DS fx-glass BİREBİR) — .glass-liquid
            arkasındaki holo objeleri büker. Gizli, tek sefer; url(#liquid)
            desteklemeyen tarayıcıda göz ardı edilir (progressive enhancement). */}
        <svg
          width="0"
          height="0"
          aria-hidden="true"
          style={{ position: "absolute", pointerEvents: "none" }}
        >
          <filter id="refract" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.009 0.014"
              numOctaves={2}
              seed={11}
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="1.1" result="softnoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="softnoise"
              scale={26}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="liquid" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.006 0.011"
              numOctaves={2}
              seed={4}
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="1.4" result="softnoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="softnoise"
              scale={46}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
        <Toaster richColors position="top-right" />
        <SpeedInsights />
      </body>
    </html>
  );
}
