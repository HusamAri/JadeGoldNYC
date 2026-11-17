import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { decodeHtmlEntities } from "@/lib/etsy/text";
import { stripImageMetadata } from "@/lib/photo-kit/strip-metadata";
import { jpegSize } from "@/lib/artifact-2027/jpeg-size";
import {
  byRank,
  describePhotos,
  nextRank,
  planPhotosCopy,
  sourceProblems,
  specProblems,
  type LivePhoto,
  type PhotosCopyPlan,
  type PhotosCopySpec,
} from "@/lib/etsy/photos-copy";
import { logAudit } from "@/lib/audit";
import specFile from "@/docs/artifact-studio/fix-plan-2026-11-17/photos-copy.json";

export const maxDuration = 300;

/**
 * PHOTOS-COPY: bir listing'in canlı fotoğraflarını aynı mağazadaki başka bir
 * listing'e kopyalar. Gözetimli, tek kullanımlık token.
 *
 * NEDEN VAR (2026-11-17, Leander): 4612132585 mesajlardan açılmış özel sipariş
 * listing'i; tek görseli Etsy'nin yer tutucu grafiği, alıcı bileziği değil
 * mavi bir simge görüyor. Ürünün mağazadaki listing'i (4590689501) on kare
 * taşıyor. Var olan görsel rotası (gallery-push) panel galerisini TASLAĞA
 * yükler; canlı bir listing'in karelerini başka bir listing'e taşıyan yol yoktu.
 *
 * Sözleşme:
 *  - `?org=` ve `?spec=<anahtar>` ZORUNLU. Kareler, sıraları ve alt text'ler
 *    BİREBİR spec'ten gelir (docs/artifact-studio/fix-plan-2026-11-17/photos-copy.json).
 *  - Varsayılan KURU ÇALIŞMA: iki listing'in canlı galerisini döker, kaynağın
 *    incelenen galeri olduğunu ve her karenin baytlarının spec'teki sha256 ile
 *    tuttuğunu sınar, planı döner.
 *  - Her `apply=1` çağrısı TEK aşama yapar:
 *      would-copy    eksik kareleri sırayla yükler (`limit=N`: en çok N kare).
 *                    Yer tutucuya dokunmaz; kareler tamamlansa bile silmez.
 *      would-finish  yalnız yer tutucuyu kaldırır. Bu aşamaya ancak bütün
 *                    kareler önceki bir çağrıda yerleşmiş ve çağrının başında
 *                    sırayla okunmuşsa girilir.
 *  - Her kare o anki en büyük sıranın bir fazlasına yazılır: eşit sıra hiç
 *    oluşmaz (rank bir değerdir, Etsy'nin eşitlik ve sıkıştırma davranışı
 *    listing'den listing'e değişir). Her yazımdan sonra galeri geri okunur;
 *    diziliş beklenenden farklıysa koşu durur.
 *  - Yazım yalnız kaynak incelenen galeriyken ve hedefte tanınmayan görsel
 *    yokken yapılır. Hedefin durumu ve özel/açık oluşu spec'tekiyle aynı
 *    olmalı ve yazımdan sonra değişmemiş olmalı.
 *  - Kaldırılan yer tutucu Etsy'de durur: aynı uca `listing_image_id` ile
 *    yeniden bağlanabilir. Kimliği denetim kaydında.
 */

/** Bu süreden sonra yeni kare başlatılmaz; kalan iş bir sonraki çağrıda sürer. */
const DEADLINE_MS = 200_000;
const READ_BACK_TRIES = 4;
const READ_BACK_PAUSE_MS = 1200;
const IMAGE_HOST = /^https:\/\/i\.etsystatic\.com\//;

type RawListing = Record<string, unknown>;
type Gallery = { results?: LivePhoto[] };
type Bytes = Uint8Array<ArrayBuffer>;
type FrameCheck = {
  frame: number;
  image: number;
  ok: boolean;
  bytes?: number;
  size?: string;
  sha256?: string;
  error?: string;
};

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;

  const token = new URL(request.url).searchParams.get("token");
  if (!token) return false;
  const hash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data } = await admin
    .from("ops_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("purpose", "photos-copy")
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  return (data ?? []).length > 0;
}

export async function GET(request: Request) {
  const started = Date.now();
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const orgName = (url.searchParams.get("org") ?? "").trim();
  const specKey = (url.searchParams.get("spec") ?? "").trim();
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw == null ? null : Number(limitRaw);
  const specs = specFile.specs as Record<string, PhotosCopySpec>;
  const spec = Object.hasOwn(specs, specKey) ? specs[specKey] : undefined;
  if (!orgName || !spec) {
    return NextResponse.json(
      { error: "org ve geçerli spec zorunlu", specs: Object.keys(specs) },
      { status: 400 },
    );
  }
  if (limit != null && (!Number.isInteger(limit) || limit < 1)) {
    return NextResponse.json({ error: "limit pozitif tam sayı olmalı" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("name", orgName)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: `org yok: ${orgName}` }, { status: 404 });
  const orgId = (org as { id: string }).id;

  // Kaynak ve hedef aynı org'un listing'i olmalı: başka mağazanın karesi kopyalanmaz.
  const { data: prods } = await admin
    .from("products")
    .select("id, etsy_listing_id")
    .eq("org_id", orgId)
    .in("etsy_listing_id", [spec.from, spec.to]);
  const rows = (prods ?? []) as { id: string; etsy_listing_id: number | string }[];
  const sourceRow = rows.find((r) => Number(r.etsy_listing_id) === spec.from);
  const targetRow = rows.find((r) => Number(r.etsy_listing_id) === spec.to);
  if (!sourceRow || !targetRow) {
    return NextResponse.json(
      { error: "panelde-yok", from: Boolean(sourceRow), to: Boolean(targetRow) },
      { status: 404 },
    );
  }
  const productId = targetRow.id;

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(orgId);
  } catch (e) {
    return NextResponse.json({ error: "etsy not connected", detail: String(e) }, { status: 503 });
  }

  const readPhotos = async (listingId: number) =>
    (await client.get<Gallery>(etsyPaths.listingImagesRead(listingId))).results ?? [];
  const readListing = () => client.get<RawListing>(etsyPaths.listing(spec.to));

  try {
    const listing = await readListing();
    const sourcePhotos = await readPhotos(spec.from);
    const targetPhotos = await readPhotos(spec.to);

    const problems = [...specProblems(spec), ...sourceProblems(sourcePhotos, spec)];
    if ((listing.state ?? null) !== spec.targetState) {
      problems.push(`hedef: durum ${String(listing.state)} (beklenen ${spec.targetState})`);
    }
    if ((listing.is_private ?? null) !== spec.targetIsPrivate) {
      problems.push(`hedef: is_private ${String(listing.is_private)} (beklenen ${String(spec.targetIsPrivate)})`);
    }
    const plan = planPhotosCopy(targetPhotos, spec);

    // Bir karenin baytları: Etsy'nin verdiği tam boy adresten, incelenen dosyayla aynı olmalı.
    const sourceById = new Map(sourcePhotos.map((p) => [p.listing_image_id, p]));
    const fetchFrame = async (i: number): Promise<{ info: FrameCheck; data?: Bytes }> => {
      const f = spec.frames[i];
      const base = { frame: i + 1, image: f.image };
      try {
        const src = sourceById.get(f.image)?.url_fullxfull;
        if (!src) throw new Error("tam boy adres yok");
        if (!IMAGE_HOST.test(src)) throw new Error("beklenmeyen görsel adresi");
        const res = await fetch(src, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = new Uint8Array(await res.arrayBuffer());
        const dim = jpegSize(data);
        const info = {
          ...base,
          bytes: data.length,
          size: `${dim.width}x${dim.height}`,
          sha256: createHash("sha256").update(data).digest("hex"),
        };
        if (info.sha256 !== f.sha256) {
          return { info: { ...info, ok: false, error: "sha256 incelenen dosyayla tutmuyor" } };
        }
        return { info: { ...info, ok: true }, data };
      } catch (e) {
        return { info: { ...base, ok: false, error: message(e) } };
      }
    };

    const targetSummary = (l: RawListing, photos: LivePhoto[]) => ({
      state: l.state ?? null,
      isPrivate: l.is_private ?? null,
      quantity: l.quantity ?? null,
      title: decodeHtmlEntities(String(l.title ?? "")),
      photos: describePhotos(photos),
    });

    if (!apply) {
      const sourceOk = sourceProblems(sourcePhotos, spec).length === 0;
      const checks = sourceOk
        ? (await Promise.all(spec.frames.map((_, i) => fetchFrame(i)))).map((c) => c.info)
        : [];
      const bad = checks.filter((c) => !c.ok);
      return NextResponse.json({
        ok: problems.length === 0 && bad.length === 0 && sourceOk && plan.status !== "refuse",
        apply: false,
        spec: specKey,
        from: spec.from,
        to: spec.to,
        plan,
        problems,
        frames: checks,
        alts: spec.frames.map((f) => f.alt),
        target: targetSummary(listing, targetPhotos),
        source: { photos: describePhotos(sourcePhotos) },
      });
    }

    if (problems.length > 0) {
      return NextResponse.json({ ok: false, error: "yazılmadı", problems }, { status: 400 });
    }
    if (plan.status === "refuse") {
      return NextResponse.json(
        { ok: false, status: "refuse", reason: plan.reason, photos: describePhotos(targetPhotos) },
        { status: 409 },
      );
    }
    if (plan.status === "already") {
      return NextResponse.json({
        ok: true,
        apply: true,
        spec: specKey,
        status: "already",
        photos: describePhotos(targetPhotos),
      });
    }

    const shopId = await client.requireShopId();
    const layoutBefore = describePhotos(targetPhotos);
    // Fotoğraf yazımı listing'in durumuna ve özel/açık oluşuna dokunmamalı.
    const movedFields = async (): Promise<{ after: RawListing; moved: string[] }> => {
      const after = await readListing();
      const moved: string[] = [];
      if ((after.state ?? null) !== (listing.state ?? null)) moved.push("state");
      if ((after.is_private ?? null) !== (listing.is_private ?? null)) moved.push("is_private");
      return { after, moved };
    };

    if (plan.status === "would-copy") {
      const todo = limit == null ? plan.missing : plan.missing.slice(0, limit);
      // Önce baytlar: hepsi incelenen dosya çıkmadan tek kare yüklenmez.
      const fetched = await Promise.all(todo.map((i) => fetchFrame(i)));
      const bad = fetched.filter((c) => !c.info.ok || !c.data).map((c) => c.info);
      if (bad.length > 0) {
        return NextResponse.json({ ok: false, error: "kaynak baytları tutmadı", frames: bad }, { status: 400 });
      }

      let current = targetPhotos;
      let error: string | null = null;
      let outOfTime = false;
      const uploaded: {
        frame: number;
        source: number;
        image: number | null;
        rank: number;
        sha256: string;
        bytes: number;
        sentBytes: number;
      }[] = [];

      for (let n = 0; n < todo.length; n++) {
        if (Date.now() - started > DEADLINE_MS) {
          outOfTime = true;
          break;
        }
        const i = todo[n];
        const f = spec.frames[i];
        const got = fetched[n];
        try {
          const clean = stripImageMetadata(got.data as Bytes);
          const rank = nextRank(current);
          const form = new FormData();
          form.append(
            "image",
            new Blob([clean], { type: "image/jpeg" }),
            `${specKey}-${String(i + 1).padStart(2, "0")}.jpg`,
          );
          form.append("rank", String(rank));
          form.append("alt_text", f.alt);
          const up = await client.requestMultipart<{ listing_image_id?: number }>(
            "POST",
            etsyPaths.listingImages(shopId, spec.to),
            form,
          );
          uploaded.push({
            frame: i + 1,
            source: f.image,
            image: up?.listing_image_id ?? null,
            rank,
            sha256: got.info.sha256 as string,
            bytes: got.info.bytes as number,
            sentBytes: clean.length,
          });

          // Geri okuma: yeni kare listede bir an gecikebilir; dizilişte yerinde olmalı.
          let check: PhotosCopyPlan = planPhotosCopy(current, spec);
          for (let t = 0; t < READ_BACK_TRIES; t++) {
            if (t > 0) await pause(READ_BACK_PAUSE_MS);
            current = await readPhotos(spec.to);
            check = planPhotosCopy(current, spec);
            if (check.status !== "refuse" && check.present === i + 1) break;
          }
          if (check.status === "refuse" || check.present !== i + 1) {
            throw new Error(
              `kare ${i + 1} yüklendi (görsel ${up?.listing_image_id ?? "?"}) ama geri okumada diziliş tutmadı: ` +
                (check.reason ?? `yerinde ${check.present} kare`),
            );
          }
        } catch (e) {
          error = message(e);
          break;
        }
      }

      let after = current;
      let planAfter = planPhotosCopy(after, spec);
      let stateAfter: RawListing = listing;
      let moved: string[] = [];
      try {
        after = await readPhotos(spec.to);
        planAfter = planPhotosCopy(after, spec);
        const m = await movedFields();
        stateAfter = m.after;
        moved = m.moved;
      } catch (e) {
        error = error ?? `son okuma: ${message(e)}`;
      }
      const ok =
        !error &&
        moved.length === 0 &&
        planAfter.status !== "refuse" &&
        planAfter.present === plan.present + uploaded.length &&
        planAfter.placeholderPresent === plan.placeholderPresent;

      if (uploaded.length > 0 || error) {
        await logAudit(admin, {
          orgId,
          action: "etsy.image_upload",
          entityType: "product",
          entityId: productId,
          summary:
            `Fotoğraf kopyası (ops photos-copy, spec ${specKey}): listing ${spec.from} karelerinden ` +
            `${uploaded.map((u) => u.frame).join(", ") || "hiçbiri"} listing ${spec.to} üstüne yüklendi; ` +
            `geri okuma ${ok ? "doğrulandı" : `BAŞARISIZ (${(error ?? moved.join(", ")).slice(0, 160)})`}.`,
          diff: {
            from: spec.from,
            to: spec.to,
            uploaded,
            error,
            moved,
            layoutBefore,
            layoutAfter: describePhotos(after),
          },
          source: "ops/photos-copy",
        });
      }

      return NextResponse.json(
        {
          ok,
          apply: true,
          spec: specKey,
          phase: "copy",
          status: !ok ? "verify-failed" : outOfTime ? "partial" : "copied",
          uploaded,
          error,
          moved,
          next: planAfter,
          target: targetSummary(stateAfter, after),
        },
        { status: ok ? 200 : 502 },
      );
    }

    // would-finish: bütün kareler sırayla yerinde; yalnız yer tutucu kaldırılır.
    let error: string | null = null;
    let after = targetPhotos;
    try {
      await client.request("DELETE", etsyPaths.listingImage(shopId, spec.to, spec.placeholder));
      for (let t = 0; t < READ_BACK_TRIES; t++) {
        if (t > 0) await pause(READ_BACK_PAUSE_MS);
        after = await readPhotos(spec.to);
        if (!after.some((p) => p.listing_image_id === spec.placeholder)) break;
      }
    } catch (e) {
      error = message(e);
    }
    let planAfter = planPhotosCopy(after, spec);
    let stateAfter: RawListing = listing;
    let moved: string[] = [];
    try {
      if (error) after = await readPhotos(spec.to);
      planAfter = planPhotosCopy(after, spec);
      const m = await movedFields();
      stateAfter = m.after;
      moved = m.moved;
    } catch (e) {
      error = error ?? `son okuma: ${message(e)}`;
    }
    const ok = !error && moved.length === 0 && planAfter.status === "already";

    if (ok) {
      // Panel aynası: senkronun yazdığı iki alan (kapak görseli, görsel sayısı).
      const cover = byRank(after)[0]?.url_570xN;
      const upd = await admin
        .from("products")
        .update({ ...(cover ? { image_url: cover } : {}), num_images: after.length })
        .eq("org_id", orgId)
        .eq("id", productId);
      if (upd.error) console.error("photos-copy panel aynası:", upd.error.message);
    }

    await logAudit(admin, {
      orgId,
      action: "etsy.image_delete",
      entityType: "product",
      entityId: productId,
      summary:
        `Yer tutucu görsel (ops photos-copy, spec ${specKey}): listing ${spec.to}, görsel ${spec.placeholder} ` +
        `kaldırıldı; galeride ${after.length} görsel; ` +
        `geri okuma ${ok ? "doğrulandı" : `BAŞARISIZ (${(error ?? (moved.join(", ") || planAfter.reason || planAfter.status)).slice(0, 160)})`}.`,
      diff: {
        listing: spec.to,
        removed: spec.placeholder,
        restore: "aynı görsel, images ucuna listing_image_id ile gönderilerek yeniden bağlanır",
        error,
        moved,
        layoutBefore,
        layoutAfter: describePhotos(after),
      },
      source: "ops/photos-copy",
    });

    return NextResponse.json(
      {
        ok,
        apply: true,
        spec: specKey,
        phase: "finish",
        status: ok ? "finished" : "verify-failed",
        removed: spec.placeholder,
        error,
        moved,
        next: planAfter,
        target: targetSummary(stateAfter, after),
      },
      { status: ok ? 200 : 502 },
    );
  } catch (e) {
    return NextResponse.json({ ok: false, spec: specKey, error: message(e) }, { status: 500 });
  }
}
