/* eslint-disable @next/next/no-img-element */
import { ExternalLink, Quote } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EditorialCard } from "@/components/brand/editorial-card";
import { GoldStream } from "@/components/brand/gold-stream";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const BOARD = "/brand/eon/eon-guidelines.html";

const PALETTE = [
  { hex: "#1C1C1C", name: "Charcoal Ink", use: "Birincil · marka & tip" },
  { hex: "#F5F3EF", name: "Warm Paper", use: "Aydınlık zemin" },
  { hex: "#6B6B6B", name: "Muted Stone", use: "İkincil metin" },
  { hex: "#F0EEE9", name: "Card Clay", use: "Yüzey / kart" },
  { hex: "#C8C4BC", name: "Mist", use: "Koyu UI yumuşak vurgu" },
  { hex: "#121212", name: "Night Paper", use: "Koyu zemin" },
];

const LOGOS = [
  {
    src: "/brand/eon/logo/logo-primary.svg",
    label: "Birincil kilit",
    alt: "EON Fine Jewelry birincil logo",
  },
  {
    src: "/brand/eon/logo/logo-wordmark.svg",
    label: "Kelime markası",
    alt: "EON kelime markası",
  },
  {
    src: "/brand/eon/logo/logo-monogram.svg",
    label: "Amblem / Mark",
    alt: "EON monogram amblemi",
  },
];

const VALUES = [
  [
    "Som Altın",
    "10K · 14K · 18K. Kaplama, doldurma, vermeil yok — miras kalan metal.",
  ],
  [
    "Siparişe Üretim",
    "Stok tutulmaz. Beden, genişlik, karat ve renk senin için kesilir.",
  ],
  [
    "El Gravürü",
    "İç yüzeye ücretsiz gravür — tarih, koordinat, baş harf, kısa bir cümle.",
  ],
  [
    "Anlam",
    "Gramla satılmaz. Mirasın ilk nesnesi olarak tasarlanır.",
  ],
  [
    "Sessiz Lüks",
    "Göstermez; taşınır. Mimari form, sakin dil, kalıcı profil.",
  ],
];

const COLLECTIONS = [
  {
    name: "The Meridian",
    form: "Domed",
    line: "The first, and the truest.",
  },
  {
    name: "The Obelisk",
    form: "Knife-Edge",
    line: "A single ridge, edge to edge.",
  },
  {
    name: "The Testament",
    form: "Flat",
    line: "Flat, forthright, modern.",
  },
  {
    name: "The Keystone",
    form: "Beveled",
    line: "The weight of permanence.",
  },
  {
    name: "The Cornice",
    form: "Milgrain",
    line: "Already worn-in, on the first day.",
  },
];

const PRINCIPLES = [
  ["Solid gold, only", "What you inherit is what it is."],
  ["Engraved by hand", "Made to order, for one person."],
  ["Priced to last", "For design, not for weight."],
  ["Five bands, one language", "Chosen for what they will carry."],
];

const SLOGANS = [
  "Meaning Designed To Last.",
  "We do not sell gold by the gram.",
  "Worn today. Carried by the next hands.",
  "Begin an heirloom.",
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium tracking-[0.28em] text-[#6B6B6B] uppercase dark:text-[#C8C4BC]">
      {children}
    </span>
  );
}

/** EON Fine Jewelry marka kılavuzu — yalnız EON org aktifken render edilir. */
export function EonMarkaKilavuzu() {
  return (
    <div className="relative z-0 mx-auto max-w-5xl space-y-10 pb-28">
      <GoldStream motif="ring" />
      <PageHeader
        title="Marka Kılavuzu"
        description="EON Fine Jewelry görsel ve sözlü kimlik sistemi — sessiz lüks alyans dili."
        action={
          <Button asChild variant="outline">
            <a href={BOARD} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" aria-hidden />
              Tek sayfa pano
            </a>
          </Button>
        }
      />

      <EditorialCard
        trackHeightVh={160}
        image="/brand/cutout/eon-rings.png"
        eyebrow="EON · Fine Jewelry"
        title="Meaning Designed To Last."
        subtitle="Solid gold wedding bands, engraved by hand, made to order — the first object of an inheritance."
      />

      <section className="space-y-5">
        <Eyebrow>01 · Marka</Eyebrow>
        <h2 className="font-serif text-3xl tracking-tight">Kimlik & Ethos</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            EON, gramla altın satmaz. Anlamın ağırlığını satar — bugün takılan,
            yarın elden ele geçen bir mirasın ilk nesnesi. Dil sakin, form
            mimari; gösteriş değil kalıcılık.
          </p>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Konumlandırma: sessiz lüks alyans. Beş profil, tek dil. Her parça
            siparişe üretilir; stok yok, kaplama yok. Site:{" "}
            <a
              href="https://eonfinejewelry.com"
              className="text-foreground underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              eonfinejewelry.com
            </a>
            .
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map(([k, v]) => (
            <Card key={k}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{k}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {v}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <Eyebrow>02 · Koleksiyon</Eyebrow>
        <h2 className="font-serif text-3xl tracking-tight">
          Five bands, one language
        </h2>
        <Card>
          <CardHeader>
            <CardDescription>
              Mimari koleksiyon adları — her biri siparişe kesilir; hero, müze,
              makro ve el çekimleriyle anlatılır.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {COLLECTIONS.map((c) => (
                <li
                  key={c.name}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif text-xl">{c.name}</span>
                    <span className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                      {c.form}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-sm italic">
                    {c.line}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <Eyebrow>03 · Ses & Ton</Eyebrow>
        <h2 className="font-serif text-3xl tracking-tight">Nasıl Konuşuruz</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Kişilik</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                İçten, sakin, açıklayıcı. ABD ana dilinde doğal — metal bilen
                bir ustanın tezgâh üzerinden konuşması gibi. Okuyucuya
                &ldquo;özelsin&rdquo; demeden özel hissettirir.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Yap</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-1.5 text-sm">
                <li>· Solid gold, never plated</li>
                <li>· Made to order · engraved by hand</li>
                <li>· Mimari koleksiyon adları</li>
                <li>· His ve kalıcılık — rakam vaadi yok</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-destructive text-base">Yapma</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-1.5 text-sm">
                <li>· Gram/spot fiyat pazarlığı dili</li>
                <li>· İndirim, aciliyet, flash sale</li>
                <li>· Gösterişçi, gürültülü ton</li>
                <li>· Kaplama / fashion jewelry iması</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="flex items-start gap-3 py-6">
            <Quote
              className="size-5 shrink-0 text-[#1C1C1C] dark:text-[#E8E4DC]"
              aria-hidden
            />
            <p className="font-serif text-xl leading-snug">
              We do not sell gold by the gram. We sell the weight of meaning —
              the first object of an inheritance.
            </p>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map(([k, v]) => (
            <Card key={k}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{k}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-serif text-sm italic leading-relaxed">
                  {v}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <Eyebrow>04 · Logo</Eyebrow>
        <h2 className="font-serif text-3xl tracking-tight">Logo Sistemi</h2>
        <Card>
          <CardHeader>
            <CardDescription>
              Charcoal ink (#1C1C1C) üzerinde mimari lettermark. Warm paper ve
              night paper zeminlerde okunur; altın flaş veya mor vurgu yok.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-4 sm:grid-cols-3">
              {LOGOS.map((l) => (
                <li key={l.src} className="space-y-2">
                  <div className="grid grid-cols-2 overflow-hidden rounded-xl ring-1 ring-black/5">
                    <div className="flex h-24 items-center justify-center bg-[#F5F3EF] p-4">
                      <img
                        src={l.src}
                        alt={l.alt}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex h-24 items-center justify-center bg-[#1C1C1C] p-4">
                      <img
                        src={l.src}
                        alt=""
                        aria-hidden
                        className="h-full w-full object-contain invert"
                      />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-center text-xs font-medium">
                    {l.label}{" "}
                    <span className="text-muted-foreground/70">
                      · paper / night
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <Eyebrow>05 · Renk & Tipografi</Eyebrow>
        <h2 className="font-serif text-3xl tracking-tight">Palet & Yazı</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Renk Paleti</CardTitle>
              <CardDescription>
                Charcoal + warm paper — sessiz lüks; HEX sabit.
              </CardDescription>
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
                    <span className="w-32 text-sm font-semibold">{c.name}</span>
                    <span className="font-mono text-xs tracking-wide text-[#6B6B6B]">
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
              <CardDescription>
                Editoryal serif + sakin geometrik sans.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between gap-4 border-b pb-3">
                <span className="font-serif text-4xl leading-none italic">
                  Aa
                </span>
                <div className="text-right">
                  <p className="text-sm font-semibold">Cormorant Garamond</p>
                  <p className="text-muted-foreground text-xs">
                    Display · başlık & editoryal
                  </p>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-4xl leading-none tracking-tight">Aa</span>
                <div className="text-right">
                  <p className="text-sm font-semibold">DM Sans</p>
                  <p className="text-muted-foreground text-xs">
                    UI · etiket & gövde
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-5">
        <Eyebrow>06 · Fotoğraf</Eyebrow>
        <h2 className="font-serif text-3xl tracking-tight">Sanat Yönetimi</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Çekim dili</CardTitle>
            <CardDescription>
              Hero · museum · macro · hand. Siyah veya warm paper zemin; bol
              negatif alan; metalin kendi ışığı — flashy lifestyle yok.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-[#0A0A0A] ring-1 ring-black/10">
              <img
                src="/brand/cutout/eon-rings.png"
                alt="EON alyans cutout — Meridian ve Keystone referansı"
                className="h-full w-full object-contain p-8"
              />
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              Kaynak cutout:{" "}
              <code className="font-mono">public/brand/cutout/eon-rings.png</code>
              . Drive 04-photography batch tamamlanınca galeri buraya eklenir.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <Eyebrow>07 · Konumlandırma</Eyebrow>
        <h2 className="font-serif text-3xl tracking-tight">İfade & Slogan</h2>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Konumlandırma</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-lg leading-snug italic">
              &ldquo;Solid gold wedding bands, engraved by hand, made to order.
              Nearly everything you own is on its way to being lost — this is
              the one piece made to outlast the hands that wear it, and to be
              handed to the ones who come after.&rdquo;
            </p>
          </CardContent>
        </Card>
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
              <CardTitle className="text-base">Mağaza / Site kısa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                EON Fine Jewelry — meaning designed to last. Solid 10k, 14k and
                18k gold wedding bands. Never plated. Made to order. Engraved
                free, by hand.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
