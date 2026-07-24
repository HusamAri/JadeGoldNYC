"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { clampDiscountPct } from "@/lib/discount";

export interface BundleActionResult {
  ok?: boolean;
  error?: string;
}

export interface CreateBundleInput {
  productAId: string;
  productBId: string;
  pct: number;
  startAt?: string | null;
  endAt?: string | null;
  minOrderCents?: number | null;
  note?: string | null;
}

/**
 * İki ürünü paket olarak eşler (panel-içi indirim planı). Multi-tenant kilidi:
 * her iki ürün de çağıranın org'unda olmalı. Aynı iki ürün için tek paket
 * (unique) ve ürün kendisiyle eşlenemez (DB check + burada da doğrula).
 */
export async function createDiscountBundle(
  input: CreateBundleInput,
): Promise<BundleActionResult> {
  const m = await requireMembership();
  const a = input.productAId?.trim();
  const b = input.productBId?.trim();
  if (!a || !b) return { error: "İki ürün de seçilmeli." };
  if (a === b) return { error: "Bir ürün kendisiyle eşlenemez." };

  const pct = clampDiscountPct(input.pct);
  if (pct <= 0) return { error: "İndirim %1–90 arası olmalı." };

  const startAt = input.startAt?.trim() || null;
  const endAt = input.endAt?.trim() || null;
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  if (startAt && !isoDate.test(startAt))
    return { error: "Başlangıç tarihi geçersiz." };
  if (endAt && !isoDate.test(endAt)) return { error: "Bitiş tarihi geçersiz." };
  if (startAt && endAt && endAt < startAt)
    return { error: "Bitiş tarihi başlangıçtan önce olamaz." };
  const minOrderCents =
    input.minOrderCents != null && input.minOrderCents > 0
      ? Math.round(input.minOrderCents)
      : null;

  const admin = createAdminClient();
  // Sahiplik: iki ürün de bu org'da mı?
  const { data: owned, error: ownErr } = await admin
    .from("products")
    .select("id")
    .eq("org_id", m.org_id)
    .in("id", [a, b]);
  if (ownErr) return { error: ownErr.message };
  if ((owned ?? []).length !== 2)
    return { error: "Ürünler bu mağazaya ait değil." };

  // Çift kaydı önle: (a,b) ya da (b,a) zaten varsa reddet.
  const { data: existing, error: exErr } = await admin
    .from("discount_bundles")
    .select("id, product_a_id, product_b_id")
    .eq("org_id", m.org_id)
    .or(
      `and(product_a_id.eq.${a},product_b_id.eq.${b}),and(product_a_id.eq.${b},product_b_id.eq.${a})`,
    );
  if (exErr) return { error: exErr.message };
  if ((existing ?? []).length > 0)
    return { error: "Bu iki ürün için zaten bir paket var." };

  const { error } = await admin.from("discount_bundles").insert({
    org_id: m.org_id,
    product_a_id: a,
    product_b_id: b,
    discount_pct: pct,
    start_at: startAt,
    end_at: endAt,
    min_order_cents: minOrderCents,
    note: input.note?.trim() || null,
    created_by: m.user_id,
  });
  if (error) return { error: error.message };

  revalidatePath("/indirimler");
  return { ok: true };
}

/** Paketi siler (org kilidi). */
export async function deleteDiscountBundle(
  id: string,
): Promise<BundleActionResult> {
  const m = await requireMembership();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("discount_bundles")
    .delete()
    .eq("id", id)
    .eq("org_id", m.org_id)
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "Paket bulunamadı." };
  revalidatePath("/indirimler");
  return { ok: true };
}
