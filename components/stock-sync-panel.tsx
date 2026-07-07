"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RefreshCw, Loader2, ArrowRight, TriangleAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import {
  previewStockSync,
  applyStockSyncBatch,
  type StockChange,
} from "@/app/(dashboard)/stok/actions";
import type { PushOutcome } from "@/lib/etsy/inventory";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

type Phase = "idle" | "previewing" | "review" | "applying" | "done";

const BATCH = 6;

export function StockSyncPanel({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [changes, setChanges] = useState<StockChange[]>([]);
  const [writeEnabled, setWriteEnabled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outcomes, setOutcomes] = useState<PushOutcome[]>([]);
  const [applyToAll, setApplyToAll] = useState(false);

  const hasVariants = changes.some((c) => c.has_variations);

  async function onPreview() {
    setPhase("previewing");
    try {
      const res = await previewStockSync();
      setWriteEnabled(res.writeEnabled);
      setChanges(res.changes);
      if (!res.connected) {
        toast.error("Etsy bağlı değil. Ayarlar → Etsy'den bağlanın.");
        setPhase("idle");
        return;
      }
      if (res.changes.length === 0) {
        toast.success("Gönderilecek değişiklik yok — her şey güncel.");
        setPhase("idle");
        return;
      }
      setPhase("review");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Önizleme başarısız.");
      setPhase("idle");
    }
  }

  async function onApply() {
    setPhase("applying");
    setProgress(0);
    const ids = changes.map((c) => c.id);
    const all: PushOutcome[] = [];
    try {
      for (let i = 0; i < ids.length; i += BATCH) {
        const slice = ids.slice(i, i + BATCH);
        const res = await applyStockSyncBatch(slice, applyToAll);
        if (res.needsReconnect) {
          toast.error("Yazma izni yok. Ayarlar → Etsy'den yeniden bağlanın.");
          setPhase("review");
          return;
        }
        if (res.error) {
          toast.error(res.error);
          setPhase("review");
          return;
        }
        all.push(...res.outcomes);
        setProgress(Math.min(ids.length, i + slice.length));
      }
    } catch {
      // Ağ hatası/parti reddi: sonsuz "Gönderiliyor…"da kalma — o ana dek
      // uygulanan partilerin özetini göster ki kullanıcı ne gittiğini bilsin.
      toast.error(
        "Bağlantı hatası — gönderim yarıda kesildi. Özet, o ana kadar uygulananları gösterir.",
      );
      setOutcomes(all);
      setPhase(all.length > 0 ? "done" : "review");
      router.refresh();
      return;
    }
    // Denetim kaydı artık her partide sunucuda gerçek sonuçlardan yazılıyor
    // (applyStockSyncBatch) — istemci yalnız özet gösterir.
    const updated = all.filter((o) => o.status === "updated").length;
    const errors = all.filter((o) => o.status === "error").length;
    setOutcomes(all);
    setPhase("done");
    router.refresh();
    if (errors > 0) {
      toast.error(`${updated} güncellendi, ${errors} hata.`);
    } else {
      toast.success(`${updated} ürün Etsy'de güncellendi.`);
    }
  }

  if (phase === "idle" || phase === "previewing") {
    return (
      <Button onClick={onPreview} disabled={!connected || phase === "previewing"}>
        {phase === "previewing" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        Etsy ile Senkronize Et
      </Button>
    );
  }

  if (phase === "done") {
    const updated = outcomes.filter((o) => o.status === "updated");
    const problems = outcomes.filter((o) => o.status === "error");
    const skipped = outcomes.filter((o) => o.status === "skipped");
    return (
      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-4 text-[color:var(--jade,#3F4A44)]" />
            Senkronizasyon tamamlandı
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-sm tabular-nums">
            <span>Güncellenen <b className="text-foreground">{updated.length}</b></span>
            <span>Atlanan <b className="text-foreground">{skipped.length}</b></span>
            <span>Hata <b className="text-foreground">{problems.length}</b></span>
          </div>
          {problems.length > 0 && (
            <ul className="space-y-1 text-xs text-[color:var(--destructive,#b3261e)]">
              {problems.slice(0, 8).map((o, i) => (
                <li key={i}>
                  {o.sku ?? o.listingId}: {o.detail}
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" size="sm" onClick={() => setPhase("idle")}>
            Kapat
          </Button>
        </CardContent>
      </Card>
    );
  }

  // review | applying
  const applying = phase === "applying";
  return (
    <Card>
      <CardContent className="space-y-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium">
            {formatNumber(changes.length)} ürün değişecek
          </div>
          {!writeEnabled && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[color:var(--gold-deep,#9A7A34)]">
              <TriangleAlert className="size-3.5" />
              Yazma izni yok — yeniden bağlanın
            </span>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto rounded-lg border border-[color:var(--line,#DED9CB)]">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground sticky top-0 bg-[color:var(--panel,#F2EFE6)] text-xs">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Ürün</th>
                <th className="px-3 py-2 text-left font-medium">SKU</th>
                <th className="px-3 py-2 text-right font-medium">Şu an</th>
                <th className="px-3 py-2 text-right font-medium">Yeni</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c) => (
                <tr key={c.id} className="border-t border-[color:var(--line-soft,#E9E4D7)]">
                  <td className="max-w-[280px] truncate px-3 py-1.5">{c.title}</td>
                  <td className="text-muted-foreground px-3 py-1.5 font-mono text-xs">
                    {c.sku ?? "—"}
                    {c.has_variations ? " ·var" : ""}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {c.current ?? "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right font-semibold tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <ArrowRight className="text-muted-foreground size-3" />
                      {c.target}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasVariants && (
          <label className="text-muted-foreground flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={applyToAll}
              disabled={applying}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <b className="text-foreground">Varyantlı ürünlerde tüm bedenlere uygula.</b>{" "}
              Bu ürünlerde her beden/uzunluk için ayrı stok tutulur; işaretlersen
              girdiğin adet o listenin <b>tüm bedenlerine</b> yazılır. İşaretlemezsen
              yalnız SKU&apos;su eşleşen tek beden güncellenir (varyantlı satırlar
              atlanır).
            </span>
          </label>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={onApply} disabled={applying || !writeEnabled}>
            {applying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Gönderiliyor… {formatNumber(progress)}/{formatNumber(changes.length)}
              </>
            ) : (
              <>Onayla ve Etsy&apos;ye Gönder ({formatNumber(changes.length)})</>
            )}
          </Button>
          {!applying && (
            <Button variant="outline" onClick={() => setPhase("idle")}>
              İptal
            </Button>
          )}
          {!writeEnabled && (
            <Button asChild variant="outline">
              <Link href="/ayarlar/etsy">Etsy&apos;yi Yeniden Bağla</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
