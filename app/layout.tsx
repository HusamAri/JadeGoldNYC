import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono, Fraunces } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FrostProvider } from "@/components/layout/frost-provider";
import { getBrandScope } from "@/lib/brand";
import "./globals.css";

// Amuletta 3.0 (V7) tip sistemi — docs/amuletta-2/plan.md §V7:
//  • Inter Tight (--font-sans) — gövde/UI, sıkı sans
//  • Fraunces (--font-serif, --font-display) — editoryal serif; başlıklar
//    300 ağırlık, opsz 144, son kelime italik
//  • JetBrains Mono (--font-mono) — index etiketleri, LCD rakamları, tablo
//    sayıları (0.12–0.2em tracking, uppercase)
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "latin-ext"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin", "latin-ext"],
});

// Değişken eksenler: wght (varsayılan) + opsz (9..144). Başlıklar CSS'te
// `font-variation-settings: "opsz" 144` ile display kesimine çekilir.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
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
// V7 yüzey renkleri — açıkta sis grisi, koyuda mürekkep.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9ebef" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1e26" },
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
      className={`${interTight.variable} ${jetbrainsMono.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
        <FrostProvider>
          {children}
          <Toaster richColors position="top-right" />
          <SpeedInsights />
        </FrostProvider>
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
      </body>
    </html>
  );
}
