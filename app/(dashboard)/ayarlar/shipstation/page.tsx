import {
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  Boxes,
  ShoppingBag,
  Users,
  MapPin,
} from "lucide-react";

import { requireMembership, isManager } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ShipStationClient } from "@/lib/shipstation/client";
import { getShipStationStatus } from "@/lib/db/queries/shipstation";
import { formatDateTime, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { ShipStationSyncButton } from "@/components/shipstation-sync-button";
import { ShipStationCredentialsForm } from "@/components/shipstation-credentials-form";
import { SectionGuide } from "@/components/section-guide";
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
  const m = await requireMembership();
  const admin = createAdminClient();
  const [status, configured] = await Promise.all([
    getShipStationStatus(),
    // Platform: org'a özel anahtar VEYA (geriye dönük) platform env'i.
    ShipStationClient.isConfiguredForOrg(admin, m.org_id),
  ]);
  const manager = isManager(m.role);
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

            {manager && <ShipStationCredentialsForm configured={configured} />}

            {!configured && !manager && (
              <p className="text-destructive text-sm">
                ShipStation anahtarlarını şirket sahibi/yöneticisi bu sayfadan
                girebilir.
              </p>
            )}
          </CardContent>
        </Card>

        {hasData && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
            <KpiCard
              label="Ürün"
              value={formatNumber(status.products)}
              icon={Boxes}
            />
            <KpiCard
              label="Kalem (satılan)"
              value={formatNumber(status.items)}
              icon={ShoppingBag}
            />
            <KpiCard
              label="Müşteri"
              value={formatNumber(status.customers)}
              icon={Users}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="text-primary size-4" />
              Etsy&apos;ye Kargo Takibi (Zamanında Kargo)
            </CardTitle>
            <CardDescription>
              Takip numaralarını Etsy&apos;ye ileterek &quot;Zamanında kargo&quot;
              standardını güvenceye alın.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="bg-muted/40 flex items-center gap-3 rounded-xl border px-4 py-3">
              <MapPin className="text-primary size-5 shrink-0" />
              <div>
                <div className="text-foreground font-medium tabular-nums">
                  {formatNumber(status.shipmentsWithTracking)} gönderide takip
                  numarası var
                </div>
                <div className="text-muted-foreground text-xs">
                  Senkronize edilen gönderiler içinde — Etsy&apos;ye aktarılmaya
                  hazır veri.
                </div>
              </div>
            </div>

            <div className="text-muted-foreground space-y-2 leading-relaxed">
              <p>
                <b>Önemli:</b> Etsy, Ekim 2024&apos;ten sonra takip bilgisini API
                ile Etsy&apos;ye yazma iznini yalnız <b>onaylı kargo
                partnerlerine</b> (ABD&apos;de ShipStation ve GoShippo)
                kısıtladı. Bu panel bir onaylı partner olmadığından takibi{" "}
                <b>doğrudan API ile Etsy&apos;ye gönderemez</b> (çağrı 403 döner
                ya da sessizce boş kalır).
              </p>
              <p>
                İyi haber: <b>ShipStation zaten onaylı partner.</b> Doğru kurulum,
                Etsy mağazanı ShipStation içinde bir <b>Store</b> (satış kanalı)
                olarak bağlamaktır; ShipStation kargolamada takip numarasını{" "}
                <b>otomatik Etsy&apos;ye geri yazar</b> ve &quot;Zamanında
                kargo&quot; metriğini besler. Panel de bu gönderileri (yukarıdaki
                sayı) senkronize edip maliyet ve teslim takibini gösterir.
              </p>
            </div>

            <SectionGuide title="Etsy'yi ShipStation'a Store olarak bağla (adımlar)">
              <ol>
                <li>
                  ShipStation → <b>Settings → Selling Channels → Store Setup</b>{" "}
                  → <b>Connect a Store or Marketplace</b> → <b>Etsy</b> seç.
                </li>
                <li>
                  Açılan Etsy oturumunda mağazana izin ver (bu, API anahtarı
                  bağlantısından ayrıdır; asıl takip geri-yazımı buradan çalışır).
                </li>
                <li>
                  Mağaza ayarlarında <b>Mark as Shipped / Notify Marketplace</b>{" "}
                  (kargolayınca Etsy&apos;yi bilgilendir) seçeneğinin{" "}
                  <b>açık</b> olduğundan emin ol.
                </li>
                <li>
                  Bundan sonra ShipStation&apos;da oluşturduğun her etiket, takip
                  numarasını otomatik Etsy siparişine işler ve alıcıya bildirir.
                </li>
                <li>
                  Panelde <b>&quot;ShipStation&apos;ı Senkronize Et&quot;</b>{" "}
                  butonu bu takip/maliyet verisini panele çeker (raporlama +
                  teslim takibi için).
                </li>
              </ol>
            </SectionGuide>
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
              ShipStation → Settings → Account → API Settings bölümünden{" "}
              <strong>API Key</strong> ve <strong>API Secret</strong> alın;
              yukarıdaki forma girip kaydedin. Anahtarlar şirkete özeldir ve
              yalnız sunucu tarafında saklanır — panel üyeleri okuyamaz.
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
