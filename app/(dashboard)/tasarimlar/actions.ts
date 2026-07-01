"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";
import {
  designFormSchema,
  type DesignFormValues,
} from "@/lib/validations/design";

/**
 * Ürünün ağırlığını (gram) kaydeder — altın maliyet motorunun güvenilir
 * girdisi. Boş/geçersiz değer ağırlığı temizler (regex yedeğine döner).
 */
export async function updateProductWeight(
  productId: string,
  grams: number | null,
): Promise<{ error?: string }> {
  await requireMembership();
  if (grams != null && (!Number.isFinite(grams) || grams <= 0)) {
    return { error: "Geçerli bir ağırlık girin." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ weight_grams: grams })
    .eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/tasarimlar");
  return {};
}

export interface DesignActionResult {
  ok?: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function parseTags(s: string): string[] | null {
  const tags = s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return tags.length ? tags : null;
}

function toDesignRow(v: DesignFormValues) {
  return {
    name: v.name,
    description: v.description || null,
    status: v.status,
    product_id: v.product_id || null,
    tags: parseTags(v.tags),
    version: v.version.trim() ? parseInt(v.version, 10) : 1,
    // storage_bucket/storage_path/thumbnail_path bilerek dokunulmuyor —
    // Storage altyapısı henüz yok (bkz. designs migrasyonu 0007).
  };
}

export async function createDesign(
  values: DesignFormValues,
): Promise<DesignActionResult> {
  const parsed = designFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Form geçersiz.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const m = await requireMembership();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("designs")
    .insert({ ...toDesignRow(parsed.data), org_id: m.org_id, created_by: m.user_id })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/tasarimlar");
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateDesign(
  id: string,
  values: DesignFormValues,
): Promise<DesignActionResult> {
  const parsed = designFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Form geçersiz.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("designs")
    .update(toDesignRow(parsed.data))
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/tasarimlar");
  return { ok: true, id };
}

export async function deleteDesign(id: string): Promise<{ error?: string }> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("designs").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/tasarimlar");
  return {};
}
