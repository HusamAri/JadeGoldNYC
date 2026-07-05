"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

import { saveVariantWeight } from "@/app/(dashboard)/tasarimlar/eksik-agirlik/actions";
import type { MissingWeightRow } from "@/lib/db/queries/missing-weights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MissingWeightsForm({ rows }: { rows: MissingWeightRow[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());

  function save(sku: string) {
    const raw = (values[sku] ?? "").replace(",", ".").trim();
    const grams = Number(raw);
    if (!raw || !Number.isFinite(grams) || grams <= 0) {
      toast.error("Geçerli bir gram girin (ör. 5.7).");
      return;
    }
    setSaving((s) => new Set(s).add(sku));
    saveVariantWeight(sku, grams)
      .then((res) => {
        if (res.error) {
          toast.error(res.error);
          return;
        }
        setDone((d) => new Set(d).add(sku));
        toast.success(`${sku} · ${grams} g kaydedildi.`);
      })
      .finally(() =>
        setSaving((s) => {
          const n = new Set(s);
          n.delete(sku);
          return n;
        }),
      );
  }

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground rounded-2xl border border-dashed p-6 text-center text-sm">
        Bu aramada ağırlığı eksik varyant yok.
      </p>
    );
  }

  return (
    <div className="divide-y rounded-2xl border">
      {rows.map((r) => {
        const isDone = done.has(r.sku);
        return (
          <div
            key={r.sku}
            className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
            data-done={isDone}
          >
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs font-medium">{r.sku}</p>
              {r.name && (
                <p className="text-muted-foreground truncate text-xs">{r.name}</p>
              )}
            </div>
            {isDone ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check className="size-4" /> Kaydedildi
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <Input
                    inputMode="decimal"
                    placeholder="0.0"
                    value={values[r.sku] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [r.sku]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && save(r.sku)}
                    className="h-9 w-24 pr-7 text-right tabular-nums"
                  />
                  <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs">
                    g
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={saving.has(r.sku)}
                  onClick={() => save(r.sku)}
                >
                  {saving.has(r.sku) ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Kaydet"
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      })}
      <div className="flex justify-end p-3">
        <Button type="button" variant="outline" size="sm" onClick={() => router.refresh()}>
          Listeyi yenile
        </Button>
      </div>
    </div>
  );
}
