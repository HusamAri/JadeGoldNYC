import { Pin } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { getPinterestStatus } from "@/lib/db/queries/pinterest";
import { isPinterestConfigured, pinterestScopes } from "@/lib/pinterest/client";
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
import { PinterestConnectForm } from "./pinterest-connect-form";

export const metadata = { title: "Pinterest" };

const HATA: Record<string, string> = {
  config: "Kimlik bilgileri eksik (PINTEREST_APP_ID / PINTEREST_APP_SECRET).",
  forbidden: "Bu işlem için yönetici yetkisi gerekiyor.",
  denied: "Yetkilendirme Pinterest tarafında reddedildi.",
  params: "Pinterest eksik parametre döndürdü — tekrar deneyin.",
  state: "Oturum doğrulaması geçersiz ya da tüketilmiş — tekrar deneyin.",
  token: "Token alınamadı. Redirect URI'nin Pinterest app'iyle birebir aynı olduğunu doğrulayın.",
  save: "Bağlantı kaydedilemedi.",
};

/** ISO tarihe kaç gün kaldı (geçmişse negatif). Bilinmiyorsa null.
 *  Bileşen gövdesi dışında: render sırasında `Date.now()` çağrısı saflık
 *  kuralını ihlal ediyor (react-hooks/purity). */
function gunKaldi(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.round((t - Date.now()) / 86_400_000);
}

export default async function PinterestAyarlarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  const m = await requireMembership();
  const sp = await searchParams;
  const configured = isPinterestConfigured();
  const status = await getPinterestStatus(m.org_id);
  const connected = status.status === "connected";
  const expired = status.status === "expired";

  // Yenileme izni bitişi yaklaşıyorsa uyar: bittiğinde SESSİZ yenileme
  // imkânsızdır, kullanıcı yeniden yetkilendirmek zorunda kalır.
  const refreshGunKaldi = gunKaldi(status.refresh_expires_at);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Pinterest"
        description="Pinterest hesabı OAuth ile bağlanır. Bağlandıktan sonra panelden pin oluşturma ve pano/analiz okuma açılır."
      />

      {sp.error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {HATA[sp.error] ?? "Bağlantı sırasında bir hata oluştu."}
        </p>
      )}
      {sp.connected && !sp.error && (
        <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          Pinterest bağlandı.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Pin className="size-4" />
            Bağlantı durumu
            {connected ? (
              <Badge variant="success">Bağlı</Badge>
            ) : expired ? (
              <Badge variant="destructive">Süresi doldu</Badge>
            ) : configured ? (
              <Badge variant="secondary">Hazır · bağlı değil</Badge>
            ) : (
              <Badge variant="secondary">Yapılandırılmadı</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {configured
              ? "Yetkilendirmeyi başlatın — Pinterest hesabınızı seçip izin vereceksiniz."
              : "Vercel / .env.local içine PINTEREST_APP_ID + PINTEREST_APP_SECRET ekleyin — sonra Bağlan aktif olur."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Hesap</dt>
              <dd className="font-medium">
                {status.username ? `@${status.username}` : "—"}
                {status.account_type ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {status.account_type.toLowerCase()}
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Son senkron</dt>
              <dd className="font-medium">
                {formatDateTime(status.last_sync_at)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Erişim izni bitişi</dt>
              <dd className="font-medium">
                {formatDateTime(status.expires_at)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Yenileme izni bitişi</dt>
              <dd className="font-medium">
                {formatDateTime(status.refresh_expires_at)}
                {refreshGunKaldi != null && refreshGunKaldi <= 30 && (
                  <span className="text-destructive">
                    {" "}
                    · {refreshGunKaldi} gün
                  </span>
                )}
              </dd>
            </div>
          </dl>

          {expired && (
            <p className="text-destructive text-xs">
              Yenileme izni sona erdi; token sessizce tazelenemez. Yeniden
              bağlanmanız gerekiyor.
            </p>
          )}

          <PinterestConnectForm
            configured={configured}
            connected={connected}
          />

          <div className="text-muted-foreground space-y-1 text-xs">
            <p>
              Pinterest Developer konsolunda app oluşturup redirect URI&apos;yi{" "}
              <code className="mx-1">/api/pinterest/callback</code> yapın —{" "}
              <strong>kalıcı domain</strong> kullanın, hash&apos;li deployment
              URL&apos;i deployment silinince akışı kırar.
            </p>
            <p>
              İstenen kapsam:{" "}
              <code className="break-all">{pinterestScopes()}</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
