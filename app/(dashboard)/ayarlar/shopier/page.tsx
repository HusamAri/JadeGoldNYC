import { ShoppingCart, CircleCheck, XCircle } from "lucide-react";

import { requireMembership, isManager } from "@/lib/auth";
import { getShopierStatus } from "@/lib/db/queries/shopier";
import { formatDateTime, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { ShopierCredentialsForm } from "@/components/shopier-credentials-form";
import { ShopierSyncButton } from "@/components/shopier-sync-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Shopier Entegrasyonu" };

// Senkron server action'ı bu rota üzerinden çalışır.
export const maxDuration = 60;

export default async function ShopierAyarlarPage() {
  const m = await requireMembership();
  const status = await getShopierStatus(m.org_id);
  const manager = isManager(m.role);
  const configured = status.status !== "disconnected";
  const healthy = status.status === "connected";

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Shopier Entegrasyonu"
        description="Shopier siparişlerini panele senkronize edin — Türkiye kanalının satışları Etsy'nin yanına iner"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Bağlantı Durumu
              {healthy ? (
                <Badge variant="success">Bağlı</Badge>
              ) : configured ? (
                <Badge variant="warning">Hata</Badge>
              ) : (
                <Badge variant="secondary">Bağlı değil</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {healthy
                ? `Shopier PAT doğrulandı${status.shop_name ? ` — ${status.shop_name}` : ""}. Siparişleri senkronize edebilirsiniz.`
                : configured
                  ? `Anahtar kayıtlı ama son bağlantı testi/senkron hata verdi${status.sync_error ? `: ${status.sync_error}` : "."}`
                  : "Shopier kişisel erişim anahtarı (PAT) henüz tanımlı değil. Resmi Shopier API'siyle (api.shopier.com) siparişler otomatik iner."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Son Senkronizasyon</dt>
                <dd className="font-medium">
                  {status.last_sync_at
                    ? formatDateTime(status.last_sync_at)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Paneldeki Shopier Siparişi</dt>
                <dd className="flex items-center gap-1.5 font-medium">
                  {status.orders > 0 ? (
                    <CircleCheck className="size-4 text-emerald-500" />
                  ) : (
                    <XCircle className="text-muted-foreground size-4" />
                  )}
                  {formatNumber(status.orders)} sipariş
                </dd>
              </div>
            </dl>

            {manager ? (
              <ShopierCredentialsForm configured={configured} />
            ) : (
              <p className="text-muted-foreground text-sm">
                Anahtar girmek için sahip (owner) veya yönetici (admin) yetkisi
                gerekir.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="size-4" />
              Sipariş Senkronu
            </CardTitle>
            <CardDescription>
              İlk senkron tüm geçmişi indirir; sonrakiler son senkrondan (7 gün
              örtüşme payıyla) devam eder. Siparişler Satışlar&apos;a
              &quot;shopier&quot; kaynağıyla yazılır; TRY tutarlar USD
              toplamlarına KARIŞTIRILMAZ (kur satırda taşınır).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ShopierSyncButton disabled={!configured} />
            <p className="text-muted-foreground text-xs">
              Kapsam (bilerek dar başlangıç): yalnız siparişler + kalemleri.
              Ürün kataloğu, iade ve webhook senkronu bu iskelete sonraki
              adımlarda eklenir — sipariş verisi değer ürettikçe genişletilir.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
