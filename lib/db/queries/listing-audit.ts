import { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/db/queries/listings";
import {
  AUDIT_CHECKS,
  AUDIT_CHECK_BY_KEY,
  auditProduct,
  type AuditCheckDef,
  type AuditCheckKey,
} from "@/lib/etsy/listing-audit";

/**
 * Listing denetimi — veri katmanı. Aktif listingler org kilidiyle çekilir,
 * saf motor (lib/etsy/listing-audit.ts) kontrolleri uygular; sonuç kontrol
 * başına gruplanır: her grup YALNIZ etkilenen ürünleri taşır ki "Düzelt"
 * akışı kullanıcıya havuzdan ürün seçtirmesin.
 */

export interface AuditItem {
  productId: string;
  etsyListingId: number | null;
  title: string;
  detail: string;
  /** Bu ürün için düzeltmenin yapılacağı sayfa (çözülmüş bağlantı). */
  fixHref: string;
}

/**
 * İstemciye geçen DÜZ (serializable) grup — AuditCheckDef'in fonksiyon
 * alanları (title(n), fixHref(id)) RSC sınırından geçemez; burada çözülür.
 */
export interface AuditGroup {
  key: AuditCheckKey;
  severity: AuditCheckDef["severity"];
  title: string;
  hint: string;
  fixLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  autoFixable: boolean;
  count: number;
  items: AuditItem[];
}

export interface ListingAuditResult {
  /** Yalnız bulgusu olan kontroller, önem sırasına göre. */
  groups: AuditGroup[];
  auditedCount: number;
  findingCount: number;
}

const SEVERITY_RANK: Record<string, number> = { kritik: 0, onemli: 1, bilgi: 2 };

type ProductRow = {
  id: string;
  etsy_listing_id: number | null;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  materials: string[] | null;
  num_images: number | null;
};

export async function getListingAudit(
  orgId: string,
): Promise<ListingAuditResult> {
  const supabase = await createClient();
  // Yalnız AKTİF listingler — algoritma beslemesi canlı listing'de anlamlı;
  // tükenen/süresi dolanların kendi uyarıları var. Tam sayfalama (1000 satır
  // limitine yaslanma).
  const rows = await fetchAllPages<ProductRow>((from, to) =>
    supabase
      .from("products")
      .select("id, etsy_listing_id, title, description, tags, materials, num_images")
      .eq("org_id", orgId)
      .eq("status", "active")
      .order("title", { ascending: true })
      .range(from, to),
  );

  const byKey = new Map<AuditCheckKey, AuditItem[]>();
  for (const r of rows) {
    const findings = auditProduct({
      id: r.id,
      etsyListingId: r.etsy_listing_id,
      title: r.title ?? "",
      description: r.description,
      tags: r.tags,
      materials: r.materials,
      numImages: r.num_images,
    });
    for (const f of findings) {
      const def = AUDIT_CHECK_BY_KEY.get(f.key)!;
      const list = byKey.get(f.key) ?? [];
      list.push({
        productId: r.id,
        etsyListingId: r.etsy_listing_id,
        title: r.title ?? "Başlıksız listing",
        detail: f.detail,
        fixHref: def.fixHref(r.id),
      });
      byKey.set(f.key, list);
    }
  }

  const groups: AuditGroup[] = AUDIT_CHECKS.filter((c) => byKey.has(c.key))
    .map((def) => {
      const items = byKey.get(def.key)!;
      return {
        key: def.key,
        severity: def.severity,
        title: def.title(items.length),
        hint: def.hint,
        fixLabel: def.fixLabel,
        sourceLabel: def.sourceLabel,
        sourceUrl: def.sourceUrl,
        autoFixable: def.autoFixable ?? false,
        count: items.length,
        items,
      };
    })
    .sort(
      (a, b) =>
        SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
        b.count - a.count,
    );

  return {
    groups,
    auditedCount: rows.length,
    findingCount: groups.reduce((s, g) => s + g.count, 0),
  };
}

/** Uyarı Merkezi için hafif özet: kontrol başına başlık + sayı (düz veri). */
export interface AuditSummaryEntry {
  key: AuditCheckKey;
  severity: AuditCheckDef["severity"];
  title: string;
  hint: string;
  count: number;
}

export async function getListingAuditSummary(
  orgId: string,
): Promise<AuditSummaryEntry[]> {
  const { groups } = await getListingAudit(orgId);
  return groups.map((g) => ({
    key: g.key,
    severity: g.severity,
    title: g.title,
    hint: g.hint,
    count: g.count,
  }));
}
