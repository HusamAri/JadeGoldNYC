import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { jpegSize } from "@/lib/artifact-2027/jpeg-size";
import { logAudit } from "@/lib/audit";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import {
  galleryMarker,
  layoutOk,
  planGallery,
  type GalleryPhoto,
} from "@/lib/etsy/gallery-push";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

/**
 * Var olan bir Etsy TASLAĞINA bir setin satış görsellerini (01..10) ekler.
 * Vaka 2026-10-08: SS27 anklet taslakları A24..A40 Etsy'de yalnız keten
 * hero ile duruyordu; sahip A01..A23'e kareleri elle eklemiş, düzeni
 * "yeni kareler 1..10, keten hero en sonda" kurmuştu. Bu rota aynı düzeni
 * kurar.
 *
 * Kaynak: `/artifact/<set>/<model>/<NN>.jpg` (repo `public/`, canlı alan
 * adından okunur). Her dosya 2048×2048 JPEG olmalı; değilse hiçbir şey
 * yazılmaz.
 *
 * Sözleşme `gallery-2k-actions.ts`'ten kopyalandı: yalnız `draft` listing,
 * mağaza eşleşmesi, dış çağrıdan ÖNCE alınan kilit (compare-and-swap),
 * alt_text işaretiyle idempotens, her adımdan sonra geri okuma, panel
 * galerisi, denetim kaydı.
 *
 * Sıralama yalnız Etsy'nin BELGELENMİŞ davranışıyla kurulur (OpenAPI
 * uploadListingImage): yeni kareler sona eklenir (rank = sayı + 1, bu repoda
 * kanıtlı), sonra işaretsiz keten hero silinir ve aynı `listing_image_id`
 * ile en sona yeniden bağlanır ("a deleted image may be re-associated").
 * Dolu bir rank'a overwrite olmadan eklemenin davranışı belgede yok; ona
 * yaslanılmaz. Silinen görselin id'si silmeden ÖNCE metadata'ya yazılır,
 * yeniden bağlama yarıda kalırsa `resume=1` onu tamamlar.
 *
 * Parametreler: `org`, `set` (ör. ss27-anklets), `model` (ör. A24),
 * `apply=1` (yoksa kuru çalışma), `verify=1` (salt okuma), `resume=1`
 * (yarım kalan gönderime devam).
 *
 * Auth: `Authorization: Bearer $CRON_SECRET` ya da `?token=` →
 * `ops_tokens` purpose='gallery-push' SHA-256 CAS tüketimi.
 */

const PURPOSE = "gallery-push";
const SLOTS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return false;

  const hash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ops_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("purpose", PURPOSE)
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  if (error) console.error("gallery-push authorize: ops_tokens update failed", error.code, error.message);
  return (data ?? []).length > 0;
}

type Gallery = { results: GalleryPhoto[] };
type Meta = Record<string, unknown> & {
  modelId?: string;
  name?: string;
  galleryPush?: { status?: string; startedAt?: string; linenImageId?: number | null } | null;
};

function describe(photos: GalleryPhoto[]) {
  return [...photos]
    .sort((a, b) => a.rank - b.rank)
    .map((p) => ({
      id: p.listing_image_id,
      rank: p.rank,
      size: p.full_width && p.full_height ? `${p.full_width}x${p.full_height}` : null,
      alt: (p.alt_text ?? "").slice(0, 90) || null,
    }));
}

export async function GET(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const orgName = url.searchParams.get("org");
  const set = url.searchParams.get("set") ?? "";
  const model = url.searchParams.get("model") ?? "";
  const apply = url.searchParams.get("apply") === "1";
  const verify = url.searchParams.get("verify") === "1";
  const resume = url.searchParams.get("resume") === "1";
  if (!orgName || !/^[a-z0-9][a-z0-9-]{2,40}$/.test(set) || !/^[A-Z]\d{2}$/.test(model)) {
    return NextResponse.json({ error: "org, set (a-z0-9-) ve model (ör. A24) zorunlu" }, { status: 400 });
  }
  if (apply && verify) {
    return NextResponse.json({ error: "apply ve verify birlikte verilmez" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("id, name")
    .eq("name", orgName)
    .maybeSingle();
  if (orgErr || !org) {
    return NextResponse.json({ error: orgErr?.message ?? "org bulunamadı" }, { status: 404 });
  }
  // Oturumsuz ops çağrısında getEtsyWriteAccess her zaman false döner;
  // bağlantı kaydı doğrudan okunur (drafts-push ile aynı kural).
  const { data: connection } = await admin
    .from("etsy_connection")
    .select("status, scope")
    .eq("org_id", org.id)
    .maybeSingle();
  const conn = connection as { status: string; scope: string | null } | null;
  const writeEnabled = conn?.status === "connected" && /(^|\s)listings_w(\s|$)/.test(conn.scope ?? "");
  if (apply && !writeEnabled) {
    return NextResponse.json({ error: "Etsy yazma erişimi kapalı." }, { status: 403 });
  }

  // Hedef ürün: modelId + sourcePackage (senkron ürün SKU'sunu boşaltır,
  // listing_metadata'ya dokunmaz).
  const { data: rows, error: rowErr } = await admin
    .from("products")
    .select("id, etsy_listing_id, listing_metadata")
    .eq("org_id", org.id)
    .eq("listing_metadata->>modelId", model)
    .like("listing_metadata->>sourcePackage", `%-${set}`)
    .is("archived_at", null);
  if (rowErr) return NextResponse.json({ error: rowErr.message }, { status: 500 });
  if ((rows ?? []).length !== 1 || !rows![0].etsy_listing_id) {
    return NextResponse.json(
      { error: "hedef ürün tek ve Etsy'ye bağlı olmalı", found: (rows ?? []).length },
      { status: 404 },
    );
  }
  const prod = rows![0] as { id: string; etsy_listing_id: number; listing_metadata: Meta | null };
  const listingId = Number(prod.etsy_listing_id);
  const meta: Meta = prod.listing_metadata ?? {};
  const name = (meta.name as string | undefined) ?? model;

  // Kaynak kareler: canlı alan adından, 2048×2048 JPEG.
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || url.origin;
  const files: Record<string, { url: string; bytes: Uint8Array<ArrayBuffer>; sha: string }> = {};
  const problems: string[] = [];
  await Promise.all(
    SLOTS.map(async (slot) => {
      const src = `${base}/artifact/${set}/${model}/${slot}.jpg`;
      try {
        const res = await fetch(src, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bytes = new Uint8Array(await res.arrayBuffer());
        const size = jpegSize(bytes);
        if (size.width !== 2048 || size.height !== 2048) throw new Error(`${size.width}x${size.height}`);
        files[slot] = { url: src, bytes, sha: createHash("sha256").update(bytes).digest("hex") };
      } catch (e) {
        problems.push(`${slot}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }),
  );
  if (problems.length) {
    return NextResponse.json({ ok: false, error: "kaynak kareler hazır değil", problems }, { status: 409 });
  }
  const expected = Object.fromEntries(SLOTS.map((s) => [s, files[s].sha]));

  let client: EtsyClient;
  let shopId: number;
  try {
    client = await EtsyClient.forOrg(org.id);
    shopId = await client.requireShopId();
  } catch (e) {
    return NextResponse.json({ error: "etsy not connected", detail: e instanceof Error ? e.message : String(e) }, { status: 503 });
  }
  const readListing = () => client.get<{ state: string; shop_id: number }>(etsyPaths.listing(listingId));
  const readGallery = async () => (await client.get<Gallery>(etsyPaths.listingImagesRead(listingId))).results ?? [];

  const [listing, before] = await Promise.all([readListing(), readGallery()]);
  const plan = planGallery(before, set, model, expected);
  const summary = {
    org: org.name,
    set,
    model,
    listingId,
    state: listing.state,
    shopMatches: listing.shop_id === shopId,
    count: before.length,
    missing: plan.missing,
    stale: plan.stale.length,
    foreign: plan.foreign.length,
    layout: describe(before),
  };

  if (verify) {
    const check = layoutOk(plan, SLOTS);
    const sizesOk = [...plan.ours.values()].every((p) => p.full_width == null || (p.full_width === 2048 && p.full_height === 2048));
    return NextResponse.json({ ok: check.ok && sizesOk && summary.shopMatches, mode: "verify", reason: check.reason, sizesOk, ...summary });
  }
  if (!summary.shopMatches) {
    return NextResponse.json({ ok: false, error: "listing başka mağazada", ...summary }, { status: 409 });
  }
  if (listing.state !== "draft") {
    return NextResponse.json({ ok: false, error: `yalnız taslak listing'e yazılır; Etsy durumu: ${listing.state}`, ...summary }, { status: 409 });
  }
  if (plan.stale.length) {
    return NextResponse.json({ ok: false, error: "işaretli ama beklenmeyen görsel var; elle bakılmalı", ...summary }, { status: 409 });
  }
  if (plan.foreign.length > 1) {
    return NextResponse.json({ ok: false, error: "listing'de birden çok işaretsiz görsel var; elle bakılmalı", ...summary }, { status: 409 });
  }
  if (before.length + plan.missing.length > 20) {
    return NextResponse.json({ ok: false, error: "Etsy en çok 20 görsel alır", ...summary }, { status: 409 });
  }
  const prev = meta.galleryPush ?? null;
  const already = layoutOk(plan, SLOTS);
  if (already.ok) {
    return NextResponse.json({ ok: true, mode: apply ? "apply" : "dry-run", alreadyDone: true, previous: prev, ...summary });
  }
  if (!apply) {
    return NextResponse.json({ ok: true, mode: "dry-run", previous: prev, toUpload: plan.missing, ...summary });
  }

  // Kilit: dış çağrıdan önce. Yarım kalmış gönderime yalnız resume=1 devam eder.
  if (prev && prev.status !== "done" && !resume) {
    return NextResponse.json({ ok: false, error: "önceki gönderim yarım; resume=1 ile devam edin", previous: prev, ...summary }, { status: 409 });
  }
  const startedAt = new Date().toISOString();
  const lockMeta: Meta = { ...meta, galleryPush: { ...(prev ?? {}), status: "sending", startedAt } };
  let lockQ = admin.from("products").update({ listing_metadata: lockMeta }).eq("org_id", org.id).eq("id", prod.id);
  lockQ = prev?.startedAt
    ? lockQ.eq("listing_metadata->galleryPush->>startedAt", prev.startedAt)
    : lockQ.is("listing_metadata->galleryPush", null);
  const { data: locked, error: lockErr } = await lockQ.select("id");
  if (lockErr || (locked ?? []).length !== 1) {
    return NextResponse.json({ ok: false, error: "kilit alınamadı (başka gönderim sürüyor olabilir)", ...summary }, { status: 409 });
  }

  const record = async (status: string, extra: Record<string, unknown>) => {
    const { data: fresh } = await admin.from("products").select("listing_metadata").eq("id", prod.id).maybeSingle();
    const cur = ((fresh?.listing_metadata as Meta | null) ?? lockMeta) as Meta;
    await admin
      .from("products")
      .update({ listing_metadata: { ...cur, galleryPush: { ...(cur.galleryPush ?? {}), status, startedAt, ...extra } } })
      .eq("org_id", org.id)
      .eq("id", prod.id);
  };

  const uploaded: Record<string, number> = {};
  let linenImageId: number | null = (prev?.linenImageId as number | null | undefined) ?? null;
  try {
    // 1) Eksik kareleri sona ekle (rank = mevcut sayı + 1).
    let count = before.length;
    for (const slot of plan.missing) {
      const f = files[slot];
      const form = new FormData();
      form.append("image", new Blob([f.bytes], { type: "image/jpeg" }), `${set}-${model}-${slot}.jpg`);
      form.append("rank", String(count + 1));
      form.append("alt_text", `${name}, sales photo ${slot} of ${SLOTS.length}. ${galleryMarker(set, model, slot, f.sha)}`.slice(0, 500));
      const up = await client.requestMultipart<{ listing_image_id: number }>("POST", etsyPaths.listingImages(shopId, listingId), form);
      uploaded[slot] = up.listing_image_id;
      count++;
    }

    // 2) Düzen: işaretsiz görsel (keten hero) yeni karelerin önündeyse sil ve
    //    aynı id ile en sona yeniden bağla. Id silmeden ÖNCE kaydedilir.
    let after = await readGallery();
    let p2 = planGallery(after, set, model, expected);
    if (p2.missing.length || p2.stale.length) throw new Error(`yükleme sonrası eksik/uyuşmaz: ${p2.missing.join(",")} stale ${p2.stale.length}`);
    const linen = p2.foreign[0];
    if (linen && linen.rank <= SLOTS.length) {
      linenImageId = linen.listing_image_id;
      await record("sending", { linenImageId, linenAlt: linen.alt_text ?? null });
      await client.request("DELETE", etsyPaths.listingImage(shopId, listingId, linen.listing_image_id));
      after = await readGallery();
    }
    if (linenImageId && !after.some((p) => p.listing_image_id === linenImageId)) {
      const form = new FormData();
      form.append("listing_image_id", String(linenImageId));
      form.append("rank", String(after.length + 1));
      await client.requestMultipart("POST", etsyPaths.listingImages(shopId, listingId), form);
      after = await readGallery();
    }

    // 3) Geri okuma: hedef düzen, durum ve mağaza.
    p2 = planGallery(after, set, model, expected);
    const check = layoutOk(p2, SLOTS);
    const listingAfter = await readListing();
    const linenBack = linenImageId == null || after.some((p) => p.listing_image_id === linenImageId);
    const ok = check.ok && linenBack && listingAfter.state === "draft" && listingAfter.shop_id === shopId;

    // 4) Panel galerisi: 01..10 → position 0..9, diğerleri sonra.
    const ourIds = SLOTS.map((slot) => {
      const k = createHash("sha256").update(`${prod.id}:gallery-push:${set}:${slot}`).digest("hex");
      return `${k.slice(0, 8)}-${k.slice(8, 12)}-5${k.slice(13, 16)}-a${k.slice(17, 20)}-${k.slice(20, 32)}`;
    });
    const { data: panelRows } = await admin.from("listing_images").select("id, position").eq("org_id", org.id).eq("product_id", prod.id);
    const others = (panelRows ?? []).filter((r) => !ourIds.includes(r.id as string)).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    for (const [i, r] of others.entries()) {
      await admin.from("listing_images").update({ position: SLOTS.length + i }).eq("org_id", org.id).eq("id", r.id);
    }
    const upsert = await admin.from("listing_images").upsert(
      SLOTS.map((slot, i) => ({
        id: ourIds[i],
        org_id: org.id,
        product_id: prod.id,
        url: files[slot].url,
        storage_path: null,
        source: "url",
        alt: `${name}, sales photo ${slot}`,
        position: i,
      })),
      { onConflict: "id" },
    );
    if (upsert.error) throw new Error(`panel galerisi: ${upsert.error.message}`);
    await admin
      .from("products")
      .update({ image_url: files["01"].url, num_images: after.length })
      .eq("org_id", org.id)
      .eq("id", prod.id);

    const images = Object.fromEntries(SLOTS.map((s) => [s, { imageId: p2.ours.get(s)?.listing_image_id ?? null, sha: files[s].sha }]));
    await record(ok ? "done" : "needs_review", {
      set,
      model,
      finishedAt: new Date().toISOString(),
      images,
      linenImageId,
      count: after.length,
      reason: check.reason,
    });
    await logAudit(admin, {
      orgId: org.id,
      action: "etsy.image_upload",
      entityType: "product",
      entityId: prod.id,
      summary: `gallery-push ${set}/${model}: ${Object.keys(uploaded).length} görsel yüklendi, Etsy #${listingId} ${after.length} görsel${ok ? "" : " (needs_review)"}`,
      diff: { listingId, uploaded, linenImageId, layout: describe(after) },
      source: "app",
    });
    return NextResponse.json({ ok, mode: "apply", uploaded, reason: check.reason, linenImageId, ...summary, countAfter: after.length, layoutAfter: describe(after) });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await record("needs_review", { error, uploaded, linenImageId, failedAt: new Date().toISOString() });
    return NextResponse.json({ ok: false, mode: "apply", error, uploaded, linenImageId, ...summary }, { status: 502 });
  }
}
