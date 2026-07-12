import { requireMembership, getUser, listMemberships } from "@/lib/auth";
import { getBrandScope } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/queries/profile";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PageTransition } from "@/components/layout/page-transition";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Asıl kimlik kapısı (middleware hızlı yol, bu katman yetkili kontrol).
  // Üyeliği olmayan kullanıcı /kurulum sihirbazına yönlendirilir.
  const m = await requireMembership();
  const [user, memberships, brand] = await Promise.all([
    getUser(),
    listMemberships(),
    getBrandScope(),
  ]);
  const supabase = await createClient();
  const profile = user ? await getProfile(supabase, user.id) : null;
  const showJadeGoldNav = brand === "jade-gold";

  return (
    <div className="relative flex min-h-svh">
      {/* Hareketli holografik gradient — TÜM markalarda tek ambiyans arka plan.
          Çok yavaş kayan holo blob'lar (renkler token'dan: platform pastel holo,
          JG jade+altın). Statik desen/doku/toz KALDIRILDI; zemin düz mat +
          süzülen holo. Cam boardlar bunun üstünde durunca altı buzlanır. */}
      <div aria-hidden className="holo-drift" />
      <Sidebar
        memberships={memberships}
        activeOrgId={m.org_id}
        showJadeGoldNav={showJadeGoldNav}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          email={user?.email ?? ""}
          name={profile?.full_name ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          memberships={memberships}
          activeOrgId={m.org_id}
          showJadeGoldNav={showJadeGoldNav}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
