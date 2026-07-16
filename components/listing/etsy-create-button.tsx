"use client";

import { useState, useTransition } from "react";
import { UploadCloud, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  runEtsyCreate,
  type EtsyCreateRunResult,
} from "@/app/(dashboard)/tasarimlar/etsy-create-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Onaylı taslakları Etsy'de DRAFT olarak oluşturma tetikleyicisi.
 * "önce 1'de doğrula" akışı: ilk buton tek taslak oluşturur, sonucu gösterir;
 * doğruysa "kalanları oluştur" ile toplu devam edilir. Dışa-dönük iş — motor
 * canlı Etsy'ye yazar; her deneme etsy_create_log'a düşer.
 */
export function EtsyCreateButton({ approvedCount }: { approvedCount: number }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<EtsyCreateRunResult | null>(null);
  const [confirming, setConfirming] = useState<null | number>(null);

  function run(limit: number) {
    startTransition(async () => {
      const res = await runEtsyCreate(limit);
      setResult(res);
      setConfirming(null);
      if (!res.ok) {
        toast.error(res.error ?? "Oluşturma başarısız");
        return;
      }
      toast.success(
        `${res.created} oluşturuldu · ${res.failed} hata · ${res.skipped} atlandı`,
      );
    });
  }

  if (approvedCount === 0 && !result) {
    return (
      <p className="text-muted-foreground text-xs">
        Etsy&apos;de oluşturmaya hazır (onaylı) taslak yok.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {confirming === null ? (
          <>
            <Button
              size="sm"
              disabled={pending || approvedCount === 0}
              onClick={() => setConfirming(1)}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UploadCloud className="size-4" />
              )}
              İlk taslağı Etsy&apos;de oluştur (doğrulama)
            </Button>
            {approvedCount > 1 && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => setConfirming(approvedCount)}
              >
                Kalan {approvedCount} onaylıyı oluştur
              </Button>
            )}
            <span className="text-muted-foreground text-xs">
              {approvedCount} onaylı taslak · canlı Etsy&apos;ye DRAFT yazar
            </span>
          </>
        ) : (
          <>
            <span className="text-sm">
              {confirming === 1
                ? "1 taslağı"
                : `${confirming} taslağı`}{" "}
              canlı Etsy&apos;de DRAFT olarak oluştur — emin misin?
            </span>
            <Button size="sm" disabled={pending} onClick={() => run(confirming)}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Evet, oluştur
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirming(null)}
            >
              Vazgeç
            </Button>
          </>
        )}
      </div>

      {result?.ok && result.rows.length > 0 && (
        <div className="space-y-1.5 text-sm">
          {result.rows.map((r) => (
            <div
              key={r.product_id}
              className="flex flex-wrap items-center gap-2"
            >
              <Badge
                variant={
                  r.outcome === "created"
                    ? "default"
                    : r.outcome === "failed"
                      ? "destructive"
                      : "secondary"
                }
              >
                {r.outcome}
                {r.step ? ` · ${r.step}` : ""}
              </Badge>
              <span className="text-muted-foreground truncate max-w-[360px]">
                {r.title ?? r.product_id}
              </span>
              {r.etsy_listing_id && (
                <a
                  href={`https://www.etsy.com/listing/${r.etsy_listing_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                >
                  Etsy&apos;de aç <ExternalLink className="size-3" />
                </a>
              )}
              {r.error && (
                <span className="text-destructive text-xs">{r.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
