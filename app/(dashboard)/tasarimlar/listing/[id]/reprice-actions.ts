"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { parseMoneyToCents } from "@/lib/money";
import type {
  RepriceAnchor,
  RepriceConfidence,
  RepriceMode,
  RepriceOutcome,
} from "@/lib/etsy/reprice";

/**
 * Reprice kural kartının server action'ları (components/listing/
 * reprice-rule-card.tsx bunları çağırır). Yazmalar admin client ile yapılır
 * ve HER sorgu org_id ile kapsanır (multi-tenant kilidi — bkz. actions.ts).
 * Kural create/update audit trigger'ı (0093) ile şirket hafızasına düşer.
 */

const MODES: RepriceMode[] = ["kapali", "oneri", "otomatik"];
const ANCHORS: RepriceAnchor[] = ["ortalama", "medyan"];
const CONFIDENCES: RepriceConfidence[] = ["dusuk", "orta", "yuksek"];

export interface RepriceRuleView {
  id: string;
  mode: RepriceMode;
  anchor: RepriceAnchor;
  trigger_over_cents: number;
  target_over_cents: number;
  floor_cents: number | null;
  floor_melt_mult: number;
  max_change_pct: number;
  min_confidence: RepriceConfidence;
  cooldown_hours: number;
  last_applied_at: string | null;
}

export interface RepriceLogView {
  id: string;
  old_price_cents: number | null;
  new_price_cents: number | null;
  anchor_cents: number | null;
  outcome: RepriceOutcome;
  reason: string | null;
  created_at: string;
}

export interface RepriceCardData {
  rule: RepriceRuleView | null;
  logs: RepriceLogView[];
  /** Etsy'ye yazma izni (listings_w) — 'otomatik' modun gerçekten yazıp yazamayacağı. */
  writeEnabled: boolean;
}

/** Kartın açılış verisi: kural (varsa) + son 5 günlük kaydı + yazma izni. */
export async function getRepriceCardData(
  productId: string,
): Promise<RepriceCardData | { error: string }> {
  const m = await requireMembership();
  const admin = createAdminClient();

  const [ruleRes, logRes, writeAccess] = await Promise.all([
    admin
      .from("reprice_rules")
      .select(
        "id, mode, anchor, trigger_over_cents, target_over_cents, floor_cents, floor_melt_mult, max_change_pct, min_confidence, cooldown_hours, last_applied_at",
      )
      .eq("org_id", m.org_id)
      .eq("product_id", productId)
      .maybeSingle(),
    admin
      .from("reprice_log")
      .select(
        "id, old_price_cents, new_price_cents, anchor_cents, outcome, reason, created_at",
      )
      .eq("org_id", m.org_id)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(5),
    getEtsyWriteAccess(m.org_id),
  ]);

  if (ruleRes.error) {
    console.error("reprice kural okunamadı:", ruleRes.error.message);
    return { error: "Kural okunamadı." };
  }
  if (logRes.error) {
    console.error("reprice günlüğü okunamadı:", logRes.error.message);
  }

  return {
    rule: (ruleRes.data as RepriceRuleView | null) ?? null,
    logs: (logRes.data ?? []) as RepriceLogView[],
    writeEnabled: writeAccess.writeEnabled,
  };
}

/** Formdan gelen kural alanları — para/sayı alanları METİN (ör. "10,00"). */
export interface RepriceRuleInput {
  mode: string;
  anchor: string;
  /** Tetik toleransı: çapa + bu kadar üstüne çıkınca (ör. "10,00" = $10). */
  triggerOver: string;
  /** Hedef offset: çapa + bu kadar (ör. "9,00" = $9). */
  targetOver: string;
  /** Mutlak taban; boş = melt tabanına düş. */
  floor: string;
  /** Melt taban çarpanı (ör. "1,3"). */
  floorMeltMult: string;
  /** Tek seferde azami % değişim (ör. "10"). */
  maxChangePct: string;
  minConfidence: string;
  /** Saat (tam sayı). */
  cooldownHours: string;
}

function parseNumber(s: string): number | null {
  const v = s.trim().replace(",", ".");
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

/** Kuralı oluşturur/günceller (ürün başına tek kural — product_id UNIQUE). */
export async function saveRepriceRule(
  productId: string,
  input: RepriceRuleInput,
): Promise<{ ok?: boolean; error?: string }> {
  const m = await requireMembership();

  if (!MODES.includes(input.mode as RepriceMode)) {
    return { error: "Geçersiz mod." };
  }
  if (!ANCHORS.includes(input.anchor as RepriceAnchor)) {
    return { error: "Geçersiz çapa." };
  }
  if (!CONFIDENCES.includes(input.minConfidence as RepriceConfidence)) {
    return { error: "Geçersiz güven eşiği." };
  }

  const triggerOverCents = parseMoneyToCents(input.triggerOver);
  if (triggerOverCents <= 0) {
    return { error: "Geçerli bir tetik toleransı girin (ör. 10,00)." };
  }
  const targetOverCents = parseMoneyToCents(input.targetOver);
  if (targetOverCents < 0) {
    return { error: "Geçerli bir hedef offset girin (ör. 9,00)." };
  }
  // Hedef tetikten büyükse yeni fiyat hemen yine tetik bölgesinde kalır —
  // her cooldown'da bir daha tetiklenen kural anlamsızdır.
  if (targetOverCents > triggerOverCents) {
    return { error: "Hedef offset, tetik toleransından büyük olamaz." };
  }

  let floorCents: number | null = null;
  if (input.floor.trim()) {
    floorCents = parseMoneyToCents(input.floor);
    if (floorCents <= 0) {
      return { error: "Geçerli bir taban fiyat girin ya da boş bırakın." };
    }
  }

  const floorMeltMult = parseNumber(input.floorMeltMult);
  if (floorMeltMult == null || floorMeltMult <= 0 || floorMeltMult > 10) {
    return { error: "Melt taban çarpanı 0–10 arası olmalı (ör. 1,3)." };
  }
  const maxChangePct = parseNumber(input.maxChangePct);
  if (maxChangePct == null || maxChangePct <= 0 || maxChangePct > 100) {
    return { error: "Azami değişim %0–100 arası olmalı (ör. 10)." };
  }
  const cooldownHours = parseNumber(input.cooldownHours);
  if (
    cooldownHours == null ||
    !Number.isInteger(cooldownHours) ||
    cooldownHours < 0 ||
    cooldownHours > 24 * 30
  ) {
    return { error: "Cooldown 0–720 saat arası tam sayı olmalı." };
  }

  const admin = createAdminClient();
  // Ürün bu org'a mı ait? (yabancı product_id'ye kural yazılmasın)
  const { data: product, error: prodErr } = await admin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("org_id", m.org_id)
    .maybeSingle();
  if (prodErr) return { error: prodErr.message };
  if (!product) return { error: "Ürün bulunamadı." };

  const { error } = await admin.from("reprice_rules").upsert(
    {
      org_id: m.org_id,
      product_id: productId,
      mode: input.mode,
      anchor: input.anchor,
      trigger_over_cents: triggerOverCents,
      target_over_cents: targetOverCents,
      floor_cents: floorCents,
      floor_melt_mult: floorMeltMult,
      max_change_pct: maxChangePct,
      min_confidence: input.minConfidence,
      cooldown_hours: cooldownHours,
      created_by: m.user_id,
    },
    { onConflict: "product_id" },
  );
  if (error) return { error: error.message };

  revalidatePath(`/tasarimlar/listing/${productId}`);
  return { ok: true };
}
