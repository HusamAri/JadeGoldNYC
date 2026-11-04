import { requireMembership, getUser, listMemberships } from "@/lib/auth";
import { getBrandScope, isEonActive } from "@/lib/brand";
import { getActivePlatform } from "@/lib/platform";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/queries/profile";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PageTransition } from "@/components/layout/page-transition";
import { OrgEmblemLume } from "@/components/brand/org-emblem";
import { ToneFrame } from "@/components/layout/tone-frame";
import { InkOriginListener } from "@/components/ui/ink-origin";
import { TiltListener } from "@/components/ui/tilt-listener";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Asıl kimlik kapısı (middleware hızlı yol, bu katman yetkili kontrol).
  // Üyeliği olmayan kullanıcı /kurulum sihirbazına yönlendirilir.
  const m = await requireMembership();
  const [user, memberships, brand, eon, platform] = await Promise.all([
    getUser(),
    listMemberships(),
    getBrandScope(),
    isEonActive(),
    getActivePlatform(),
  ]);
  const supabase = await createClient();
  const profile = user ? await getProfile(supabase, user.id) : null;
  const showJadeGoldNav = brand === "jade-gold";
  const showBrandBookNav = showJadeGoldNav || eon;
  // Platform-yetenek bayrakları nav'a düz obje olarak iner (client bileşen).
  const platformCapabilities: Record<string, boolean> = {
    ...platform.capabilities,
  };

  return (
    /* ToneFrame: rotanın bölüm tonunu (data-tone) basar; soft UI zemini düz,
       kartlar gölgeyle kabarır. Holo/grain/parallax/filigran katmanları
       Amuletta 2.0'da kaldırıldı — cömert boşluk ve tek malzeme. */
    <ToneFrame>
      {/* Temas ışığı köprüsü — tek passive pointerdown dinleyicisi (Button). */}
      <InkOriginListener />
      {/* Ürün eğimi köprüsü — `.jg-tilt-scene` fotoğraf yüzeyleri. */}
      <TiltListener />
      <Sidebar
        memberships={memberships}
        activeOrgId={m.org_id}
        showJadeGoldNav={showJadeGoldNav}
        showBrandBookNav={showBrandBookNav}
        platformCapabilities={platformCapabilities}
        emblem={<OrgEmblemLume className="h-[12px]" />}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          email={user?.email ?? ""}
          name={profile?.full_name ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          memberships={memberships}
          activeOrgId={m.org_id}
          showJadeGoldNav={showJadeGoldNav}
          showBrandBookNav={showBrandBookNav}
          platformCapabilities={platformCapabilities}
          emblem={<OrgEmblemLume className="h-[22px]" />}
        />
        {/* V7 sayfa aynası: 56px yan boşluk, üstte 24px (üst şerit zaten
            nefes verir), içerik en çok 1400px. */}
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 pt-5 pb-16 sm:px-8 lg:px-14 lg:pt-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </ToneFrame>
  );
}
