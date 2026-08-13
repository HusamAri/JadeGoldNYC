"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { EtsyClient } from "@/lib/etsy/client";
import { updateListingSection } from "@/lib/etsy/listing";
import { logAudit } from "@/lib/audit";
import {
  CHAPTER_TO_SECTION,
  sectionKey,
  type Chapter,
} from "@/lib/collections/chapters";

export interface SectionPlanRow {
  productId: string;
  etsyListingId: number;
  title: string;
  chapter: Chapter;
  /** Hedef Etsy bölümü adı (Protection / Faith / …). */
  targetSection: string;
  targetSectionId: number | null;
  /** Şu an bulunduğu bölüm (panel aynası). */
  currentSectionId: number | null;
  currentSectionTitle: string | null;
  /** Zaten doğru yerdeyse gönderilmez. */
  alreadyThere: boolean;
}

export interface SectionPlan {
  rows: SectionPlanRow[];
  /** Etsy'de karşılığı bulunamayan hedef bölümler (ör. Love henüz açılmadı). */
  missingSections: string[];
  /** Panelde kayıtlı bölüm listesinin tazeliği. */
  sectionsUpdatedAt: string | null;
  toMove: number;
}

/**
 * Gönderim planı: hangi listing hangi vitrine taşınacak.
 *
 * SALT OKUMA — Etsy'ye hiçbir şey yazmaz. Önce plan görülür, sonra gönderilir
 * (koruma kuralı: geri dönüşü olan ama toplu bir işlemde önce liste görülür).
 */
export async function getSectionPlan(): Promise<SectionPlan> {
  const m = await requireMembership();
  const supabase = await createClient();

  const [prodRes, secRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, etsy_listing_id, title, chapter, etsy_section_id")
      .eq("org_id", m.org_id)
      .not("etsy_listing_id", "is", null)
      .is("etsy_deleted_at", null)
      .is("archived_at", null)
      .eq("status", "active")
      .not("chapter", "is", null),
    supabase
      .from("etsy_shop_sections")
      .select("section_id, title, updated_at")
      .eq("org_id", m.org_id),
  ]);

  if (prodRes.error) throw new Error(prodRes.error.message);
  if (secRes.error) throw new Error(secRes.error.message);

  const sections = (secRes.data ?? []) as {
    section_id: number;
    title: string;
    updated_at: string | null;
  }[];

  // Bölüm adı → id (ilk kelime eşleşmesi: "Protection" ≡ "Protection & Luck").
  const byKey = new Map<string, { id: number; title: string }>();
  for (const s of sections) {
    byKey.set(sectionKey(s.title), { id: s.section_id, title: s.title });
  }
  const titleById = new Map(sections.map((s) => [s.section_id, s.title]));

  const rows: SectionPlanRow[] = [];
  const missing = new Set<string>();

  for (const p of (prodRes.data ?? []) as {
    id: string;
    etsy_listing_id: number;
    title: string | null;
    chapter: string;
    etsy_section_id: number | null;
  }[]) {
    const chapter = p.chapter as Chapter;
    const targetSection = CHAPTER_TO_SECTION[chapter];
    if (!targetSection) continue;
    const hit = byKey.get(sectionKey(targetSection));
    if (!hit) missing.add(targetSection);

    rows.push({
      productId: p.id,
      etsyListingId: p.etsy_listing_id,
      title: p.title ?? "(başlıksız)",
      chapter,
      targetSection,
      targetSectionId: hit?.id ?? null,
      currentSectionId: p.etsy_section_id,
      currentSectionTitle: p.etsy_section_id
        ? (titleById.get(p.etsy_section_id) ?? null)
        : null,
      alreadyThere: hit != null && p.etsy_section_id === hit.id,
    });
  }

  rows.sort((a, b) =>
    a.targetSection === b.targetSection
      ? a.title.localeCompare(b.title, "tr")
      : a.targetSection.localeCompare(b.targetSection, "tr"),
  );

  return {
    rows,
    missingSections: [...missing].sort(),
    sectionsUpdatedAt: sections[0]?.updated_at ?? null,
    toMove: rows.filter((r) => !r.alreadyThere && r.targetSectionId != null)
      .length,
  };
}

export interface SectionPushResult {
  error?: string;
  moved?: number;
  failed?: number;
  skipped?: number;
  details?: { title: string; error: string }[];
}

/**
 * Planı Etsy'ye uygular.
 *
 * `limit` verilirse yalnız o kadar listing gönderilir — CANARY yolu budur
 * (koruma kuralı: önce 1 listing, gözle doğrula, sonra dalga). Zaten doğru
 * bölümdeki listing atlanır (idempotent). Her yazma read-back ile doğrulanır;
 * doğrulanmayan yazma başarı sayılmaz.
 *
 * Sıralı çalışır: Etsy istemcisi 429'da tek retry yapar, toplu paralel istek
 * kotayı yakar.
 */
export async function pushSections(opts?: {
  limit?: number;
  onlyChapter?: Chapter;
}): Promise<SectionPushResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) return { error: "Etsy yazma erişimi kapalı." };

  const plan = await getSectionPlan();
  let queue = plan.rows.filter(
    (r) => !r.alreadyThere && r.targetSectionId != null,
  );
  if (opts?.onlyChapter) {
    queue = queue.filter((r) => r.chapter === opts.onlyChapter);
  }
  const skipped = plan.rows.length - queue.length;
  if (opts?.limit != null) queue = queue.slice(0, opts.limit);

  if (queue.length === 0) {
    return { moved: 0, failed: 0, skipped, details: [] };
  }

  const client = await EtsyClient.forOrg(m.org_id);
  const admin = createAdminClient();

  let moved = 0;
  let failed = 0;
  const details: { title: string; error: string }[] = [];

  for (const row of queue) {
    try {
      const res = await updateListingSection(
        client,
        row.etsyListingId,
        row.targetSectionId!,
      );
      if (!res.ok) {
        failed++;
        details.push({ title: row.title, error: res.detail ?? "doğrulanamadı" });
        continue;
      }
      // Vekili eşitle: panel aynası artık canlıdaki bölümü göstersin.
      await admin
        .from("products")
        .update({ etsy_section_id: row.targetSectionId })
        .eq("org_id", m.org_id)
        .eq("id", row.productId);
      moved++;
    } catch (e) {
      failed++;
      details.push({
        title: row.title,
        error: e instanceof Error ? e.message : "gönderilemedi",
      });
    }
  }

  if (moved > 0) {
    await logAudit(admin, {
      orgId: m.org_id,
      action: "etsy.redesign_push",
      entityType: "products",
      summary: `${moved} listing Etsy vitrin bölümüne taşındı${
        failed > 0 ? ` (${failed} başarısız)` : ""
      }`,
    });
  }

  revalidatePath("/tasarimlar/bolumler");
  return { moved, failed, skipped, details };
}
