import { requireMembership, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getEtsyStatus } from "@/lib/db/queries/etsy";
import { getProfile } from "@/lib/db/queries/profile";
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
  const { data: org } = await supabase
    .from("organizations")
    .select("name, default_currency")
    .eq("id", m.org_id)
    .maybeSingle();
  const status = await getEtsyStatus(m.org_id);
  const profile = user ? await getProfile(supabase, user.id) : null;
  const shipStationConfigured = Boolean(
    process.env.SHIPSTATION_API_KEY && process.env.SHIPSTATION_API_SECRET,
  );

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
      profileName={profile?.full_name ?? null}
      profileEmail={user?.email ?? null}
      avatarUrl={profile?.avatar_url ?? null}
    />
  );
}
