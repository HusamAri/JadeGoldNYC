"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import { saveShopierPat } from "@/app/(dashboard)/ayarlar/shopier/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Şirkete özel Shopier PAT formu. Sır geri OKUNMAZ (service-role-only tablo);
 * form her zaman boş başlar, kaydetmek üzerine yazar ve bağlantıyı canlı
 * test eder (GET /shop/owner).
 */
export function ShopierCredentialsForm({ configured }: { configured: boolean }) {
  const [pat, setPat] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveShopierPat(pat);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.shopName
          ? `Shopier bağlandı: ${res.shopName}`
          : "Shopier anahtarı kaydedildi ve doğrulandı",
      );
      setPat("");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="shopier-pat">Kişisel erişim anahtarı (PAT)</Label>
        <Input
          id="shopier-pat"
          type="password"
          value={pat}
          onChange={(e) => setPat(e.target.value)}
          placeholder={
            configured
              ? "•••••••• (kayıtlı — değiştirmek için yenisini girin)"
              : "Shopier Developer Portal'dan alınan PAT"
          }
          autoComplete="off"
        />
        <p className="text-muted-foreground text-xs">
          Shopier hesabı → Geliştirici modu → kişisel erişim anahtarı.
          Kaydederken bağlantı canlı test edilir; anahtar yalnız sunucuda
          saklanır, panelden geri okunamaz.
        </p>
      </div>
      <Button type="submit" variant="outline" disabled={pending || !pat}>
        <KeyRound className="size-4" />
        {pending ? "Doğrulanıyor…" : "Kaydet ve bağlantıyı test et"}
      </Button>
    </form>
  );
}
