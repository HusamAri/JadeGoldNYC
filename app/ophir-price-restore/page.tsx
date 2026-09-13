import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import OphirRestoreProgress from "./progress";

export const dynamic = "force-dynamic";
export const metadata = { title: "Restore Ophir prices" };

export default async function OphirPriceRestorePage() {
  const member = await requireMembership();
  if (!isManager(member.role)) return <main className="mx-auto max-w-3xl p-8"><p>{MANAGER_ONLY_ERROR}</p></main>;
  const client = await createClient();
  const { data, error } = await client.from("organizations").select("slug").eq("id", member.org_id).maybeSingle();
  if (error || data?.slug !== "ophir-gold-usa") return <main className="mx-auto max-w-3xl p-8"><p>Select Ophir Gold USA before opening this restoration.</p></main>;
  return <OphirRestoreProgress />;
}
