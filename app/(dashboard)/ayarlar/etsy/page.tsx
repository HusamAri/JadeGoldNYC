import { ExternalLink, CheckCircle2, XCircle } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { getEtsyStatus } from "@/lib/db/queries/etsy";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EtsySyncButton } from "@/components/etsy-sync-button";
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

export default async function EtsyAyarlarPage() {
  const m = await requireMembership();
  const status = await getEtsyStatus(m.org_id);
  const connected = status.status === "connected";
  const configured = Boolean(process.env.ETSY_API_KEY);

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
              <Button asChild variant={connected ? "outline" : "default"}>
                <a href="/api/etsy/connect">
                  <ExternalLink className="size-4" />
                  {connected ? "Yeniden Bağlan" : "Etsy'ye Bağlan"}
                </a>
              </Button>
              <EtsySyncButton disabled={!connected} />
            </div>
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
                ? "Etsy API anahtarı yapılandırılmış."
                : "Etsy API anahtarı (ETSY_API_KEY) henüz tanımlı değil. Bağlantı için ortam değişkenlerini doldurun."}
            </p>
            <p>
              developers.etsy.com&apos;da uygulama kaydı açın;{" "}
              <code>ETSY_API_KEY</code> ve <code>ETSY_API_SECRET</code>{" "}
              değerlerini girin ve redirect URI&apos;yi{" "}
              <code>/api/etsy/callback</code> olarak kaydedin.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
