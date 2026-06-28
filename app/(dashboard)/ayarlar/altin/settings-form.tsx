"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveGoldSettings, type GoldSettingsResult } from "./actions";

interface Props {
  price14k: number;
  price10k: number;
}

export function GoldSettingsForm({ price14k, price10k }: Props) {
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
            defaultValue={price10k}
            placeholder="65.00"
          />
        </div>
      </div>

      {state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}
      {state.ok && (
        <p className="text-sm text-emerald-600">Ayarlar kaydedildi.</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
