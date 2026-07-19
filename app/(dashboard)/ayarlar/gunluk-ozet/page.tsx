import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { DigestSettingsCard } from "@/components/settings/digest-settings-card";
import { Card, CardContent } from "@/components/ui/card";
import { isEmailConfigured } from "@/lib/email/resend";

export const metadata = { title: "Günlük özet e-posta" };

export default async function GunlukOzetAyarPage() {
  const m = await requireMembership();
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("digest_settings")
    .eq("id", m.org_id)
    .maybeSingle();

  const settings = (
    data as {
      digest_settings?: { enabled?: boolean; emails?: unknown };
    } | null
  )?.digest_settings;
  const enabled = settings?.enabled !== false;
  const emails = Array.isArray(settings?.emails)
    ? (settings.emails as unknown[])
        .filter((e): e is string => typeof e === "string")
        .map((e) => e.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Günlük özet e-posta"
        description="Mağazan için her sabah markalı HTML özet: son 24 saat, aksiyonlar, öneriler ve gidişat."
      />
      <Card>
        <CardContent className="pt-6">
          <DigestSettingsCard
            enabled={enabled}
            emails={emails}
            canManage={m.role === "owner" || m.role === "admin"}
            emailConfigured={isEmailConfigured()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
