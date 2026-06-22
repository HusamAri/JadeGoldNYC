/* eslint-disable @next/next/no-img-element */
// SVG/HTML marka varlıkları public/ altından (CDN) servis edilir; next/image
// yerine düz <img> daha uygun (vektör, sabit boyut, harici fetch yok).
import { ExternalLink, Download } from "lucide-react";

import { PageHeader } from "@/components/page-header";
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
  { hex: "#B89347", name: "Antik Altın", use: "Birincil · markalar & vurgu", dark: true },
  { hex: "#F2EFE6", name: "Sıcak Fildişi", use: "Aydınlık zemin", dark: false },
  { hex: "#A39F94", name: "Taş Grisi", use: "Nötr destek", dark: false },
  { hex: "#3F4A44", name: "Derin Jade", use: "Derinlik · ikincil", dark: true },
  { hex: "#131313", name: "Kömür", use: "Koyu zemin", dark: true },
];

const LOGOS = [
  { src: "/brand/logo/logo-primary.svg", label: "Birincil kilit", alt: "JADE GOLD NYC birincil logo kiliti" },
  { src: "/brand/logo/logo-wordmark.svg", label: "Kelime markası", alt: "JADE GOLD kelime markası" },
  { src: "/brand/logo/logo-stacked.svg", label: "İstifli", alt: "JADE GOLD NYC istifli logo" },
  { src: "/brand/logo/monogram-jg.svg", label: "JG Monogram", alt: "İç içe geçmiş JG monogramı" },
  { src: "/brand/logo/seal-badge.svg", label: "Mühür", alt: "Jade Gold New York City dairesel mührü" },
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

export default function MarkaKilavuzuPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Marka Kılavuzu"
        description="Jade Gold NYC görsel kimlik sistemi — logo, renk, tipografi ve ikonografi."
        action={
          <Button asChild variant="outline">
            <a href={BOARD} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" aria-hidden />
              Tam panoyu aç
            </a>
          </Button>
        }
      />

      {/* Logo sistemi */}
      <Card>
        <CardHeader>
          <CardTitle>Logo Sistemi</CardTitle>
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
                <p className="text-muted-foreground text-center text-xs font-medium">{l.label}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Renk paleti */}
        <Card>
          <CardHeader>
            <CardTitle>Renk Paleti</CardTitle>
            <CardDescription>Beş çekirdek renk — her zaman HEX ile referans verin.</CardDescription>
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
                  <span className="font-mono text-xs tracking-wide text-[#9a7d3e]">{c.hex}</span>
                  <span className="text-muted-foreground ml-auto text-xs">{c.use}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Tipografi */}
        <Card>
          <CardHeader>
            <CardTitle>Tipografi</CardTitle>
            <CardDescription>İki sesli sistem — yüksek kontrastlı serif + geometrik sans.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between gap-4 border-b pb-3">
              <span className="text-4xl leading-none" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                Aa
              </span>
              <div className="text-right">
                <p className="text-sm font-semibold">Meno Banner</p>
                <p className="text-muted-foreground text-xs">Didone başlık · editoryal ses</p>
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-4xl leading-none tracking-wide" style={{ fontFamily: "'Futura', 'Century Gothic', sans-serif" }}>
                Aa
              </span>
              <div className="text-right">
                <p className="text-sm font-semibold">ITC Avant Garde Gothic</p>
                <p className="text-muted-foreground text-xs">Geometrik sans · logo, etiket, gövde</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* İkonografi */}
      <Card>
        <CardHeader>
          <CardTitle>İkonografi</CardTitle>
          <CardDescription>Tek ağırlıkta çizgi ikon seti (8 adet), antik altın.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {ICONS.map(([file, label]) => (
              <li key={file} className="space-y-2">
                <div className="flex aspect-square items-center justify-center rounded-xl bg-[#F0EEE8] p-1.5 ring-1 ring-black/5">
                  <img src={`/brand/icons/icon-${file}.svg`} alt={`${label} ikonu`} className="h-full w-full object-contain" />
                </div>
                <p className="text-muted-foreground text-center text-[11px]">{label}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Tam pano (gömülü) */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Kılavuz Panosu</CardTitle>
            <CardDescription>Tek sayfa marka kılavuz panosu (1728×1152).</CardDescription>
          </div>
          <Button asChild size="sm" variant="ghost">
            <a href={BOARD} download>
              <Download className="size-4" aria-hidden />
              İndir / Aç
            </a>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-[#131313]">
            <iframe
              src={BOARD}
              title="Jade Gold NYC marka kılavuzu panosu"
              loading="lazy"
              className="block aspect-[1728/1152] w-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
