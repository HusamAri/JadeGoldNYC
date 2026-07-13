"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  setResearchKeyword,
  researchProductNow,
} from "@/app/(dashboard)/analizler/urunler/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Rekabet araştırması kontrolü — listing'in araştırma kelimesini kaydeder
 * ("en çok tıklanan" kelimeyi Etsy Stats'tan girin; boşsa birincil tag) ve
 * cron'u beklemeden HEMEN araştırma çalıştırır.
 */
export function KeywordResearchControls({
  productId,
  currentKeyword,
  fallback,
}: {
  productId: string;
  currentKeyword: string | null;
  fallback: string | null;
}) {
  const [kw, setKw] = useState(currentKeyword ?? "");
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        value={kw}
        onChange={(e) => setKw(e.target.value)}
        placeholder={
          fallback ? `Boşsa birincil tag: ${fallback}` : "Araştırma anahtar kelimesi"
        }
        className="sm:max-w-xs"
        aria-label="Araştırma anahtar kelimesi"
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await setResearchKeyword(productId, kw);
              if (r.error) toast.error(r.error);
              else toast.success("Anahtar kelime kaydedildi");
            })
          }
        >
          Kaydet
        </Button>
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await researchProductNow(productId);
              if (r.error) toast.error(r.error);
              else toast.success(`Araştırma tamam — ${r.count} rakip bulundu`);
            })
          }
        >
          Şimdi araştır
        </Button>
      </div>
    </div>
  );
}
