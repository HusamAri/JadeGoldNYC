import Link from "next/link";
import { Store, Plug, UserRound, ChevronRight } from "lucide-react";

import { requireMembership, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getEtsyStatus } from "@/lib/db/queries/etsy";
import { getProfile } from "@/lib/db/queries/profile";
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
  const profile = user ? await getProfile(supabase, user.id) : null;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Ayarlar" description="Organizasyon ve entegrasyonlar" />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="size-4" />
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

        <Link href="/ayarlar/etsy" className="block">
          <Card className="hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Plug className="size-4" />
                  Etsy Entegrasyonu
                </span>
                <span className="flex items-center gap-2">
                  {status.status === "connected" ? (
                    <Badge variant="success">Bağlı</Badge>
                  ) : (
                    <Badge variant="secondary">Bağlı değil</Badge>
                  )}
                  <ChevronRight className="text-muted-foreground size-4" />
                </span>
              </CardTitle>
              <CardDescription>
                Mağaza bağlantısı, sipariş ve ürün senkronizasyonu
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/ayarlar/profil" className="block">
          <Card className="transition-shadow hover:shadow-[var(--shadow-hover)]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <UserRound className="size-4" />
                  Profil
                </span>
                <ChevronRight className="text-muted-foreground size-4" />
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
