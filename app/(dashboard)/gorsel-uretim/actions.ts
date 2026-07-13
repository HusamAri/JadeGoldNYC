"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Bir listing'in AI görsel üretimini "tamamlandı/üretildi" olarak işaretler ya
 * da işareti kaldırır. Org başına tekil (org_id, etsy_listing_id) upsert.
 */
export async function setPhotoProduced(
  listingId: number,
  done: boolean,
): Promise<{ error?: string }> {
  const m = await requireMembership();
  if (!Number.isInteger(listingId)) return { error: "Geçersiz listing." };

  const supabase = await createClient();
  const { error } = await supabase.from("photo_production").upsert(
    {
      org_id: m.org_id,
      etsy_listing_id: listingId,
      done,
      done_at: done ? new Date().toISOString() : null,
      done_by: done ? m.user_id : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id,etsy_listing_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/gorsel-uretim");
  return {};
}
