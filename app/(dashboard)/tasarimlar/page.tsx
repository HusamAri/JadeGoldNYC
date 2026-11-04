import { getActivePlatform } from "@/lib/platform";
import Link from "next/link";
import { Plus, ImageOff, ExternalLink, Package, Lightbulb } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { listListingsIndex } from "@/lib/db/queries/listings";
import {
  deriveKarat,
  deriveColor,
  deriveGroup,
  KARAT_OPTIONS,
  COLOR_OPTIONS,
  GROUP_OPTIONS,
} from "@/lib/listing-facets";
import { CHAPTER_OPTIONS } from "@/lib/collections/chapters";
import { strParam, type RawSearchParams } from "@/lib/searchparams";
import { formatMoney } from "@/lib/money";
import { clampDiscountPct, discountedCents } from "@/lib/discount";
import { formatNumber } from "@/lib/format";
import type { ListingIndexRow } from "@/lib/db/queries/listings";
import { PageHeader } from "@/components/page-header";
import { PushAllSeoButton } from "@/components/listing/push-all-seo-button";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/data-table/search-input";
import { FilterSelect } from "@/components/data-table/filter-select";
import { cn } from "@/lib/utils";

export const metadata = { title: "Listeler" };
// Toplu SEO gönderimi (PushAllSeoButton → server action) bu sayfanın
// fonksiyonunda koşar: listing başına PATCH + read-back + nezaket beklemesi
// ≈ 1-1,5 sn, yani 100+ listing tek çağrıya sığmaz. Action bu yüzden 240 sn'lik
// bütçeyle koşup imleçle yarıda döner (domino) — buradaki 300 sn o bütçenin
// üstüne yanıt/audit payı bırakır, sınır artık işin boyutuna bağlı değildir.
export const maxDuration = 300;

/** Etsy listing durumları (sync `l.state`den gelir) + Türkçe etiket/rozet. */
const LISTING_STATUSES: {
  value: string;
  label: string;
  variant: "success" | "secondary" | "outline" | "warning" | "destructive";
}[] = [
  { value: "active", label: "Aktif", variant: "success" },
  { value: "edit", label: "Düzenlemede", variant: "secondary" },
  { value: "draft", label: "Taslak", variant: "secondary" },
  { value: "inactive", label: "Pasif", variant: "outline" },
  { value: "sold_out", label: "Tükendi", variant: "warning" },
  { value: "expired", label: "Süresi doldu", variant: "destructive" },
];

/** min/max cent → "min" ya da "min – max" (eşitse tek). */
function formatRange(
  minC: number | null,
  maxC: number | null,
  currency: string,
): string {
  if (minC == null) return "—";
  const lo = formatMoney(minC, currency);
  if (maxC == null || maxC === minC) return lo;
  return `${lo} – ${formatMoney(maxC, currency)}`;
}

/**
 * Liste "Fiyat" hücresi — tek taban fiyatı değil, SKU'lu varyantların GERÇEK
 * satış aralığını (min–max) gösterir; manuel indirim (discount_pct) varsa
 * indirimli aralığı öne çıkarır, taban aralığı üstü çizili + "-%X" rozetiyle
 * verir (indirim yalnız panelde; Etsy tabanı değişmez — 0115 kuralı).
 */
function PriceCell({ r }: { r: ListingIndexRow }) {
  const min = r.min_variant_price_cents ?? r.price_cents;
  const max = r.max_variant_price_cents ?? r.price_cents;
  if (min == null) return <span className="text-muted-foreground">—</span>;
  const pct = clampDiscountPct(r.discount_pct);
  if (pct > 0) {
    const dMin = discountedCents(min, pct);
    const dMax = discountedCents(max ?? min, pct);
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-medium text-foreground">
          {formatRange(dMin, dMax, r.currency)}
        </span>
        <span className="text-muted-foreground text-[11px]">
          <span className="line-through">
            {formatRange(min, max, r.currency)}
          </span>
          <span className="ml-1 font-mono text-[10px] text-neon-ink">
            -%{pct}
          </span>
        </span>
      </div>
    );
  }
  return <span>{formatRange(min, max, r.currency)}</span>;
}

function statusMeta(status: string | null) {
  const key = (status ?? "").toLowerCase();
  return (
    LISTING_STATUSES.find((s) => s.value === key) ?? {
      value: status ?? "",
      label: status ?? "—",
      variant: "outline" as const,
    }
  );
}

export default async function ListelerPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const search = strParam(sp.search);
  const status = strParam(sp.status);
  const karat = strParam(sp.karat);
  const renk = strParam(sp.renk);
  const grup = strParam(sp.grup);
  const chapter = strParam(sp.chapter);

  // Platform durumu (3 RPC), auth kapısı ve listing çekimi birbirinden
  // bağımsız — eskiden sırayla await ediliyordu, artık tek turda paralel.
  const [platform, , fetched] = await Promise.all([
    getActivePlatform(),
    requireMembership(),
    listListingsIndex({ search, status }),
  ]);

  // Facet filtreleri (ayar/renk/grup) başlık+SKU'dan türetilir — Etsy shop
  // section senkronda yok; tüm satırlar zaten tek sayfada geldiğinden filtre
  // burada uygulanır (lib/listing-facets.ts, gerçek katalogla test edildi).
  const rows = fetched.filter((r) => {
    if (karat && deriveKarat(r.title, r.sku) !== karat) return false;
    if (renk && deriveColor(r.title, r.sku) !== renk) return false;
    if (grup && deriveGroup(r.title) !== grup) return false;
    // Bölüm DB'de saklanır (0138) — türetilmez, çünkü elle sabitlenebilir.
    if (chapter && r.chapter !== chapter) return false;
    return true;
  });

  const total = rows.length;
  // Etsy `state` sync'te olduğu gibi gelir (küçük harf); KPI büyük/küçük duyarsız.
  const active = rows.filter(
    (r) => (r.status ?? "").toLowerCase() === "active",
  ).length;
  const missingWeight = rows.filter((r) => r.missing_weight_count > 0).length;
  const noKeyword = rows.filter(
    (r) => !(r.research_keyword ?? "").trim(),
  ).length;
  const filtered = Boolean(search || status || karat || renk || grup || chapter);

  return (
    <div className="flex flex-col gap-8 pb-24">
      <PageHeader
        eyebrow="07 · Etsy'ye Taslak"
        meta={`${platform.label} aynası · ${formatNumber(total)} listing`}
        title="Listeler"
        description={`${platform.label}'deki listing'lerin aynası; detaylar listing sayfasında, taslaklar ve arşiv Listing Önerileri'nde.`}
        action={
          <>
            <PushAllSeoButton />
            <Link href="/tasarimlar/listing/yeni" className="cta-pill jg-focus-outline">
              Yeni listing
              <span className="arrow" aria-hidden>
                <Plus />
              </span>
            </Link>
          </>
        }
        secondary={
          <>
            <Link className="ghost-link" href="/tasarimlar/varyant-hesapla">Otomatik varyant</Link>
            <span>·</span>
            <Link className="ghost-link" href="/tasarimlar/etsy-agirlik">Etsy&apos;ye ağırlık</Link>
          </>
        }
      />

      {/* Dekor bandı — tozlu mavi; dört sayı tek şeritte (filtreye saygı duyar). */}
      <section aria-label="Özet" className="gcard !h-auto !flex-row !items-end !justify-between gap-6 !py-5 max-md:!flex-col max-md:!items-start">
        <div className="relative grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-4">
          <BandStat label="Toplam listing" value={formatNumber(total)} />
          <BandStat label="Aktif" value={formatNumber(active)} />
          <BandStat label="Eksik gramlı" value={formatNumber(missingWeight)} warn={missingWeight > 0} hint="en az bir varyantta gram yok" />
          <BandStat label="Kelimesiz" value={formatNumber(noKeyword)} warn={noKeyword > 0} hint="araştırma kelimesi girilmemiş" />
        </div>
        <span className="mono-label relative shrink-0">
          {filtered ? "özet uygulanan filtreye göre" : "tüm katalog"}
        </span>
      </section>

      <section>
        <div className="sec-h">
          <span className="num">A</span>
          <h2>Listingler</h2>
          <span className="mono-label right">{formatNumber(total)} listing · tümü listelendi</span>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput placeholder="Başlık veya SKU…" />
          <FilterSelect
            paramKey="status"
            placeholder="Durum"
            options={LISTING_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
          />
          <FilterSelect paramKey="karat" placeholder="Ayar" options={KARAT_OPTIONS} className="w-[110px]" />
          <FilterSelect paramKey="renk" placeholder="Renk" options={COLOR_OPTIONS} className="w-[140px]" />
          <FilterSelect paramKey="grup" placeholder="Grup" options={GROUP_OPTIONS} className="w-[150px]" />
          <FilterSelect paramKey="chapter" placeholder="Bölüm" options={CHAPTER_OPTIONS} className="w-[170px]" />
        </div>

        {rows.length === 0 ? (
          filtered ? (
            <EmptyState
              className="mt-5"
              icon={Package}
              title="Bu filtreyle sonuç yok"
              description="Arama veya durum filtresine uyan listing bulunamadı. Filtreyi temizleyip tüm listingleri görebilirsiniz."
              action={
                <Button asChild variant="outline">
                  <Link href="/tasarimlar">Filtreyi temizle</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              className="mt-5"
              icon={Package}
              title="Etsy'de listing yok"
              description="Bu ekran yalnız Etsy'de var olanları gösterir. Etsy senkronunu Ayarlar'dan çalıştırın; panelde hazırladığınız taslaklar 'Listing Önerileri' ekranındadır."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild variant="outline">
                    <Link href="/listing-onerileri">
                      <Lightbulb />
                      Listing Önerileri
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/tasarimlar/listing/yeni">
                      <Plus />
                      Yeni Taslak
                    </Link>
                  </Button>
                </div>
              }
            />
          )
        ) : (
          /* Galeri: görsel önde, altında başlık + mono künye; durum asit/hairline rozet. */
          <ul className="mt-5 grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {rows.map((r) => {
              const sm = statusMeta(r.status);
              const keyword = (r.research_keyword ?? "").trim();
              const isActive = sm.value === "active";
              return (
                <li key={r.id} className="group flex min-w-0 flex-col">
                  <Link href={`/tasarimlar/listing/${r.id}`} className="bg-muted relative block aspect-square overflow-hidden rounded-[16px] border border-[color:var(--rule-2)]">
                    {r.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image_url} alt={r.title} className="size-full object-cover transition-transform duration-500 ease-[var(--ease-quiet)] group-hover:scale-[1.03]" />
                    ) : (
                      <span className="text-muted-foreground/50 flex size-full items-center justify-center">
                        <ImageOff className="size-5" />
                      </span>
                    )}
                    <span
                      className={cn(
                        "absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[9.5px] tracking-[0.1em] uppercase",
                        isActive ? "bg-neon text-[color:var(--neon-fg)]" : "bg-background/85 text-foreground border border-[color:var(--rule)]",
                      )}
                    >
                      {sm.label}
                    </span>
                    {r.missing_weight_count > 0 && (
                      <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-background/85 px-2 py-1 font-mono text-[9.5px] tracking-[0.08em] text-[var(--negative)] uppercase">
                        {r.missing_weight_count} gramsız
                      </span>
                    )}
                  </Link>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <Link href={`/tasarimlar/listing/${r.id}`} className="line-clamp-2 text-[13.5px] font-medium leading-snug hover:underline" title={r.title}>
                      {r.title}
                    </Link>
                    {r.etsy_listing_id != null && (
                      <a
                        href={`https://www.etsy.com/listing/${r.etsy_listing_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0"
                        aria-label="Etsy'de aç"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="mono-label mt-1.5 flex items-center justify-between gap-2">
                    <span className="truncate">{r.sku ?? "—"}{r.etsy_listing_id != null ? ` · #${r.etsy_listing_id}` : ""}</span>
                    <span className="shrink-0 text-foreground"><PriceCell r={r} /></span>
                  </div>
                  <div className="mono-label mt-1.5 flex items-center justify-between gap-2">
                    <span className="truncate" title={keyword ? (r.has_research ? "Rakip araştırması var" : "Henüz rakip araştırması yok") : undefined}>
                      {keyword ? (
                        <>
                          <i className={cn("mr-1.5 inline-block size-1.5 rounded-full align-middle", r.has_research ? "bg-neon" : "bg-[color:var(--rule)]")} />
                          <span className="normal-case tracking-normal">{keyword}</span>
                        </>
                      ) : (
                        "kelime yok"
                      )}
                    </span>
                    <span className="shrink-0">
                      {r.variant_count} var.
                      {r.ads30_spend_cents != null ? ` · reklam ${formatMoney(r.ads30_spend_cents, r.currency)}` : ""}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Dekor bandı hücresi — mono etiket + Fraunces rakam. */
function BandStat({ label, value, hint, warn }: { label: string; value: string; hint?: string; warn?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="mono-label">{label}</p>
      <p className={cn("ledger-num mt-1.5 text-[36px]", warn && "text-[var(--negative)]")}>{value}</p>
      {hint && <p className="mono-label mt-1 normal-case tracking-[0.06em]">{hint}</p>}
    </div>
  );
}
