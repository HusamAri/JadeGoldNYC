import Link from "next/link";
import {
  Store,
  Plug,
  Truck,
  UserRound,
  UsersRound,
  Scale,
  Sparkles,
  Rocket,
  ChevronRight,
  ShoppingBag,
  Bot,
} from "lucide-react";

import { requireMembership, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getEtsyStatus } from "@/lib/db/queries/etsy";
import { getShopifyStatus } from "@/lib/db/queries/shopify";
import { getProfile } from "@/lib/db/queries/profile";
import { isAIConfigured } from "@/lib/ai";
import { isShopifyConfigured } from "@/lib/shopify/client";
import { PageHeader } from "@/components/page-header";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Ayarlar" };

export default async function AyarlarPage() {
  const m = await requireMembership();
  const user = await getUser();
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name, default_currency")
    .eq("id", m.org_id)
    .maybeSingle();
  const status = await getEtsyStatus(m.org_id);
  const shopifyStatus = await getShopifyStatus(m.org_id);
  const profile = user ? await getProfile(supabase, user.id) : null;
  const shipStationConfigured = Boolean(
    process.env.SHIPSTATION_API_KEY && process.env.SHIPSTATION_API_SECRET,
  );
  const shopifyConfigured = isShopifyConfigured();
  const aiConfigured = isAIConfigured();
  const geminiReady = Boolean(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
  );

  return (
    <div className="max-w-2xl">
      <PageHeader title="Ayarlar" description="Organizasyon ve entegrasyonlar" />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store aria-hidden className="size-4" />
              Organizasyon
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Ad</p>
              <p className="font-medium">
                {(org as { name?: string } | null)?.name ?? "Jade Gold NYC"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Para Birimi</p>
              <p className="font-medium">
                {(org as { default_currency?: string } | null)
                  ?.default_currency ?? "USD"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Rolünüz</p>
              <p className="font-medium capitalize">{m.role}</p>
            </div>
          </CardContent>
        </Card>

        <Link href="/ayarlar/ekip" className="block">
          <Card className="hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <UsersRound aria-hidden className="size-4" />
                  Ekip
                </span>
                <ChevronRight aria-hidden className="text-muted-foreground size-4" />
              </CardTitle>
              <CardDescription>
                Üyeleri yönet, roller ve davetler
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/ayarlar/etsy" className="block">
          <Card className="hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Plug aria-hidden className="size-4" />
                  Etsy Entegrasyonu
                </span>
                <span className="flex items-center gap-2">
                  {status.status === "connected" ? (
                    <Badge variant="success">Bağlı</Badge>
                  ) : (
                    <Badge variant="secondary">Bağlı değil</Badge>
                  )}
                  <ChevronRight aria-hidden className="text-muted-foreground size-4" />
                </span>
              </CardTitle>
              <CardDescription>
                Mağaza bağlantısı, sipariş ve ürün senkronizasyonu
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/ayarlar/shopify" className="block">
          <Card className="hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <ShoppingBag aria-hidden className="size-4" />
                  Shopify
                </span>
                <span className="flex items-center gap-2">
                  {shopifyStatus.status === "connected" ? (
                    <Badge variant="success">Bağlı</Badge>
                  ) : shopifyConfigured ? (
                    <Badge variant="secondary">Hazır</Badge>
                  ) : (
                    <Badge variant="secondary">Yapılandırılmadı</Badge>
                  )}
                  <ChevronRight aria-hidden className="text-muted-foreground size-4" />
                </span>
              </CardTitle>
              <CardDescription>
                Yeni marka / ikinci kanal — OAuth bağlantı hazırlığı
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/ayarlar/shipstation" className="block">
          <Card className="hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Truck aria-hidden className="size-4" />
                  ShipStation Entegrasyonu
                </span>
                <span className="flex items-center gap-2">
                  {shipStationConfigured ? (
                    <Badge variant="success">Yapılandırıldı</Badge>
                  ) : (
                    <Badge variant="secondary">Yapılandırılmadı</Badge>
                  )}
                  <ChevronRight aria-hidden className="text-muted-foreground size-4" />
                </span>
              </CardTitle>
              <CardDescription>
                Sipariş, gönderi maliyeti (postaj) ve takip senkronizasyonu
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Bot aria-hidden className="size-4" />
                AI / SEO motoru
              </span>
              {aiConfigured ? (
                <Badge variant="success">
                  {geminiReady ? "Gemini hazır" : "Gateway hazır"}
                </Badge>
              ) : (
                <Badge variant="secondary">İnert</Badge>
              )}
            </CardTitle>
            <CardDescription>
              SEO Yardımcısı kural tabanlı (anahtarsız). Yorum AI + Anahtar Kelime
              AI genişletme:{" "}
              {aiConfigured
                ? geminiReady
                  ? "GOOGLE_GENERATIVE_AI_API_KEY aktif."
                  : "AI Gateway aktif (Gemini yok)."
                : "GOOGLE_GENERATIVE_AI_API_KEY veya AI_GATEWAY_API_KEY ekleyin — yoksa özellikler zarifçe kapanır."}{" "}
              Ayrıntı: docs/ai-gateway.md
            </CardDescription>
          </CardHeader>
        </Card>

        <Link href="/ayarlar/altin" className="block">
          <Card className="hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Scale aria-hidden className="size-4" />
                  Altin Maliyet Ayarlari
                </span>
                <ChevronRight aria-hidden className="text-muted-foreground size-4" />
              </CardTitle>
              <CardDescription>
                Tedarikciden alim fiyatlari, iscilik oranlari ve altin fiyat kaynagi
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/ayarlar/etsy-guncellemeleri" className="block">
          <Card className="hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Sparkles aria-hidden className="size-4" />
                  Etsy Güncellemeleri
                </span>
                <ChevronRight aria-hidden className="text-muted-foreground size-4" />
              </CardTitle>
              <CardDescription>
                Platform güncellemelerinden mağazanız için elenmiş öneriler
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/ayarlar/buyume-stratejisi" className="block">
          <Card className="hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Rocket aria-hidden className="size-4" />
                  Büyüme Stratejisi
                </span>
                <ChevronRight aria-hidden className="text-muted-foreground size-4" />
              </CardTitle>
              <CardDescription>
                Etsy SEO + yapay zekâ arama (AEO) görünürlüğü için 90 günlük plan
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/ayarlar/profil" className="block">
          <Card className="hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <UserRound aria-hidden className="size-4" />
                  Profil
                </span>
                <ChevronRight aria-hidden className="text-muted-foreground size-4" />
              </CardTitle>
              <CardDescription>
                Ad ve profil fotoğrafını düzenle
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <UserAvatar
                src={profile?.avatar_url}
                name={profile?.full_name}
                email={user?.email}
                className="size-12"
              />
              <div className="text-sm">
                <p className="font-medium">
                  {profile?.full_name || "İsim eklenmedi"}
                </p>
                <p className="text-muted-foreground">{user?.email ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
