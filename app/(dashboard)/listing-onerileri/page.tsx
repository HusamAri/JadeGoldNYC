import Link from "next/link";
import { Lightbulb, Archive, Plus, ExternalLink, ImageOff } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { listListingsIndex, getListingLoopStatus } from "@/lib/db/queries/listings";
import { formatMoney } from "@/lib/money";
import { formatNumber, formatDateTime } from "@/lib/format";
import { discountedCents } from "@/lib/discount";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ListingLifecycleButton } from "@/components/listing/listing-lifecycle-button";
import { ReconcileEtsyButton } from "@/components/listing/reconcile-etsy-button";

export const metadata = { title: "Listing Önerileri" };

type IndexRows = Awaited<ReturnType<typeof listListingsIndex>>;

/**
 * Listing Önerileri — V7 "galeri" yapısı (Etsy'ye Taslak bölümü): görsel
 * ağırlıklı taslak kartları solda, sağda kuyruk rayı (tek halka: taslak →
 * Etsy'de taslak → canlı), altta arşiv kompakt liste. Etsy'de HENÜZ/ARTIK
 * olmayan listing'ler buradadır; ana Listeler ekranı yalnız Etsy'de var
 * olanları gösterir (Etsy-ayna kuralı).
 */
export default async function ListingOnerileriPage() {
  const m = await requireMembership();
  const [drafts, archived, loop] = await Promise.all([
    listListingsIndex({ scope: "suggestions" }),
    listListingsIndex({ scope: "archived" }),
    getListingLoopStatus(m.org_id),
  ]);
  const total = loop.pending + loop.sent + loop.live;

  return (
    <div className="flex flex-col gap-8 pb-24">
      <PageHeader
        eyebrow="06 · Etsy'ye Taslak"
        meta={`${formatNumber(drafts.length)} taslak bekliyor`}
        title="Listing Önerileri"
        description="Panelde hazırlanan, Etsy'ye henüz gönderilmemiş taslaklar. Gönderilince ana Listeler'e taşınır; arşiv altta durur."
        action={
          <Link href="/tasarimlar/listing/yeni" className="cta-pill jg-focus-outline">
            Yeni taslak
            <span className="arrow" aria-hidden>
              <Plus />
            </span>
          </Link>
        }
        secondary={<ReconcileEtsyButton />}
      />

      <section className="grid gap-x-12 gap-y-10 xl:grid-cols-[1fr_300px]">
        {/* Galeri */}
        <div className="min-w-0">
          <div className="sec-h">
            <span className="num">A</span>
            <h2>Panel taslakları</h2>
            <span className="mono-label right">{formatNumber(drafts.length)} taslak · Etsy&apos;de değil</span>
          </div>
          {drafts.length === 0 ? (
            <EmptyState
              className="mt-5"
              icon={Lightbulb}
              title="Panel taslağı yok"
              description="Etsy'ye gönderilmeyi bekleyen taslak yok. 'Yeni taslak' ile öneri ekleyebilirsiniz."
            />
          ) : (
            <Gallery rows={drafts} mode="archive" />
          )}
        </div>

        {/* Kuyruk rayı */}
        <aside className="min-w-0">
          <div className="sec-h">
            <span className="num">B</span>
            <h2>Kuyruk</h2>
          </div>
          <div className="mt-5 flex items-center gap-5">
            <QueueRing pending={loop.pending} sent={loop.sent} live={loop.live} />
            <div className="mono-label flex flex-col gap-2">
              <span className="flex items-center gap-2"><i className="bg-neon inline-block size-2 rounded-full" />{formatNumber(loop.pending)} panelde</span>
              <span className="flex items-center gap-2"><i className="inline-block size-2 rounded-full bg-[color:var(--blue-2)]" />{formatNumber(loop.sent)} Etsy&apos;de taslak</span>
              <span className="flex items-center gap-2"><i className="inline-block size-2 rounded-full bg-[color:var(--foreground)]" />{formatNumber(loop.live)} canlı</span>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-2">
            <Link href="/tasarimlar" className="inset-row jg-focus-outline">
              <span>Etsy&apos;deki taslakları yayına al</span>
              <span>{formatNumber(loop.sent)} →</span>
            </Link>
            <Link href="/tasarimlar/varyant-hesapla" className="inset-row jg-focus-outline">
              <span>Varyant ızgarasını kur</span>
              <span>→</span>
            </Link>
          </div>
          <p className="mono-label mt-5 leading-relaxed">
            {loop.lastSyncAt ? `Etsy aynası ${formatDateTime(loop.lastSyncAt)}` : "Etsy senkronu yok"}
            {total > 0 ? ` · ${formatNumber(total)} listing toplam` : ""}
          </p>
        </aside>
      </section>

      {/* Arşiv — kompakt liste */}
      <section>
        <div className="sec-h">
          <span className="num">C</span>
          <h2>Arşiv</h2>
          <span className="mono-label right">{formatNumber(archived.length)} arşivli · panelden gizli</span>
        </div>
        {archived.length === 0 ? (
          <p className="note mt-4">
            <span className="mark">†</span>
            <span>Arşivlenmiş listing yok. Listeler ya da taslaklardan arşivlediğiniz kayıtlar burada toplanır.</span>
          </p>
        ) : (
          <ul className="mt-1">
            {archived.map((r) => (
              <li key={r.id} className="flex items-center gap-4 border-b border-[color:var(--rule-2)] py-3">
                <Thumb src={r.image_url} className="size-10 rounded-[8px]" />
                <div className="min-w-0 flex-1">
                  <Link href={`/tasarimlar/listing/${r.id}`} className="block truncate text-sm font-medium hover:underline" title={r.title}>
                    {r.title}
                  </Link>
                  <span className="mono-label">{r.sku ?? "—"}</span>
                </div>
                <span className="mono-label hidden text-foreground sm:block">
                  {r.price_cents == null ? "—" : formatMoney(r.price_cents, r.currency)}
                </span>
                {r.etsy_listing_id ? (
                  <a
                    href={`https://www.etsy.com/listing/${r.etsy_listing_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground inline-flex"
                    aria-label="Etsy'de aç"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                ) : (
                  <Archive className="text-muted-foreground size-4" aria-hidden />
                )}
                <ListingLifecycleButton id={r.id} mode="restore" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Thumb({ src, className }: { src: string | null; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`${className ?? ""} shrink-0 object-cover`} />
  ) : (
    <div className={`${className ?? ""} bg-muted text-muted-foreground flex shrink-0 items-center justify-center`}>
      <ImageOff className="size-4" />
    </div>
  );
}

/** Görsel ağırlıklı taslak kartları — 4:3 fotoğraf, hairline çerçeve. */
function Gallery({ rows, mode }: { rows: IndexRows; mode: "archive" | "restore" }) {
  return (
    <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => {
        const price =
          r.price_cents == null
            ? null
            : r.discount_pct > 0
              ? (discountedCents(r.price_cents, r.discount_pct) ?? r.price_cents)
              : r.price_cents;
        return (
          <li key={r.id} className="group flex flex-col overflow-hidden rounded-[18px] border border-[color:var(--rule)] transition-colors hover:border-[color:var(--hairline)]">
            <Link href={`/tasarimlar/listing/${r.id}`} className="bg-muted relative block aspect-[4/3] overflow-hidden">
              {r.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image_url} alt={r.title} className="size-full object-cover transition-transform duration-500 ease-[var(--ease-quiet)] group-hover:scale-[1.03]" />
              ) : (
                <span className="text-muted-foreground flex size-full items-center justify-center"><ImageOff className="size-6" /></span>
              )}
              {r.variant_count > 0 && (
                <span className="tag-neon absolute left-3 top-3">{r.variant_count} varyant</span>
              )}
            </Link>
            <div className="flex flex-1 flex-col gap-1.5 px-4 pt-3.5 pb-4">
              <Link href={`/tasarimlar/listing/${r.id}`} className="h-serif line-clamp-2 text-[17px] leading-snug hover:underline" title={r.title}>
                {r.title}
              </Link>
              <div className="mono-label flex items-center justify-between gap-2">
                <span className="truncate">{r.sku ?? "—"}</span>
                <span className="text-foreground shrink-0">
                  {price == null ? "—" : formatMoney(price, r.currency)}
                  {r.discount_pct > 0 && <span className="text-muted-foreground ml-1.5">−%{r.discount_pct}</span>}
                </span>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                <span className="mono-label">{r.variant_count > 0 ? "ızgara hazır" : "tek parça"}</span>
                <ListingLifecycleButton id={r.id} mode={mode} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Tek halka: panel (asit) → Etsy taslak (tozlu mavi) → canlı (mürekkep). */
function QueueRing({ pending, sent, live }: { pending: number; sent: number; live: number }) {
  const total = pending + sent + live;
  const r = 44;
  const c = 2 * Math.PI * r;
  const seg = (n: number) => (total > 0 ? (c * n) / total : 0);
  const a = seg(pending);
  const b = seg(sent);
  const d = seg(live);
  return (
    <div className="relative size-[116px] shrink-0" role="img" aria-label={`${pending} panelde, ${sent} Etsy'de taslak, ${live} canlı`}>
      <svg viewBox="0 0 116 116" className="size-full -rotate-90">
        <circle cx="58" cy="58" r={r} fill="none" stroke="var(--rule)" strokeWidth="7" />
        {live > 0 && <circle cx="58" cy="58" r={r} fill="none" stroke="var(--foreground)" strokeWidth="7" strokeDasharray={`${d} ${c}`} strokeDashoffset={-(a + b)} />}
        {sent > 0 && <circle cx="58" cy="58" r={r} fill="none" stroke="var(--blue-2)" strokeWidth="7" strokeDasharray={`${b} ${c}`} strokeDashoffset={-a} />}
        {pending > 0 && <circle cx="58" cy="58" r={r} fill="none" stroke="var(--neon)" strokeWidth="7" strokeDasharray={`${a} ${c}`} style={{ filter: "drop-shadow(0 0 4px var(--neon-glow))" }} />}
        <circle cx="58" cy="58" r="33" fill="none" stroke="var(--rule-2)" strokeWidth="1" strokeDasharray="1 4" />
      </svg>
      <span className="ledger-num absolute inset-0 flex items-center justify-center text-[30px]">{formatNumber(total)}</span>
    </div>
  );
}
