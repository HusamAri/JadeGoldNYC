import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/queries/profile";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Profil" };

export default async function ProfilPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const profile = await getProfile(supabase, user.id);

  return (
    <div className="max-w-xl">
      <PageHeader title="Profil" description="Hesabınızı kişiselleştirin" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hesap Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            fullName={profile?.full_name ?? ""}
            avatarUrl={profile?.avatar_url ?? null}
            email={user.email ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
