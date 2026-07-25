/**
 * EON — tüm aktif + taslak listing'lerde kişiselleştirmeyi kanonik sete çeker
 * ve (isteğe bağlı) iç-gravür / engraving-style görselini eşitler.
 *
 * Kanon (`lib/etsy/personalization.ts`):
 *   1. text_input  "Inside band engraving (optional)"  max=30  required=false
 *   2. dropdown    "Engraving style"  Script | Block     required=false
 *
 * Sapma varsa (eski tek-soru, farklı char limiti, style yok, uzun instructions)
 * POST ile TAM SET yazılır (Etsy replace semantics).
 *
 * Görsel (`--image`):
 *   Varsayılan: sabit rank 8'e yazar (yoksa yükler, varsa silip değiştirir) —
 *   böylece ürün fotolarına dokunulmaz ve tekrar koşum duplicate açmaz.
 *   `--image-rank N` rank'ı değiştirir. `--replace-image` son görseli
 *   hedefler (rank yok sayılır; dikkat: son ürün fotosunu ezebilir).
 *
 *   npx tsx scripts/eon-sync-personalization.ts --dry-run
 *   npx tsx scripts/eon-sync-personalization.ts
 *   npx tsx scripts/eon-sync-personalization.ts \
 *     --image docs/eon/assets/engraving-style.jpg
 *
 * GERÇEK Etsy kimliği gerekir (.env.local: ETSY_API_KEY/SECRET +
 * SUPABASE_SERVICE_ROLE_KEY + SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL).
 * Ajan konteynerinde bu secret'lar YOK — local/CI veya prod env'de koş.
 */
import { readFileSync, existsSync } from "node:fs";
import { basename } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { EtsyClient } from "../lib/etsy/client";
import { etsyPaths } from "../lib/etsy/endpoints";
import {
  applyEonPersonalization,
  getListingPersonalization,
  matchesEonPersonalization,
  summarizePersonalization,
} from "../lib/etsy/personalization";

// ── .env.local (Next dışı bağlam) ─────────────────────────────────────────
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const argv = process.argv.slice(2);
const argVal = (flag: string, def: string | null = null) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const DRY = argv.includes("--dry-run");
const REPLACE_IMAGE = argv.includes("--replace-image");
const ONLY_STATES = (argVal("--states", "active,draft") ?? "active,draft")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const IMAGE_PATH = argVal("--image");
/** Engraving-style guide slot — ürün hero'larına dokunmaz, idempotent. */
const DEFAULT_ENGRAVING_IMAGE_RANK = 8;
const IMAGE_RANK = argVal("--image-rank")
  ? parseInt(argVal("--image-rank")!, 10)
  : IMAGE_PATH && !REPLACE_IMAGE
    ? DEFAULT_ENGRAVING_IMAGE_RANK
    : null;
const ORG_ARG = argVal("--org"); // uuid veya isim; varsayılan: EON adına çöz

const SUPA_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) {
  console.error(
    "SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY gerekli (.env.local).",
  );
  process.exit(1);
}

interface ShopListing {
  listing_id: number;
  title: string;
  state: string;
  url?: string;
}

interface ListingImageRaw {
  listing_image_id?: number;
  rank?: number;
  url_fullxfull?: string;
}

async function resolveOrgId(): Promise<string> {
  const admin = createClient(SUPA_URL!, SUPA_KEY!, {
    auth: { persistSession: false },
  });
  if (ORG_ARG && /^[0-9a-f-]{36}$/i.test(ORG_ARG)) return ORG_ARG;
  const name = ORG_ARG ?? "EON";
  const { data, error } = await admin
    .from("organizations")
    .select("id, name")
    .ilike("name", name)
    .maybeSingle();
  if (error || !data) {
    throw new Error(
      `Organizasyon bulunamadı (name=${name}). --org <uuid|name> verin.`,
    );
  }
  console.log(`org: ${data.name} (${data.id})`);
  return data.id as string;
}

async function fetchShopListings(
  client: EtsyClient,
  shopId: number,
  state: string,
): Promise<ShopListing[]> {
  const out: ShopListing[] = [];
  let offset = 0;
  const limit = 100;
  for (;;) {
    const res = await client.get<{
      results?: ShopListing[];
      count?: number;
    }>(etsyPaths.shopListings(shopId), { state, limit, offset });
    const batch = res.results ?? [];
    out.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
    if (offset > 12000) break;
  }
  return out;
}

async function listImages(
  client: EtsyClient,
  listingId: number,
): Promise<ListingImageRaw[]> {
  const res = await client.get<{ results?: ListingImageRaw[] }>(
    `/listings/${listingId}/images`,
  );
  return (res.results ?? []).sort(
    (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
  );
}

async function uploadImage(
  client: EtsyClient,
  shopId: number,
  listingId: number,
  bytes: Buffer,
  filename: string,
  rank: number | null,
): Promise<void> {
  const fd = new FormData();
  const blobBytes = new Uint8Array(bytes);
  fd.append(
    "image",
    new Blob([blobBytes], { type: "image/jpeg" }),
    filename.endsWith(".png") ? filename : filename.replace(/\.\w+$/, "") + ".jpg",
  );
  if (rank != null) fd.append("rank", String(rank));
  await client.requestMultipart(
    "POST",
    etsyPaths.listingImages(shopId, listingId),
    fd,
  );
}

async function deleteImage(
  client: EtsyClient,
  shopId: number,
  listingId: number,
  imageId: number,
): Promise<void> {
  await client.request(
    "DELETE",
    etsyPaths.listingImage(shopId, listingId, imageId),
  );
}

async function syncImageForListing(
  client: EtsyClient,
  shopId: number,
  listing: ShopListing,
  imageBytes: Buffer,
  filename: string,
): Promise<"uploaded" | "replaced" | "skipped" | "dry"> {
  const images = await listImages(client, listing.listing_id);

  if (IMAGE_RANK != null) {
    const atRank = images.find((i) => i.rank === IMAGE_RANK);
    if (DRY) {
      console.log(
        `  [dry] image rank=${IMAGE_RANK}: ${atRank ? "replace" : "upload"}`,
      );
      return "dry";
    }
    if (atRank?.listing_image_id) {
      await deleteImage(
        client,
        shopId,
        listing.listing_id,
        atRank.listing_image_id,
      );
      await uploadImage(
        client,
        shopId,
        listing.listing_id,
        imageBytes,
        filename,
        IMAGE_RANK,
      );
      return "replaced";
    }
    await uploadImage(
      client,
      shopId,
      listing.listing_id,
      imageBytes,
      filename,
      IMAGE_RANK,
    );
    return "uploaded";
  }

  // --replace-image: son görseli değiştir (veya yoksa yükle).
  if (REPLACE_IMAGE) {
    if (images.length === 0) {
      if (DRY) {
        console.log(`  [dry] image: upload (no images yet)`);
        return "dry";
      }
      await uploadImage(
        client,
        shopId,
        listing.listing_id,
        imageBytes,
        filename,
        null,
      );
      return "uploaded";
    }
    const last = images[images.length - 1];
    if (DRY) {
      console.log(
        `  [dry] image: replace last rank=${last.rank} id=${last.listing_image_id}`,
      );
      return "dry";
    }
    if (last.listing_image_id) {
      await deleteImage(
        client,
        shopId,
        listing.listing_id,
        last.listing_image_id,
      );
    }
    await uploadImage(
      client,
      shopId,
      listing.listing_id,
      imageBytes,
      filename,
      last.rank ?? null,
    );
    return "replaced";
  }

  // Rank yok + replace yok: sona ekle (nadir yol; normalde IMAGE_RANK set).
  if (DRY) {
    console.log(`  [dry] image: append (count=${images.length})`);
    return "dry";
  }
  await uploadImage(
    client,
    shopId,
    listing.listing_id,
    imageBytes,
    filename,
    null,
  );
  return "uploaded";
}

async function main() {
  if (IMAGE_PATH && !existsSync(IMAGE_PATH)) {
    console.error(`--image bulunamadı: ${IMAGE_PATH}`);
    process.exit(1);
  }

  const orgId = await resolveOrgId();
  const client = await EtsyClient.forOrg(orgId);
  const shopId = await client.resolveShopId();
  if (!shopId) {
    console.error("shop_id çözülemedi — Etsy bağlantısını yenileyin.");
    process.exit(1);
  }
  console.log(`shop_id=${shopId}  states=${ONLY_STATES.join(",")}  dry=${DRY}`);

  const listings: ShopListing[] = [];
  for (const state of ONLY_STATES) {
    const batch = await fetchShopListings(client, shopId, state);
    console.log(`  ${state}: ${batch.length} listing`);
    listings.push(...batch);
  }
  if (listings.length === 0) {
    console.log("Hiç listing yok — çıkılıyor.");
    return;
  }

  const imageBytes = IMAGE_PATH ? readFileSync(IMAGE_PATH) : null;
  const imageName = IMAGE_PATH ? basename(IMAGE_PATH) : "";

  let okMatch = 0;
  let updated = 0;
  let failed = 0;
  let imgUploaded = 0;
  let imgReplaced = 0;
  let imgSkipped = 0;

  for (const listing of listings) {
    const tag = `#${listing.listing_id} [${listing.state}] ${listing.title.slice(0, 56)}`;
    try {
      const current = await getListingPersonalization(
        client,
        listing.listing_id,
      );
      const match = matchesEonPersonalization(current);
      console.log(
        `\n${tag}\n  now: ${summarizePersonalization(current)}${match ? " ✓" : " ✗ mismatch"}`,
      );

      if (match) {
        okMatch++;
      } else if (DRY) {
        console.log(`  [dry] would apply canonical 30-char + Engraving style`);
        updated++;
      } else {
        await applyEonPersonalization(client, shopId, listing.listing_id);
        const after = await getListingPersonalization(
          client,
          listing.listing_id,
        );
        if (!matchesEonPersonalization(after)) {
          console.warn(
            `  yazıldı ama doğrulama geçmedi: ${summarizePersonalization(after)}`,
          );
          failed++;
        } else {
          console.log(`  → updated to canonical`);
          updated++;
        }
      }

      if (imageBytes) {
        const result = await syncImageForListing(
          client,
          shopId,
          listing,
          imageBytes,
          imageName,
        );
        if (result === "uploaded") {
          imgUploaded++;
          console.log(`  image: uploaded`);
        } else if (result === "replaced") {
          imgReplaced++;
          console.log(`  image: replaced`);
        } else if (result === "skipped") {
          imgSkipped++;
        }
      }
    } catch (e) {
      failed++;
      console.error(
        `  HATA: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  console.log(`\n── ÖZET ${DRY ? "(dry-run) " : ""}──`);
  console.log(
    `listings=${listings.length}  already_ok=${okMatch}  updated=${updated}  failed=${failed}`,
  );
  if (imageBytes) {
    console.log(
      `images: uploaded=${imgUploaded} replaced=${imgReplaced} skipped=${imgSkipped}`,
    );
  } else {
    console.log(
      "images: atlandı (--image verilmedi). İç gravür görseli için: --image <path> [--replace-image]",
    );
  }
}

main().catch((e) => {
  console.error("HATA:", e instanceof Error ? e.message : e);
  process.exit(1);
});
