import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { jpegSize } from "@/lib/artifact-2027/jpeg-size";
import { logAudit } from "@/lib/audit";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { decodeHtmlEntities } from "@/lib/etsy/text";
import {
  correctPrefix,
  framesInOrder,
  galleryMarker,
  layoutOk,
  linenPending as linenPendingFor,
  linenPlaced,
  planGallery,
  relativeLayoutOk,
  rerankPlan,
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
 * Sıralama: `rank` yalnız bir sıralama DEĞERİDİR ve Etsy'nin onu nasıl
 * güncellediği tutarlı değil (2026-10-08): A24'te silme sıraları sıkıştırmadı
 * ve aynı rank'e iki görsel izin verildi, A39'da silme sıkıştırdı ve dolu
 * rank'e yükleme görseli komşusunun ardına koydu. Silinmiş görseli
 * `listing_image_id` ile yeniden bağlamak verilen rank'i ve alt text'i yazar.
 * Bu yüzden düzen tek seferlik adımlarla değil, yakınsayan bir döngüyle kurulur:
 * kareler kendi slot numarasıyla yüklenir (01 → rank 1), sonra her turda galeri
 * yeniden okunur, kendi slotunda olmayan kare silinip tam slot rank'ine,
 * N+1'de olmayan keten hero silinip N+1'e yeniden bağlanır; hedef tutunca döngü
 * biter. Silinen keten hero'nun id'si silmeden ÖNCE metadata'ya yazılır,
 * yeniden bağlama yarıda kalırsa `resume=1` onu tamamlar; yarıda kalan kare
 * kaynaktan yeniden yüklenir.
 *
 * Parametreler: `org`, `set` (ör. ss27-anklets), `model` (ör. A24),
 * `apply=1` (yoksa kuru çalışma), `verify=1` (salt okuma), `resume=1`
 * (yarım kalan gönderime devam), `restoreLinen=1` (yayına alınmış listing'de
 * askıda kalan keteni geri bağlamaya sahibin açık onayı), `live=1` (yayındaki
 * listing'de YALNIZ keten hero'yu son karenin hemen ardına taşır; karelere
 * dokunmaz, eksik ya da sırasız karede reddeder; sahibin açık onayıyla,
 * 2026-10-08 A24/A39).
 *
 * Taslak kapısı yalnız Etsy yazımı içindir; Etsy zaten doğruysa panel
 * kapanışı listing yayında olsa da yapılır ve sahibin yayına alması hata
 * sayılmaz (ikinci bağımsız inceleme 2026-10-08).
 *
 * Auth: `Authorization: Bearer $CRON_SECRET` ya da `?token=` →
 * `ops_tokens` purpose='gallery-push' SHA-256 CAS tüketimi.
 */

const PURPOSE = "gallery-push";
const SLOTS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
/** Yarım "sending" koşusu ancak maxDuration + pay dolunca devralınır. */
const LEASE_MS = 330_000;

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

const altKey = (s: string | null | undefined) => decodeHtmlEntities(s ?? "").trim();

type Gallery = { results: GalleryPhoto[] };
type Meta = Record<string, unknown> & {
  modelId?: string;
  name?: string;
  galleryPush?: (Record<string, unknown> & { status?: string; startedAt?: string; linenImageId?: number | null; linenAlt?: string | null }) | null;
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
  // Bu süreden sonra yeni düzen turu başlamaz; kalan iş resume=1 ile tamamlanır.
  const deadline = Date.now() + 150_000;
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
  const restoreLinen = url.searchParams.get("restoreLinen") === "1";
  const live = url.searchParams.get("live") === "1";
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

  const prev = meta.galleryPush ?? null;
  // Keten askıda mı (önceki yarım koşu sildi, geri bağlayamadı): bkz. linenPending.
  const linenPending = linenPendingFor(prev, before, plan);
  const check = layoutOk(plan, SLOTS);
  const runOpen = prev != null && prev.status !== "done";
  // Kayıtlı keten hedefte mi (rank N+1, alt text korunmuş); apply ile aynı kural.
  const linenNow = linenPending
    ? { ok: false, reason: `keten hero (${prev!.linenImageId}) silinmiş, geri bağlanmamış` }
    : linenPlaced(before, prev?.linenImageId, prev?.linenAlt, SLOTS.length, altKey);

  if (verify) {
    const sizesOk = [...plan.ours.values()].every((p) => p.full_width == null || (p.full_width === 2048 && p.full_height === 2048));
    const reason =
      check.reason ?? linenNow.reason ?? (runOpen ? `önceki koşu kapanmadı (${prev!.status}); apply&resume=1 tamamlar` : null);
    return NextResponse.json({
      ok: check.ok && linenNow.ok && !runOpen && sizesOk && summary.shopMatches,
      mode: "verify",
      reason,
      sizesOk,
      relative: relativeLayoutOk(before, plan, SLOTS),
      previous: prev,
      ...summary,
    });
  }
  if (!summary.shopMatches) {
    return NextResponse.json({ ok: false, error: "listing başka mağazada", ...summary }, { status: 409 });
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
  // Salt okuma yanıtları taslak kapısından ÖNCE: durum ne olursa olsun raporlanır.
  // Tamam = Etsy düzeni doğru + keten hedefte + panel kapanışı yapılmış.
  if (check.ok && linenNow.ok && prev?.status === "done") {
    return NextResponse.json({ ok: true, mode: apply ? "apply" : "dry-run", alreadyDone: true, previous: prev, ...summary });
  }
  // Etsy'ye YAZI gerekiyor mu: eksik kare, slotunda olmayan kare, öne düşmüş
  // işaretsiz görsel ya da askıdaki keten. Gerekmiyorsa (Etsy doğru, panel
  // yarım) yalnız panel yazılır ve bu, listing yayına alınmış olsa da güvenlidir.
  const moves = rerankPlan(plan, SLOTS);
  // Keten hero tam N+1'de olmalı (apply bunu kurar; A39'da sıkışma onu 10'a kaydırmıştı).
  const linenOff = plan.foreign.some((f) => f.rank !== SLOTS.length + 1);
  const etsyWrites = plan.missing.length > 0 || moves.length > 0 || linenOff || linenPending;
  // Yayın modu: listing taslak değil, kareler tam ve sıralı, tek işaretsiz görsel
  // var; yalnız o görsel son karenin ardına taşınır, karelere dokunulmaz.
  const liveFix =
    live && listing.state !== "draft" && plan.missing.length === 0 && plan.foreign.length === 1 && framesInOrder(plan, SLOTS).ok;
  if (!apply) {
    return NextResponse.json({
      ok: true,
      mode: "dry-run",
      previous: prev,
      toUpload: plan.missing,
      toRerank: moves.map((m) => ({ id: m.photo.listing_image_id, from: m.photo.rank, to: m.rank })),
      linenPending,
      panelOnly: !etsyWrites,
      liveFix,
      relative: relativeLayoutOk(before, plan, SLOTS),
      ...summary,
    });
  }
  // Taslak kapısı yalnız Etsy yazımı için. Yayındaki listing'e askıdaki keteni
  // geri bağlamak bile sahibin açık onayını (restoreLinen=1) ister.
  if (etsyWrites && listing.state !== "draft") {
    const onlyRestore =
      linenPending && plan.missing.length === 0 && moves.length === 0 && !linenOff;
    if (!(onlyRestore && restoreLinen) && !liveFix) {
      return NextResponse.json(
        {
          ok: false,
          error: onlyRestore
            ? `listing ${listing.state}; keten hero (${prev!.linenImageId}) geri bağlanmadı, yalnız restoreLinen=1 ile`
            : live
              ? `live=1 yalnız keteni taşır: kareler tam ve sıralı, tek işaretsiz görsel olmalı (${framesInOrder(plan, SLOTS).reason ?? `işaretsiz ${plan.foreign.length}`})`
              : `yalnız taslak listing'e görsel yüklenir; Etsy durumu: ${listing.state}`,
          linenImageId: prev?.linenImageId ?? null,
          linenAlt: prev?.linenAlt ?? null,
          ...summary,
        },
        { status: 409 },
      );
    }
  }

  // Kilit: dış çağrıdan önce. Yarım koşuya yalnız resume=1 devam eder; hâlâ
  // "sending" olan koşu ancak kira süresi (maxDuration + pay) dolunca
  // devralınır, yoksa iki koşu aynı görselleri yükler.
  if (prev && prev.status !== "done") {
    if (!resume) {
      return NextResponse.json({ ok: false, error: "önceki gönderim yarım; resume=1 ile devam edin", previous: prev, ...summary }, { status: 409 });
    }
    const age = Date.now() - Date.parse(prev.startedAt ?? "");
    if (prev.status === "sending" && !(age > LEASE_MS)) {
      const wait = Math.ceil((LEASE_MS - (Number.isFinite(age) ? age : 0)) / 1000);
      return NextResponse.json({ ok: false, error: `gönderim hâlâ sürüyor olabilir; ${wait} sn sonra resume=1`, previous: prev, ...summary }, { status: 409 });
    }
  }
  const startedAt = new Date().toISOString();
  const carried =
    prev && prev.status !== "done" ? { linenImageId: prev.linenImageId ?? null, linenAlt: prev.linenAlt ?? null } : {};
  const lockMeta: Meta = { ...meta, galleryPush: { status: "sending", set, model, startedAt, ...carried } };
  let lockQ = admin.from("products").update({ listing_metadata: lockMeta }).eq("org_id", org.id).eq("id", prod.id);
  lockQ = prev?.startedAt
    ? lockQ.eq("listing_metadata->galleryPush->>startedAt", prev.startedAt)
    : lockQ.is("listing_metadata->galleryPush", null);
  const { data: locked, error: lockErr } = await lockQ.select("id");
  if (lockErr || (locked ?? []).length !== 1) {
    return NextResponse.json({ ok: false, error: "kilit alınamadı (başka gönderim sürüyor olabilir)", ...summary }, { status: 409 });
  }

  // Sahiplik: her Etsy yazımından önce kilidin hâlâ bu koşuda olduğu okunur;
  // metadata yazımı da yalnız sahipken yapılır ve başarısızsa HATA fırlatır
  // (silmeden önceki kontrol noktası yazılamazsa silme yapılmaz).
  const readMeta = async (): Promise<Meta> => {
    const { data, error } = await admin.from("products").select("listing_metadata").eq("org_id", org.id).eq("id", prod.id).maybeSingle();
    if (error || !data) throw new Error(`metadata okunamadı: ${error?.message ?? "satır yok"}`);
    const cur = ((data.listing_metadata as Meta | null) ?? {}) as Meta;
    if (cur.galleryPush?.startedAt !== startedAt) throw new Error("kilit artık bu koşuda değil");
    return cur;
  };
  const record = async (status: string, extra: Record<string, unknown>) => {
    const cur = await readMeta();
    const { data, error } = await admin
      .from("products")
      .update({ listing_metadata: { ...cur, galleryPush: { ...(cur.galleryPush ?? {}), status, ...extra } } })
      .eq("org_id", org.id)
      .eq("id", prod.id)
      .eq("listing_metadata->galleryPush->>startedAt", startedAt)
      .select("id");
    if (error || (data ?? []).length !== 1) throw new Error(`metadata yazılamadı: ${error?.message ?? "0 satır"}`);
  };

  const uploaded: Record<string, number> = {};
  const reranked: Record<string, number> = {};
  let linenImageId: number | null = carried.linenImageId ?? null;
  let linenAlt: string | null = carried.linenAlt ?? null;
  try {
    // 1) Eksik kareleri kendi slot rank'iyle yükle (01 → 1 … 10 → 10).
    const frameAlt = (slot: string) =>
      `${name}, sales photo ${slot} of ${SLOTS.length}. ${galleryMarker(set, model, slot, files[slot].sha)}`.slice(0, 500);
    const slotRank = (slot: string) => SLOTS.indexOf(slot) + 1;
    for (const slot of plan.missing) {
      await readMeta();
      const f = files[slot];
      const form = new FormData();
      form.append("image", new Blob([f.bytes], { type: "image/jpeg" }), `${set}-${model}-${slot}.jpg`);
      form.append("rank", String(slotRank(slot)));
      form.append("alt_text", frameAlt(slot));
      const up = await client.requestMultipart<{ listing_image_id: number }>("POST", etsyPaths.listingImages(shopId, listingId), form);
      uploaded[slot] = up.listing_image_id;
    }

    let after = await readGallery();
    let p2 = planGallery(after, set, model, expected);
    if (p2.missing.length) {
      // Yeni yüklenen görsel listede bir an gecikebilir; bir kez yeniden oku.
      await new Promise((r) => setTimeout(r, 1500));
      after = await readGallery();
      p2 = planGallery(after, set, model, expected);
    }
    if (p2.missing.length || p2.stale.length) {
      throw new Error(`yükleme sonrası eksik/uyuşmaz: ${p2.missing.join(",") || "-"}; stale ${p2.stale.length}`);
    }

    // 2) Düzen, yakınsayan döngüyle: her turda galeri yeniden okunur; düzen
    //    tutmuyorsa keten hero ve doğru önekten sonraki kareler alınır, kareler
    //    aynı id + alt text'le sırayla boş rank'lere, keten N+1'e yeniden
    //    bağlanır. Etsy'nin sıra davranışı tutarlı değil: A24'te silme sıraları
    //    sıkıştırmadı ve eşit rank'e izin verdi, A39'da sıkıştırdı ve keten
    //    11'den 10'a kaydı. Keten id'si ve alt text'i silmeden ÖNCE yazılır;
    //    silme ile bağlama arasında kalan kare resume=1'de kaynaktan yeniden
    //    yüklenir.
    const target = SLOTS.length + 1;
    const pause = () => new Promise((r) => setTimeout(r, 1000));
    const readUntil = async (done: (list: GalleryPhoto[]) => boolean) => {
      let list = await readGallery();
      for (let i = 0; i < 3 && !done(list); i++) {
        await pause();
        list = await readGallery();
      }
      return list;
    };
    const has = (list: GalleryPhoto[], id: number) => list.some((p) => p.listing_image_id === id);
    const at = (list: GalleryPhoto[], id: number, rank: number) => list.some((p) => p.listing_image_id === id && p.rank === rank);
    const reattach = async (id: number, rank: number, alt: string | null) => {
      await readMeta();
      const form = new FormData();
      form.append("listing_image_id", String(id));
      form.append("rank", String(rank));
      // Etsy alt'ı kaçışlı döndürebilir; çözülmüş hâli gönderilir (çift kaçış olmasın).
      if (alt) form.append("alt_text", altKey(alt).slice(0, 500));
      const back = await client.requestMultipart<{ listing_image_id?: number }>("POST", etsyPaths.listingImages(shopId, listingId), form);
      const newId = back?.listing_image_id ?? id;
      after = await readUntil((l) => at(l, newId, rank));
      return newId;
    };
    const detach = async (id: number, what: string) => {
      await readMeta();
      await client.request("DELETE", etsyPaths.listingImage(shopId, listingId, id));
      after = await readUntil((l) => !has(l, id));
      if (has(after, id)) throw new Error(`${what} (${id}) silindi dendi ama listede duruyor`);
    };
    const prefix = (list: GalleryPhoto[]) => correctPrefix(list, planGallery(list, set, model, expected), SLOTS);
    // Yayın modu (live=1, sahibin açık onayı): karelere hiç yazılmaz; yalnız
    // keten, eşitse ya da yerinde değilse alınıp son karenin hemen ardına
    // bağlanır. Hedef silmeden SONRA okunur (silme sıraları sıkıştırabilir, A39);
    // yalnız karelerin kaldığı galeride en büyük rank + 1 her zaman boştur.
    if (liveFix) {
      const ln = planGallery(after, set, model, expected).foreign[0];
      const fr0 = framesInOrder(planGallery(after, set, model, expected), SLOTS);
      const tied = ln != null && after.some((p) => p.listing_image_id !== ln.listing_image_id && p.rank === ln.rank);
      if (ln && (!fr0.ok || ln.rank !== fr0.maxRank + 1 || tied)) {
        linenImageId = ln.listing_image_id;
        linenAlt = ln.alt_text ?? null;
        await record("sending", { linenImageId, linenAlt, live: true });
        await detach(ln.listing_image_id, "keten hero");
        const end = Math.max(0, ...after.map((p) => p.rank)) + 1;
        const newId = await reattach(linenImageId, end, linenAlt);
        if (newId !== linenImageId) {
          linenImageId = newId;
          await record("sending", { linenImageId, linenAlt, live: true });
        }
      }
    }
    for (let pass = 0; !liveFix && pass < 4; pass++) {
      let cur = planGallery(after, set, model, expected);
      if (cur.missing.length || cur.stale.length) {
        throw new Error(`düzen turunda eksik/uyuşmaz: ${cur.missing.join(",") || "-"}; stale ${cur.stale.length}`);
      }
      const ln = cur.foreign[0];
      // Askıdaki keten yerine işaretsiz bir görsel zaten varsa (sahip elle
      // eklemiş) eski id yeniden bağlanmaz, o görsel benimsenir.
      if (ln && linenImageId != null && !has(after, linenImageId)) {
        linenImageId = ln.listing_image_id;
        linenAlt = ln.alt_text ?? null;
        await record("sending", { linenImageId, linenAlt, linenAdopted: true });
      }
      const linenOff = ln ? ln.rank !== target : linenImageId != null;
      if (prefix(after) === SLOTS.length && !linenOff) break;
      // Bir tur en çok ~22 Etsy yazımı; geç başlayan tur maxDuration'ı aşmasın.
      if (Date.now() >= deadline) break;
      // Keten her işte önce alınır: kare silmeleri sıraları sıkıştırıp onu
      // karelerin arasına kaydırabilir (A39).
      if (ln) {
        linenImageId = ln.listing_image_id;
        linenAlt = ln.alt_text ?? null;
        await record("sending", { linenImageId, linenAlt });
        await detach(ln.listing_image_id, "keten hero");
      }
      // Doğru önekten sonraki kareler önce hepsi alınır, sonra sırayla HER ZAMAN
      // boş olan bir sonraki rank'e bağlanır: eşit rank hiç oluşmaz, Etsy'nin
      // eşitlik sırası ya da sıkıştırması sonucu değiştiremez (simülasyon:
      // değerler, liste, sıkıştırma, eski/yeni önce; 2000 karışık deneme).
      const k = prefix(after);
      cur = planGallery(after, set, model, expected);
      const rest = SLOTS.slice(k).map((slot) => ({ slot, id: cur.ours.get(slot)!.listing_image_id }));
      for (const r of rest) await detach(r.id, `kare ${r.slot}`);
      for (const [i, r] of rest.entries()) {
        const newId = await reattach(r.id, k + i + 1, frameAlt(r.slot));
        if (!has(after, newId)) throw new Error(`kare ${r.slot} (${newId}) yeniden bağlanamadı`);
        reranked[r.slot] = k + i + 1;
      }
      if (linenImageId != null && !has(after, linenImageId)) {
        const newId = await reattach(linenImageId, target, linenAlt);
        if (newId !== linenImageId) {
          linenImageId = newId;
          await record("sending", { linenImageId, linenAlt });
        }
      }
    }

    // 3) Geri okuma: hedef düzen, keten 11. sırada ve alt text'iyle, durum, mağaza.
    p2 = planGallery(after, set, model, expected);
    // Yayın modunda ölçüt görünen sıradır (kareler sıralı, rank paylaşılmıyor,
    // keten son karenin ardında); taslakta tam değerler (1..N, keten N+1).
    const rel = liveFix ? relativeLayoutOk(after, p2, SLOTS) : null;
    const fin = rel ?? layoutOk(p2, SLOTS);
    const linenRes = linenPlaced(after, linenImageId, linenAlt, rel ? rel.maxRank : SLOTS.length, altKey);
    const listingAfter = await readListing();
    // Sahibin bu arada yayına alması hata değildir: raporlanır, düzeltilmez.
    const ok = fin.ok && linenRes.ok && listingAfter.shop_id === shopId;
    const images = Object.fromEntries(SLOTS.map((s) => [s, { imageId: p2.ours.get(s)?.listing_image_id ?? null, sha: files[s].sha }]));
    if (!ok) {
      const reason = fin.reason ?? linenRes.reason ?? "listing başka mağazada";
      await record("needs_review", { finishedAt: new Date().toISOString(), images, linenImageId, linenAlt, count: after.length, reason, stateAfter: listingAfter.state });
      await logAudit(admin, {
        orgId: org.id,
        action: "etsy.image_upload",
        entityType: "product",
        entityId: prod.id,
        summary: `gallery-push ${set}/${model}: needs_review (${reason}), Etsy #${listingId} ${after.length} görsel`,
        diff: { listingId, uploaded, reranked, linenImageId, layout: describe(after) },
        source: "app",
      });
      // Panel yazılmaz: Etsy hedef düzende değilken panel bitmiş gibi görünmesin.
      return NextResponse.json({ ok: false, mode: "apply", reason, uploaded, reranked, linenImageId, ...summary, stateAfter: listingAfter.state, countAfter: after.length, layoutAfter: describe(after) }, { status: 409 });
    }

    // 4) Panel galerisi (yalnız Etsy doğrulandıktan sonra): 01..10 → 0..9, diğerleri sonra.
    const ourIds = SLOTS.map((slot) => {
      const k = createHash("sha256").update(`${prod.id}:gallery-push:${set}:${slot}`).digest("hex");
      return `${k.slice(0, 8)}-${k.slice(8, 12)}-5${k.slice(13, 16)}-a${k.slice(17, 20)}-${k.slice(20, 32)}`;
    });
    const panelRead = await admin.from("listing_images").select("id, position").eq("org_id", org.id).eq("product_id", prod.id);
    if (panelRead.error) throw new Error(`panel galerisi okunamadı: ${panelRead.error.message}`);
    const others = (panelRead.data ?? [])
      .filter((r) => !ourIds.includes(r.id as string))
      .sort((a, b) => ((a.position as number | null) ?? 0) - ((b.position as number | null) ?? 0));
    for (const [i, r] of others.entries()) {
      const moved = await admin.from("listing_images").update({ position: SLOTS.length + i }).eq("org_id", org.id).eq("id", r.id);
      if (moved.error) throw new Error(`panel sırası: ${moved.error.message}`);
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
    const prodUpd = await admin
      .from("products")
      .update({ image_url: files["01"].url, num_images: after.length })
      .eq("org_id", org.id)
      .eq("id", prod.id);
    if (prodUpd.error) throw new Error(`ürün kapağı: ${prodUpd.error.message}`);

    await record("done", { finishedAt: new Date().toISOString(), images, linenImageId, linenAlt, count: after.length, reason: null, error: null, stateAfter: listingAfter.state, layout: liveFix ? "relative" : "exact" });
    await logAudit(admin, {
      orgId: org.id,
      action: "etsy.image_upload",
      entityType: "product",
      entityId: prod.id,
      summary: `gallery-push ${set}/${model}: ${Object.keys(uploaded).length} görsel yüklendi, ${Object.keys(reranked).length} sıra düzeltildi, Etsy #${listingId} ${after.length} görsel, düzen doğrulandı`,
      diff: { listingId, uploaded, reranked, linenImageId, layout: describe(after) },
      source: "app",
    });
    return NextResponse.json({ ok: true, mode: "apply", uploaded, reranked, linenImageId, ...summary, stateAfter: listingAfter.state, countAfter: after.length, layoutAfter: describe(after) });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    let recorded = true;
    try {
      await record("needs_review", { error, uploaded, reranked, linenImageId, linenAlt, failedAt: new Date().toISOString() });
    } catch {
      recorded = false;
    }
    try {
      await logAudit(admin, {
        orgId: org.id,
        action: "etsy.image_upload",
        entityType: "product",
        entityId: prod.id,
        summary: `gallery-push ${set}/${model}: hata (${error.slice(0, 160)}), yüklenen ${Object.keys(uploaded).length}, sıra ${Object.keys(reranked).length}, keten ${linenImageId ?? "-"}`,
        diff: { listingId, uploaded, reranked, linenImageId, linenAlt, error },
        source: "app",
      });
    } catch {
      // logAudit hatayı zaten yutar; burada yalnız güvenlik.
    }
    return NextResponse.json({ ok: false, mode: "apply", error, recorded, uploaded, reranked, linenImageId, linenAlt, ...summary }, { status: 502 });
  }
}
