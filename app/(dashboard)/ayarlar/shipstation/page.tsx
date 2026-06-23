import { CheckCircle2, XCircle, Package, Truck } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { getShipStationStatus } from "@/lib/db/queries/shipstation";
import { formatDateTime, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { ShipStationSyncButton } from "@/components/shipstation-sync-button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "ShipStation Entegrasyonu" };

// Senkron server action'ı bu rota üzerinden çalışır.
export const maxDuration = 60;

export default async function ShipStationAyarlarPage() {
  await requireMembership();
  const status = await getShipStationStatus();
  const configured = Boolean(
    process.env.SHIPSTATION_API_KEY && process.env.SHIPSTATION_API_SECRET,
  );
  const hasData = status.orders > 0 || status.shipments > 0;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="ShipStation Entegrasyonu"
        description="Siparişleri, gönderi maliyetlerini (postaj) ve takip bilgilerini senkronize edin"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Bağlantı Durumu
              {configured ? (
                <Badge variant="success">Yapılandırıldı</Badge>
              ) : (
                <Badge variant="secondary">Yapılandırılmadı</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {configured
                ? "ShipStation API anahtarları tanımlı. Siparişleri ve gönderileri senkronize edebilirsiniz."
                : "ShipStation API anahtarları (SHIPSTATION_API_KEY / SHIPSTATION_API_SECRET) henüz tanımlı değil."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Son Senkronizasyon</dt>
                <dd className="font-medium">
                  {formatDateTime(status.last_sync_at)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Durum</dt>
                <dd className="font-medium">{status.status}</dd>
              </div>
            </dl>

            <ShipStationSyncButton disabled={!configured} />

            {!configured && (
              <p className="text-destructive text-sm">
                Vercel ortam değişkenlerine <code>SHIPSTATION_API_KEY</code> ve{" "}
                <code>SHIPSTATION_API_SECRET</code> ekleyip yeniden dağıtın.
              </p>
            )}
          </CardContent>
        </Card>

        {hasData && (
          <div className="grid grid-cols-2 gap-4">
            <KpiCard
              label="Sipariş"
              value={formatNumber(status.orders)}
              icon={Package}
            />
            <KpiCard
              label="Gönderi"
              value={formatNumber(status.shipments)}
              icon={Truck}
            />
          </div>
        )}

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
              ShipStation → Settings → Account → API Settings bölümünden{" "}
              <strong>API Key</strong> ve <strong>API Secret</strong> alın;
              Vercel ortam değişkenlerine <code>SHIPSTATION_API_KEY</code> ve{" "}
              <code>SHIPSTATION_API_SECRET</code> olarak girin.
            </p>
            <p>
              Gönderi maliyetleri (postaj) sonraki adımda Maliyetler →{" "}
              <em>Kargo</em> kategorisine yansıtılacak.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
