import { Store } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { getShopifyStatus } from "@/lib/db/queries/shopify";
import { isShopifyConfigured } from "@/lib/shopify/client";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShopifyConnectForm } from "./shopify-connect-form";

export const metadata = { title: "Shopify" };

export default async function ShopifyAyarlarPage() {
  const m = await requireMembership();
  const configured = isShopifyConfigured();
  const status = await getShopifyStatus(m.org_id);
  const connected = status.status === "connected";

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Shopify"
        description="Yeni marka / ikinci kanal — mağaza OAuth ile bağlanır. Ürün senkronu sonraki adım."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="size-4" />
            Bağlantı durumu
            {connected ? (
              <Badge variant="success">Bağlı</Badge>
            ) : configured ? (
              <Badge variant="secondary">Hazır · bağlı değil</Badge>
            ) : (
              <Badge variant="secondary">Yapılandırılmadı</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {configured
              ? "Shop domain girip yetkilendirmeyi başlatın (xxx.myshopify.com)."
              : "Vercel / .env.local içine SHOPIFY_API_KEY + SHOPIFY_API_SECRET ekleyin — sonra Bağlan aktif olur."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Mağaza</dt>
              <dd className="font-medium">
                {status.shop_name ?? status.shop_domain ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Son senkron</dt>
              <dd className="font-medium">
                {formatDateTime(status.last_sync_at)}
              </dd>
            </div>
          </dl>
          <ShopifyConnectForm configured={configured} />
          <p className="text-muted-foreground text-xs">
            Partner Dashboard&apos;da app oluşturup redirect URI&apos;yi{" "}
            <code className="mx-1">/api/shopify/callback</code> yapın.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
