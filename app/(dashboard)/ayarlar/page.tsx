import { requireMembership, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEtsyStatus } from "@/lib/db/queries/etsy";
import { getShopierStatus } from "@/lib/db/queries/shopier";
import { getShopifyStatus } from "@/lib/db/queries/shopify";
import { getPinterestStatus } from "@/lib/db/queries/pinterest";
import { getProfile } from "@/lib/db/queries/profile";
import { ShipStationClient } from "@/lib/shipstation/client";
import { formatDateTime } from "@/lib/format";
import { SettingsHub } from "@/components/settings/settings-hub";

export const metadata = { title: "Ayarlar" };

/**
 * Ayarlar hub — içerik arttığı için düz kart listesi yerine gruplu
 * glass + neumorph + neon nabız yüzeyi (SettingsHub).
 */
export default async function AyarlarPage() {
  const m = await requireMembership();
  const user = await getUser();
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name, default_currency")
    .eq("id", m.org_id)
    .maybeSingle();
  const [status, shopier, shopify, pinterest, profile, shipStationConfigured] =
    await Promise.all([
    getEtsyStatus(m.org_id),
    getShopierStatus(m.org_id),
    getShopifyStatus(m.org_id),
    getPinterestStatus(m.org_id),
    user ? getProfile(supabase, user.id) : Promise.resolve(null),
    // Org'a özel: global env anahtarı başka şirkete ait olabilir —
    // hub neon'u yalnız BU org için kimlik bilgisi varken yanar.
    ShipStationClient.isConfiguredForOrg(admin, m.org_id),
  ]);

  const orgName =
    (org as { name?: string } | null)?.name ?? "Organizasyon";
  const currency =
    (org as { default_currency?: string } | null)?.default_currency ?? "USD";

  return (
    <SettingsHub
      orgName={orgName}
      currency={currency}
      role={m.role}
      etsyConnected={status.status === "connected"}
      etsyLastSync={
        status.last_sync_at ? formatDateTime(status.last_sync_at) : null
      }
      shipStationConfigured={shipStationConfigured}
      shopierConnected={shopier.status === "connected"}
      shopifyConnected={shopify.status === "connected"}
      pinterestConnected={pinterest.status === "connected"}
      profileName={profile?.full_name ?? null}
      profileEmail={user?.email ?? null}
      avatarUrl={profile?.avatar_url ?? null}
    />
  );
}
