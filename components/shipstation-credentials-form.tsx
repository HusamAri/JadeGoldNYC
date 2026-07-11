"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import { saveShipStationCredentials } from "@/app/(dashboard)/ayarlar/shipstation/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Şirkete özel ShipStation API anahtarı formu. Sırlar geri OKUNMAZ
 * (service-role-only tablo); form her zaman boş başlar, kaydetmek üzerine yazar.
 */
export function ShipStationCredentialsForm({
  configured,
}: {
  configured: boolean;
}) {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveShipStationCredentials(apiKey, apiSecret);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("ShipStation anahtarları kaydedildi");
      setApiKey("");
      setApiSecret("");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ss-key">API Key</Label>
          <Input
            id="ss-key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={configured ? "•••••••• (kayıtlı — değiştirmek için girin)" : "ShipStation API Key"}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ss-secret">API Secret</Label>
          <Input
            id="ss-secret"
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder={configured ? "••••••••" : "ShipStation API Secret"}
            autoComplete="off"
          />
        </div>
      </div>
      <Button type="submit" variant="outline" disabled={pending || !apiKey || !apiSecret}>
        <KeyRound className="size-4" />
        {pending ? "Kaydediliyor…" : "Anahtarları kaydet"}
      </Button>
    </form>
  );
}
