"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveGoldSettings, type GoldSettingsResult } from "./actions";

interface Props {
  price14k: number;
  price10k: number;
  /** 10K org tarafından girilmedi; gösterilen değer spottan türetilmiş. */
  derived10k: boolean;
}

export function GoldSettingsForm({ price14k, price10k, derived10k }: Props) {
  const [state, formAction, pending] = useActionState<
    GoldSettingsResult,
    FormData
  >((_prev, fd) => saveGoldSettings(fd), {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price_14k">14K Alim Fiyati (USD/gram)</Label>
          <Input
            id="price_14k"
            name="price_14k"
            type="number"
            step="0.01"
            min="0"
            defaultValue={price14k}
            placeholder="101.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_10k">10K Alim Fiyati (USD/gram)</Label>
          <Input
            id="price_10k"
            name="price_10k"
            type="number"
            step="0.01"
            min="0"
            defaultValue={derived10k ? "" : price10k}
            placeholder={price10k.toFixed(2)}
          />
          <p className="text-muted-foreground text-xs">
            {derived10k
              ? `Bos: canli spot + 14K iscilik priminden turetiliyor (su an $${price10k.toFixed(2)}). Tedarikci 10K teklifi gelince buraya yazin.`
              : "Bos birakirsaniz spottan turetilir (14K iscilik primi + 10K altin degeri)."}
          </p>
        </div>
      </div>

      {state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}
      {state.ok && (
        <p className="text-primary text-sm">Ayarlar kaydedildi.</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
