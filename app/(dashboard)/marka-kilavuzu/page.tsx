/* eslint-disable @next/next/no-img-element */
// Marka varlıkları public/ (CDN) üzerinden; vektör/sabit boyut için düz <img>.
import { ExternalLink, ImagePlus, Quote } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EditorialCard } from "@/components/brand/editorial-card";
import { BrandTile } from "@/components/brand/brand-tile";
import { BRAND_GALLERY } from "@/lib/brand-assets";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Marka Kılavuzu" };

const BOARD = "/brand/jade-gold-nyc-guidelines.html";

const PALETTE = [
  { hex: "#B89347", name: "Antik Altın", use: "Birincil · marka & vurgu" },
  { hex: "#F2EFE6", name: "Sıcak Fildişi", use: "Aydınlık zemin" },
  { hex: "#A39F94", name: "Taş Grisi", use: "Nötr destek" },
  { hex: "#3F4A44", name: "Derin Jade", use: "Derinlik · ikincil" },
  { hex: "#131313", name: "Kömür", use: "Koyu zemin" },
];

const LOGOS = [
  { src: "/brand/logo/logo-primary.svg", label: "Birincil kilit", alt: "JADE GOLD NYC birincil logo" },
  { src: "/brand/logo/logo-wordmark.svg", label: "Kelime markası", alt: "JADE GOLD kelime markası" },
  { src: "/brand/logo/logo-stacked.svg", label: "İstifli", alt: "JADE GOLD NYC istifli logo" },
  { src: "/brand/logo/monogram-jg.svg", label: "JG Monogram", alt: "İç içe JG monogramı" },
  { src: "/brand/logo/seal-badge.svg", label: "Mühür", alt: "Jade Gold New York City mührü" },
];

const ICONS = [
  ["monogram", "Monogram"],
  ["diamond", "Pırlanta"],
  ["chain", "Zincir"],
  ["ring", "Yüzük"],
  ["skyline", "Silüet"],
  ["column", "Sütun"],
  ["loupe", "Loupe"],
  ["shield", "Kalkan"],
] as const;

const VALUES = [
  ["Kalıcılık", "Kaplama değil — 10K & 14K som altın. Bir gün miras kalacak nesneler."],
  ["El İşçiliği", "Her parça elde bitirilir; kusursuzluk değil, karakter aranır."],
  ["Sadelik", "Gösterişten arınmış form. Az, ama doğru."],
  ["Şehir Ruhu", "New York'un sakin özgüveni; sokak ile zarafetin kesişimi."],
  ["Şeffaflık", "Ayar, ağırlık ve köken açık. Güven, satıştan önce gelir."],
];

const BRAND_PILLARS = [
  {
    pillar: "Malzeme Dürüstlüğü",
    copy: "“Natural Type A jade. 14k solid gold. No plating.”",
    signal: "Şeffaflık = güven",
  },
  {
    pillar: "Küçük Parti",
    copy: "“Made in batches of 12 or fewer.”",
    signal: "Abartısız kıtlık",
  },
  {
    pillar: "NYC Kökeni",
    copy: "“Designed and crafted in New York.”",
    signal: "Yerel lüks itibarı",
  },
  {
    pillar: "Zanaat Mirası",
    copy: "Atölye · araç · süreç görselleri",
    signal: "İnsani bağ",
  },
  {
    pillar: "Sade Tasarım",
    copy: "Logosuz, temiz, minimal ayarlar",
    signal: "Gösterişsiz özgüven",
  },
];

const SLOGANS = [
  "Quiet luxury, in solid gold.",
  "Wear it forever. Never announce it.",
  "Not plated. Not trending. Just gold.",
  "Sessiz lüks, som altından.",
];

const PERSONAS = [
  {
    name: "Sophia · 34",
    tag: "NYC profesyoneli — kendine alır",
    image: "/brand/gallery/model-hamsa.webp",
    bio: "Manhattan'da yaratıcı sektörde çalışır. İnce altın zincirleri katmanlar; gösterişi değil dokunuşu sever.",
    drivers: ["Sessiz lüks", "Som altın > kaplama", "Günlük taşınabilirlik"],
    channels: "Instagram · Pinterest · Etsy araması",
  },
  {
    name: "Marcus · 29",
    tag: "Diaspora — statement & hediye",
    image: "/brand/gallery/koyu-franco.webp",
    bio: "Cuban link ve signet sever; köklerini taşıyan, iddialı ama otantik parçalar arar. Kendine ve sevdiğine alır.",
    drivers: ["Otantik ağırlık", "Kişisel anlam", "Dayanıklılık"],
    channels: "Instagram · TikTok · tavsiye",
  },
  {
    name: "Elena · 41",
    tag: "Anlamlı hediye — miras",
    image: "/brand/gallery/aydinlik-nugget.webp",
    bio: "Yıldönümü, mezuniyet, doğum gibi dönüm noktaları için hediye alır. Hikâyesi ve kalitesi olan, kalıcı parçalar ister.",
    drivers: ["Miras kalitesi", "Hikâye & paketleme", "Güvenilir köken"],
    channels: "Etsy araması · ağızdan ağıza",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium tracking-[0.28em] text-[oklch(0.6_0.08_72)] uppercase">
      {children}
    </span>
  );
}

export default function MarkaKilavuzuPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        title="Marka Kılavuzu"
        description="Jade Gold NYC görsel ve sözlü kimlik sistemi — eksiksiz referans."
        action={
          <Button asChild variant="outline">
            <a href={BOARD} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" aria-hidden />
              Tek sayfa pano
            </a>
          </Button>
        }
      />

      {/* Editorial açılış */}
      <EditorialCard
        className="min-h-[280px] md:min-h-[340px]"
        image="/brand/gallery/koyu-franco.webp"
        video="/brand/video/jade-altin-dolly.mp4"
        eyebrow="Jade Gold · New York City"
        title="Sessiz lüks, som altından."
        subtitle="New York'un nabzından doğan; 10K & 14K som altını çağdaş ve sade bir dille yorumlayan bir mücevher markası."
      />

      {/* Marka hikayesi */}
      <section className="space-y-5">
        <Eyebrow>01 · Marka</Eyebrow>
        <h2 className="font-serif text-3xl tracking-tight">Kimlik & Hikâye</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Jade Gold NYC, gösterişten uzak ama varlığı hissedilen bir lüks
            anlayışını benimser. Parçalar; trendin değil, kalıcılığın peşindedir.
            Şehrin enerjisiyle el işçiliğinin sıcaklığını aynı potada eritir.
          </p>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Konumlandırma: erişilebilir lüks ile yüksek mücevher arasında — her
            gün taşınabilen, ama özel hisseden som altın. Vaat basittir: kaplama
            değil, kalıcı değer.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map(([k, v]) => (
            <Card key={k}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{k}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">{v}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Hedef kitle & persona */}
      <section className="space-y-5">
        <Eyebrow>02 · Hedef Kitle</Eyebrow>
        <h2 className="font-serif text-3xl tracking-tight">Kime Sesleniyoruz</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pazar Görünümü</CardTitle>
            <CardDescription>
              Birincil pazar ABD — özellikle NYC metro ve diaspora toplulukları.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Yaş</p>
              <p className="font-medium">25–45</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gelir</p>
              <p className="font-medium">Orta – üst</p>
            </div>
            <div>
              <p className="text-muted-foreground">Davranış</p>
              <p className="font-medium">Online alışveriş; kaplama yerine som altın</p>
            </div>
            <div>
              <p className="text-muted-foreground">Kanallar</p>
              <p className="font-medium">Etsy · Instagram · Pinterest · TikTok</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {PERSONAS.map((p) => (
            <Card key={p.name} className="gap-0 overflow-hidden p-0">
              <div className="relative h-36 overflow-hidden">
                <div
                  className="absolute inset-0 scale-105 bg-cover bg-center"
                  style={{ backgroundImage: `url('${p.image}')` }}
                  aria-hidden
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#131313]/85 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-serif text-lg text-white">{p.name}</p>
                  <p className="text-[11px] tracking-wide text-[oklch(0.86_0.09_85)]">
                    {p.tag}
                  </p>
                </div>
              </div>
              <CardContent className="space-y-3 py-5">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {p.bio}
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {p.drivers.map((d) => (
                    <li
                      key={d}
                      className="bg-accent/40 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    >
                      {d}
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground text-xs">
                  <span className="text-foreground/70 font-medium">Kanallar:</span>{" "}
                  {p.channels}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Marka sesi */}
      <section className="space-y-5">
        <Eyebrow>03 · Ses & Ton</Eyebrow>
        <h2 className="font-serif text-3xl tracking-tight">Nasıl Konuşuruz</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Kişilik</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sakin, kendinden emin, sıcak ve abartısız. Az kelime, net anlam —
                “quiet confidence”.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-[oklch(0.5_0.09_150)]">
                Yap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-1.5 text-sm">
                <li>· “Som altın. Kalıcı.”</li>
                <li>· Malzeme, ayar ve işçiliği öne çıkar</li>
                <li>· Sade, duyulara hitap eden dil</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-destructive text-base">Yapma</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-1.5 text-sm">
                <li>· Aşırı sıfat, abartılı vaat</li>
                <li>· İndirim/aciliyet baskısı dili</li>
                <li>· Gösterişçi, gürültülü ton</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="flex items-start gap-3 py-6">
            <Quote className="size-5 shrink-0 text-[oklch(0.6_0.08_72)]" aria-hidden />
            <p className="font-serif text-xl leading-snug">
              Gösterme. Hissettir. Kalıcı olan, sessiz olandır.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Logo sistemi */}
      <section className="space-y-5">
        <Eyebrow>04 · Logo</Eyebrow>
        <h2 className="font-serif text-3xl tracking-tight">Logo Sistemi</h2>
        <Card>
          <CardHeader>
            <CardDescription>
              Higgsfield orijinal vektörleri (SVG), antik altın · sıcak fildişi zemin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {LOGOS.map((l) => (
                <li key={l.src} className="space-y-2">
                  <div className="flex h-28 items-center justify-center rounded-xl bg-[#F0EEE8] p-3 ring-1 ring-black/5">
                    <img src={l.src} alt={l.alt} className="h-full w-full object-contain" />
                  </div>
                  <p className="text-muted-foreground text-center text-xs font-medium">
                    {l.label}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Renk & tipografi */}
      <section className="space-y-5">
        <Eyebrow>05 · Renk & Tipografi</Eyebrow>
        <h2 className="font-serif text-3xl tracking-tight">Palet & Yazı</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Renk Paleti</CardTitle>
              <CardDescription>Beş çekirdek renk — her zaman HEX ile.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {PALETTE.map((c) => (
                  <li key={c.hex} className="flex items-center gap-3">
                    <span
                      className="size-10 shrink-0 rounded-md ring-1 ring-black/10"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden
                    />
                    <span className="w-28 text-sm font-semibold">{c.name}</span>
                    <span className="font-mono text-xs tracking-wide text-[#9a7d3e]">
                      {c.hex}
                    </span>
                    <span className="text-muted-foreground ml-auto text-xs">
                      {c.use}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tipografi</CardTitle>
              <CardDescription>Yüksek kontrastlı serif + geometrik sans.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between gap-4 border-b pb-3">
                <span className="font-serif text-4xl leading-none">Aa</span>
                <div className="text-right">
                  <p className="text-sm font-semibold">Meno Banner</p>
                  <p className="text-muted-foreground text-xs">Didone başlık · editoryal ses</p>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <span
                  className="text-4xl leading-none tracking-wide"
                  style={{ fontFamily: "'Futura', 'Century Gothic', sans-serif" }}
                >
                  Aa
                </span>
                <div className="text-right">
                  <p className="text-sm font-semibold">ITC Avant Garde Gothic</p>
                  <p className="text-muted-foreground text-xs">Geometrik sans · logo & gövde</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* İkonografi */}
      <section className="space-y-5">
        <Eyebrow>06 · İkon & Sanat Yönetimi</Eyebrow>
        <h2 className="font-serif text-3xl tracking-tight">İkonografi & Fotoğraf</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">İkon Seti</CardTitle>
            <CardDescription>Tek ağırlıkta çizgi ikonlar, antik altın.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-4 gap-3 sm:grid-cols-8">
              {ICONS.map(([file, label]) => (
                <li key={file} className="space-y-2">
                  <div className="flex aspect-square items-center justify-center rounded-xl bg-[#F0EEE8] p-1.5 ring-1 ring-black/5">
                    <img
                      src={`/brand/icons/icon-${file}.svg`}
                      alt={`${label} ikonu`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <p className="text-muted-foreground text-center text-[11px]">{label}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sanat Yönetimi · Fotoğraf</CardTitle>
            <CardDescription>
              Editoryal natürmort: keten, taş, doğal ışık. Bol negatif alan, sıcak
              ton, abartısız.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                "aydinlik-cuban",
                "koyu-paperclip",
                "model-dome",
                "nyc-butterfly",
              ].map((g) => (
                <li
                  key={g}
                  className="relative aspect-[4/5] overflow-hidden rounded-xl ring-1 ring-black/5"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('/brand/gallery/${g}.webp')` }}
                    aria-hidden
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Görsel kimlik / galeri */}
      <section className="space-y-5">
        <Eyebrow>07 · Görsel Kimlik / Galeri</Eyebrow>
        <h2 className="font-serif text-3xl tracking-tight">Fotoğraf Kütüphanesi</h2>
        <p className="text-muted-foreground max-w-2xl text-[15px] leading-relaxed">
          Jade Gold NYC marka çekimleri ve görsel öğelerinin tam kütüphanesi —
          yukarıdaki küçük seçkinin devamı.
        </p>

        {BRAND_GALLERY.map((group) => (
          <div key={group.key} className="space-y-3">
            <div>
              <h3 className="text-base font-semibold">{group.title}</h3>
              <p className="text-muted-foreground text-sm">{group.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {group.assets.map((a) => (
                <BrandTile key={a.src} src={a.src} scrim className="aspect-[4/5]">
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-xs font-medium text-white">{a.caption}</p>
                  </div>
                </BrandTile>
              ))}
            </div>
          </div>
        ))}

        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <ImagePlus className="size-4 shrink-0" />
          Görselleri <code className="font-mono">public/brand/gallery/</code>{" "}
          klasörüne ilgili dosya adıyla ekleyin; otomatik görünür. Dosya yoksa
          zarif degrade gösterilir.
        </p>
      </section>

      {/* Pazar fırsatı & konumlandırma */}
      <section className="space-y-5">
        <Eyebrow>08 · Pazar Fırsatı & Konumlandırma</Eyebrow>
        <h2 className="font-serif text-3xl tracking-tight">Sahiplenilmemiş Konum</h2>
        <Card>
          <CardContent className="flex items-start gap-3 py-6">
            <Quote className="size-5 shrink-0 text-[oklch(0.6_0.08_72)]" aria-hidden />
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              Amerika&apos;da üretilen, doğal jade ile som altını birleştiren,
              $85–$180 aralığında, şeffaf bir NYC el işçiliği hikâyesi olan
              sessiz lüks mücevher — bu kesişimi hâlâ hiçbir Etsy satıcısı
              sahiplenmiş değil. Bu, Jade Gold NYC&apos;nin fırsatı.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Konumlandırma İfadesi</CardTitle>
            <CardDescription>
              Etsy mağaza tanıtımı, sosyal medya biyografisi ve basın kitinde
              olduğu gibi kullanılabilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-lg leading-snug italic">
              &ldquo;Handcrafted jade and gold jewelry for women who wear
              quality without announcing it. Each piece is made in small
              batches in New York, using natural jade and solid gold
              settings — designed to be worn daily, kept forever, and passed
              down.&rdquo;
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BRAND_PILLARS.map((p) => (
            <Card key={p.pillar}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{p.pillar}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-mono text-xs text-[#9a7d3e]">{p.copy}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {p.signal}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Slogan Seçenekleri</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {SLOGANS.map((s) => (
                  <li key={s} className="font-serif text-lg leading-snug">
                    “{s}”
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Mağaza Tanıtım Metni</CardTitle>
              <CardDescription>Etsy “shop announcement” için hazır.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                “Jade Gold NYC crafts natural jade and solid 14k/18k gold
                jewelry in small NYC batches — no plating, no shortcuts.
                Quality you feel, not something you announce.”
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="text-muted-foreground text-xs">
          Uygulanabilir SEO/AEO adımları için{" "}
          <a href="/ayarlar/buyume-stratejisi" className="underline">
            Büyüme Stratejisi
          </a>{" "}
          sayfasına bakın.
        </p>
      </section>
    </div>
  );
}
