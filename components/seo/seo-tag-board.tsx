"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  X,
  RotateCcw,
  TrendingUp,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import type {
  SeoTagOptimization,
  SeoTagSummary,
} from "@/lib/db/queries/seo-tags";
import {
  pushSeoTag,
  pushSeoBatch,
  rejectSeoTag,
  resetSeoTag,
} from "@/app/(dashboard)/seo-etiketleri/actions";
import { cn } from "@/lib/utils";
import {
  ApiCredentialGuide,
  ETSY_WRITE_GUIDE,
} from "@/components/setup/api-credential-guide";

const ARCH_META: Record<
  string,
  { label: string; ink: string; bg: string; note: string }
> = {
  leak: {
    label: "Leak",
    ink: "oklch(0.55 0.20 20)",
    bg: "oklch(0.55 0.20 20 / 0.10)",
    note: "Yüksek trafik · düşük dönüşüm — para sızdırıyor",
  },
  bestseller: {
    label: "Bestseller",
    ink: "oklch(0.62 0.15 70)",
    bg: "oklch(0.62 0.15 70 / 0.12)",
    note: "Kanıtlı satıcı — her yeni kanal katlanan getiri",
  },
  converter: {
    label: "Converter",
    ink: "oklch(0.55 0.14 160)",
    bg: "oklch(0.55 0.14 160 / 0.12)",
    note: "Yüksek dönüşüm · düşük trafik — trafik getir",
  },
  standart: {
    label: "Standart",
    ink: "oklch(0.55 0.03 280)",
    bg: "oklch(0.55 0.03 280 / 0.10)",
    note: "Dengeli — slot israfını temizle, niyet ekle",
  },
};

type Filter = "all" | "leak" | "bestseller" | "converter" | "standart" | "pushed";

export function SeoTagBoard({
  rows,
  summary,
  writeEnabled,
  isManager,
}: {
  rows: SeoTagOptimization[];
  summary: SeoTagSummary;
  writeEnabled: boolean;
  isManager: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("leak");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const canPush = writeEnabled && isManager;

  const priorityPending = useMemo(
    () =>
      rows.filter(
        (r) =>
          (r.archetype === "leak" || r.archetype === "bestseller") &&
          r.status !== "pushed" &&
          r.status !== "rejected",
      ).length,
    [rows],
  );

  const filtered = useMemo(() => {
    if (filter === "pushed") return rows.filter((r) => r.status === "pushed");
    if (filter === "all") return rows;
    return rows.filter((r) => r.archetype === filter);
  }, [rows, filter]);

  const run = (id: string, fn: () => Promise<{ ok?: boolean; error?: string }>, okMsg: string) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await fn();
      setBusyId(null);
      if (res.error) toast.error(res.error);
      else toast.success(okMsg);
      router.refresh();
    });
  };

  const pushBatch = () => {
    setBusyId("batch");
    startTransition(async () => {
      const res = await pushSeoBatch(["leak", "bestseller"]);
      setBusyId(null);
      if (res.error) toast.error(res.error);
      else
        toast.success(
          `${res.pushed} listing Etsy'ye gönderildi${res.failed ? ` · ${res.failed} hata` : ""}.`,
        );
      router.refresh();
    });
  };

  const tabs: { value: Filter; label: string; count?: number }[] = [
    { value: "leak", label: "Leak", count: summary.byArchetype.leak },
    { value: "bestseller", label: "Bestseller", count: summary.byArchetype.bestseller },
    { value: "converter", label: "Converter", count: summary.byArchetype.converter },
    { value: "standart", label: "Standart", count: summary.byArchetype.standart },
    { value: "pushed", label: "Gönderildi", count: summary.pushed },
    { value: "all", label: "Tümü", count: summary.total },
  ];

  return (
    <div className="space-y-5">
      {/* Özet + öncelikli toplu gönderim (B) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Toplam öneri" value={summary.total} />
        <Stat label="Bekleyen" value={summary.pending} />
        <Stat label="Gönderildi" value={summary.pushed} tone="positive" />
        <Stat label="Reddedildi" value={summary.rejected} />
      </div>

      <div className="rounded-2xl border border-[color:var(--glass-border)] p-4 [background-color:var(--glass)] [background-image:var(--glass-sheen)] shadow-[var(--lift-sm)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {/* Sabit sayı YAZMA — öneriler işlendikçe bayatlar; canlı sayımdan türet. */}
              En yüksek getirili: {summary.byArchetype.leak} leak +{" "}
              {summary.byArchetype.bestseller} bestseller
            </p>
            <p className="text-muted-foreground text-sm">
              Değer-öncelikli ilk grup. Tek tıkla hepsini Etsy&apos;ye gönder —
              gönderim anındaki görüntülenme/favori baz alınır, etki sonradan
              ölçülür.
              {priorityPending === 0 && " · Hepsi işlendi."}
            </p>
          </div>
          <button
            type="button"
            disabled={!canPush || pending || priorityPending === 0}
            onClick={pushBatch}
            className="bg-accent text-accent-foreground inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-[var(--shadow-raised-sm)] transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="size-4" />
            {busyId === "batch" ? "Gönderiliyor…" : `Hepsini gönder (${priorityPending})`}
          </button>
        </div>
        {!writeEnabled && (
          <div className="mt-3 space-y-2">
            <p className="flex items-center gap-1.5 text-xs text-[oklch(0.55_0.20_20)]">
              <AlertTriangle className="size-3.5 shrink-0" />
              Etsy yazma erişimi kapalı — aşağıdaki adımlarla aç, sonra gönder.
            </p>
            <ApiCredentialGuide items={[ETSY_WRITE_GUIDE]} />
          </div>
        )}
        {writeEnabled && !isManager && (
          <p className="text-muted-foreground mt-2 text-xs">
            Gönderim için sahip/yönetici yetkisi gerekir.
          </p>
        )}
      </div>

      {/* Filtre sekmeleri */}
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setFilter(t.value)}
            aria-pressed={filter === t.value}
            className={cn(
              "focus-visible:ring-ring/60 rounded-full px-3.5 py-1.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2",
              filter === t.value
                ? "bg-accent text-accent-foreground shadow-[var(--shadow-raised-sm)]"
                : "text-muted-foreground hover:text-foreground bg-secondary/40",
            )}
          >
            {t.label}
            {t.count != null && (
              <span className="ml-1.5 tabular-nums opacity-70">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-muted-foreground py-10 text-center text-sm">
            Bu görünümde öneri yok.
          </p>
        )}
        {filtered.map((r) => (
          <SeoRow
            key={r.id}
            row={r}
            canPush={canPush}
            busy={pending && busyId === r.id}
            onPush={() =>
              run(r.id, () => pushSeoTag(r.id), "Etsy'ye gönderildi.")
            }
            onReject={() =>
              run(r.id, () => rejectSeoTag(r.id), "Öneri reddedildi.")
            }
            onReset={() => run(r.id, () => resetSeoTag(r.id), "Tekrar sıraya alındı.")}
          />
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "positive";
}) {
  return (
    <div className="rounded-xl border border-[color:var(--glass-border)] p-3 [background-color:var(--glass)] shadow-[var(--lift-sm)]">
      <p className="text-muted-foreground text-[0.7rem] font-medium tracking-wide uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-2xl font-semibold tabular-nums",
          tone === "positive" && "text-[oklch(0.55_0.14_160)]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SeoRow({
  row: r,
  canPush,
  busy,
  onPush,
  onReject,
  onReset,
}: {
  row: SeoTagOptimization;
  canPush: boolean;
  busy: boolean;
  onPush: () => void;
  onReject: () => void;
  onReset: () => void;
}) {
  const arch = ARCH_META[r.archetype ?? "standart"] ?? ARCH_META.standart;
  const oldLower = new Set(r.oldTags.map((t) => t.toLowerCase()));
  const newLower = new Set(r.proposedTags.map((t) => t.toLowerCase()));
  const pushed = r.status === "pushed";
  const rejected = r.status === "rejected";
  const failed = r.status === "failed";

  const viewDelta =
    pushed && r.currentViews != null && r.baselineViews != null
      ? r.currentViews - r.baselineViews
      : null;
  const favDelta =
    pushed && r.currentFavs != null && r.baselineFavs != null
      ? r.currentFavs - r.baselineFavs
      : null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-l-[3px] border-[color:var(--glass-border)] p-4 [background-color:var(--glass)] [background-image:var(--glass-sheen)] shadow-[var(--lift-sm)] transition-shadow",
        (rejected || failed) && "opacity-70",
      )}
      style={{ borderLeftColor: arch.ink }}
    >
      <div className="flex flex-wrap items-start gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{ color: arch.ink, backgroundColor: arch.bg }}
        >
          {arch.label}
        </span>
        {r.ptype && (
          <span className="text-muted-foreground rounded-full bg-secondary/50 px-2 py-0.5 text-[11px] font-medium">
            {r.ptype}
          </span>
        )}
        <a
          href={`https://www.etsy.com/listing/${r.etsyListingId}`}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium"
        >
          <span className="line-clamp-1 max-w-[38ch]">
            {r.title ?? `Listing ${r.etsyListingId}`}
          </span>
          <ExternalLink className="size-3 shrink-0" />
        </a>
        <span className="ml-auto">
          {pushed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.55_0.14_160)]/12 px-2 py-0.5 text-[11px] font-semibold text-[oklch(0.5_0.14_160)]">
              <CheckCircle2 className="size-3" /> Gönderildi
            </span>
          )}
          {rejected && (
            <span className="text-muted-foreground text-[11px] font-semibold">
              Reddedildi
            </span>
          )}
          {failed && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[oklch(0.55_0.20_20)]">
              <AlertTriangle className="size-3" /> Hata
            </span>
          )}
        </span>
      </div>

      {r.keyIssue && (
        <p className="text-muted-foreground mt-2 text-sm">
          <span className="font-medium text-foreground">Sorun:</span> {r.keyIssue}
        </p>
      )}

      {/* Eski → Yeni tag diff */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TagCol
          title="Mevcut"
          tags={r.oldTags}
          mark={(t) => (newLower.has(t.toLowerCase()) ? "keep" : "drop")}
        />
        <TagCol
          title={pushed ? "Gönderilen" : "Önerilen"}
          tags={pushed && r.pushedTags ? r.pushedTags : r.proposedTags}
          mark={(t) => (oldLower.has(t.toLowerCase()) ? "keep" : "add")}
        />
      </div>

      {failed && r.error && (
        <p className="mt-2 text-xs text-[oklch(0.55_0.20_20)]">{r.error}</p>
      )}

      {/* Push sonrası ölçüm */}
      {pushed && (
        <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 font-medium">
            <TrendingUp className="size-3.5" /> Gönderimden bu yana
          </span>
          <span>
            görüntülenme:{" "}
            <b className={cn("tabular-nums", (viewDelta ?? 0) > 0 && "text-[oklch(0.5_0.14_160)]")}>
              {viewDelta == null ? "—" : viewDelta >= 0 ? `+${viewDelta}` : viewDelta}
            </b>
          </span>
          <span>
            favori:{" "}
            <b className={cn("tabular-nums", (favDelta ?? 0) > 0 && "text-[oklch(0.5_0.14_160)]")}>
              {favDelta == null ? "—" : favDelta >= 0 ? `+${favDelta}` : favDelta}
            </b>
          </span>
          {r.baselineCapturedAt && (
            <span className="opacity-70">
              (baz {new Date(r.baselineCapturedAt).toLocaleDateString("tr-TR")})
            </span>
          )}
        </div>
      )}

      {/* Aksiyonlar */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!pushed && !rejected && (
          <>
            <button
              type="button"
              disabled={!canPush || busy}
              onClick={onPush}
              className="bg-accent text-accent-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-[var(--shadow-raised-sm)] transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="size-3.5" />
              {busy ? "Gönderiliyor…" : "Etsy'ye gönder"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onReject}
              className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-secondary/40 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <X className="size-3.5" />
              Reddet
            </button>
          </>
        )}
        {(rejected || failed) && (
          <button
            type="button"
            disabled={busy}
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-secondary/40 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" />
            Tekrar sıraya al
          </button>
        )}
      </div>
    </div>
  );
}

function TagCol({
  title,
  tags,
  mark,
}: {
  title: string;
  tags: string[];
  mark: (t: string) => "keep" | "drop" | "add";
}) {
  return (
    <div>
      <p className="text-muted-foreground mb-1.5 text-[0.7rem] font-medium tracking-wide uppercase">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t, i) => {
          const m = mark(t);
          return (
            <span
              key={`${t}-${i}`}
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-medium",
                m === "keep" && "bg-secondary/50 text-foreground",
                m === "drop" &&
                  "bg-[oklch(0.55_0.20_20)]/10 text-[oklch(0.5_0.19_20)] line-through",
                m === "add" &&
                  "bg-[oklch(0.55_0.14_160)]/12 text-[oklch(0.45_0.14_160)]",
              )}
            >
              {t}
            </span>
          );
        })}
      </div>
    </div>
  );
}
