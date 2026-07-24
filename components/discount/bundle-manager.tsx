"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  createDiscountBundle,
  deleteDiscountBundle,
} from "@/app/(dashboard)/indirimler/actions";
import type {
  BundleProductOption,
  DiscountBundleRow,
} from "@/lib/db/queries/discount-bundles";
import { formatMoney, parseMoneyToCents } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { discountWindowStatus } from "@/lib/discount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WINDOW_META: Record<string, { label: string; cls: string }> = {
  aktif: { label: "aktif", cls: "text-emerald-600 dark:text-emerald-400" },
  planli: { label: "planlı", cls: "text-[color:var(--tl-doing)]" },
  gecmis: { label: "süresi doldu", cls: "text-muted-foreground" },
};

/**
 * Paket indirim yöneticisi — iki ürünü eşle + yüzde/pencere/min sepet gir;
 * mevcut paketleri listele/sil. Panel-içi plan (Etsy'ye yazılmaz).
 */
export function BundleManager({
  bundles,
  products,
  currency,
  todayIso,
}: {
  bundles: DiscountBundleRow[];
  products: BundleProductOption[];
  currency: string;
  todayIso: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [pct, setPct] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [note, setNote] = useState("");

  function reset() {
    setA("");
    setB("");
    setPct("");
    setStartAt("");
    setEndAt("");
    setMinOrder("");
    setNote("");
  }

  function submit() {
    const n = Math.round(Number(pct.replace(",", ".")));
    if (!a || !b) {
      toast.error("İki ürün de seçilmeli.");
      return;
    }
    if (a === b) {
      toast.error("Bir ürün kendisiyle eşlenemez.");
      return;
    }
    if (!Number.isFinite(n) || n <= 0 || n > 90) {
      toast.error("İndirim %1–90 arası olmalı.");
      return;
    }
    start(async () => {
      const r = await createDiscountBundle({
        productAId: a,
        productBId: b,
        pct: n,
        startAt: startAt || null,
        endAt: endAt || null,
        minOrderCents: minOrder.trim() ? parseMoneyToCents(minOrder) : null,
        note: note || null,
      });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Paket indirimi eklendi.");
      reset();
      router.refresh();
    });
  }

  function remove(id: string) {
    start(async () => {
      const r = await deleteDiscountBundle(id);
      if (r.error) toast.error(r.error);
      else {
        toast.success("Paket silindi.");
        router.refresh();
      }
    });
  }

  const productSelect = (
    value: string,
    onChange: (v: string) => void,
    label: string,
    exclude: string,
  ) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full" size="sm">
          <SelectValue placeholder="Ürün seç…" />
        </SelectTrigger>
        <SelectContent>
          {products
            .filter((p) => p.id !== exclude)
            .map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <span className="truncate">{p.title}</span>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Yeni paket formu */}
      <div className="nm-raised space-y-4 rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <Package className="text-muted-foreground size-4" />
          <p className="text-sm font-medium">Yeni paket indirimi</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {productSelect(a, setA, "1. ürün", b)}
          {productSelect(b, setB, "2. ürün", a)}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label>İndirim %</Label>
            <Input
              type="number"
              min={1}
              max={90}
              value={pct}
              onChange={(e) => setPct(e.target.value)}
              className="w-24 tabular-nums"
              placeholder="10"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Başlangıç</Label>
            <Input
              type="date"
              value={startAt}
              max={endAt || undefined}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-40 tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Bitiş</Label>
            <Input
              type="date"
              value={endAt}
              min={startAt || undefined}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-40 tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Min. sepet ({currency})</Label>
            <Input
              inputMode="decimal"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="—"
              className="w-28 text-right tabular-nums"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Not (opsiyonel)</Label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ör. Sevgililer günü paketi"
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Paketi ekle
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Panel-içi plan: Etsy API paket/kupon kabul etmez — paketi Etsy&apos;de
          elle kurar, buradan takip edersin.
        </p>
      </div>

      {/* Mevcut paketler */}
      {bundles.length === 0 ? (
        <p className="text-muted-foreground text-sm">Henüz paket yok.</p>
      ) : (
        <ul className="divide-y">
          {bundles.map((bd) => {
            const status = discountWindowStatus(
              bd.start_at,
              bd.end_at,
              todayIso,
            );
            const meta = WINDOW_META[status];
            return (
              <li
                key={bd.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium">
                    {bd.product_a_title ?? "—"}{" "}
                    <span className="text-muted-foreground">+</span>{" "}
                    {bd.product_b_title ?? "—"}
                  </p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    <span className="text-foreground font-semibold">
                      %{bd.discount_pct}
                    </span>
                    {bd.start_at || bd.end_at ? (
                      <>
                        {" · "}
                        <span className={meta.cls}>{meta.label}</span>
                        {" · "}
                        {bd.start_at ? formatDate(bd.start_at) : "…"}–
                        {bd.end_at ? formatDate(bd.end_at) : "…"}
                      </>
                    ) : (
                      " · süresiz"
                    )}
                    {bd.min_order_cents != null
                      ? ` · min ${formatMoney(bd.min_order_cents, currency)}`
                      : ""}
                    {bd.note ? ` · ${bd.note}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  disabled={pending}
                  onClick={() => remove(bd.id)}
                  aria-label="Paketi sil"
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
