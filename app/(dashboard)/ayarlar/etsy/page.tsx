import { ExternalLink, CheckCircle2, XCircle } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { getEtsyStatus } from "@/lib/db/queries/etsy";
import { getLastSyncSummary } from "@/lib/etsy/sync";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EtsySyncButton } from "@/components/etsy-sync-button";
import {
  ApiCredentialGuide,
  ETSY_WRITE_GUIDE,
} from "@/components/setup/api-credential-guide";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Etsy Entegrasyonu" };

// Senkronizasyon server action'ı bu rota üzerinden çalışır; Etsy API'leri
// (N+1 olmadan bile) zaman alabildiğinden fonksiyon süresini uzat.
export const maxDuration = 60;

export default async function EtsyAyarlarPage() {
  const m = await requireMembership();
  const [status, summary] = await Promise.all([
    getEtsyStatus(m.org_id),
    getLastSyncSummary(m.org_id),
  ]);
  const connected = status.status === "connected";
  // Etsy v3 her API çağrısında keystring + shared secret ister; ikisi de yoksa
  // "yapılandırılmış" sayma (yoksa Bağlan butonu config hatasına çarpıp döner).
  const configured = Boolean(
    process.env.ETSY_API_KEY && process.env.ETSY_API_SECRET,
  );

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Etsy Entegrasyonu"
        description="Mağazanızı bağlayın ve siparişleri otomatik senkronize edin"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Bağlantı Durumu
              {connected ? (
                <Badge variant="success">Bağlı</Badge>
              ) : (
                <Badge variant="secondary">Bağlı değil</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {connected
                ? "Etsy mağazanız bağlı. Siparişleri ve ürünleri senkronize edebilirsiniz."
                : "Etsy mağazanızı bağlamak için yetkilendirme akışını başlatın."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Mağaza ID</dt>
                <dd className="font-medium">{status.shop_id ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Son Senkronizasyon</dt>
                <dd className="font-medium">
                  {formatDateTime(status.last_sync_at)}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2">
              {configured ? (
                <Button asChild variant={connected ? "outline" : "default"}>
                  <a href="/api/etsy/connect">
                    <ExternalLink className="size-4" />
                    {connected ? "Yeniden Bağlan" : "Etsy'ye Bağlan"}
                  </a>
                </Button>
              ) : (
                <Button disabled variant="default">
                  <ExternalLink className="size-4" />
                  {"Etsy'ye Bağlan"}
                </Button>
              )}
              <EtsySyncButton disabled={!connected} initialSummary={summary} />
            </div>
            {!configured && (
              <div className="space-y-2">
                <p className="text-destructive text-sm">
                  Bağlanmadan önce Etsy API anahtarlarını eklemen gerekir.
                </p>
                <ApiCredentialGuide items={[ETSY_WRITE_GUIDE]} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {configured ? (
                <CheckCircle2 className="text-primary size-4" />
              ) : (
                <XCircle className="text-muted-foreground size-4" />
              )}
              Yapılandırma
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2 text-sm">
            <p>
              {configured
                ? "Etsy API anahtarı ve shared secret yapılandırılmış."
                : "Anahtarlar henüz yok. Yukarıdaki adım adım rehberi izle; tam metin: docs/seo-api-kurulum.md bölüm 3."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
