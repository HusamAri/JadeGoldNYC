"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";

import { isManager, MANAGER_ONLY_ERROR, requireMembership } from "@/lib/auth";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { putListingInventory } from "@/lib/etsy/inventory";
import {
  buildFlatMilgrainThreeAxisInventory,
  FLAT_MILGRAIN_ORG_ID,
  FLAT_MILGRAIN_SHOP_ID,
  getFlatMilgrainTarget,
  preflightFlatMilgrainInventory,
  validateFlatMilgrainPanelVariants,
  verifyFlatMilgrainReadback,
  type FlatMilgrainPanelVariant,
  type FlatMilgrainTarget,
} from "@/lib/etsy/eon-flat-milgrain-three-axis";
import type { EtsyInventory, EtsyInventoryUpdate } from "@/lib/etsy/types";

type PanelProduct = {
  id: string;
  sku: string | null;
  status: string | null;
  etsy_listing_id: number | null;
  num_images: number | null;
  listing_metadata: { variationAxes?: unknown } | null;
};

type PanelImage = {
  id: string;
  position: number;
  url: string;
};

type EtsyDraft = {
  listing_id: number;
  shop_id: number;
  state: string;
  num_images?: number;
  [key: string]: unknown;
};

type EtsyImage = {
  listing_image_id: number;
  listing_id?: number;
  rank?: number;
  [key: string]: unknown;
};

type EtsyImages = { results: EtsyImage[]; [key: string]: unknown };

type ReadinessDefinition = {
  readiness_state_id: number;
  readiness_state: string;
  [key: string]: unknown;
};

type ReadinessDefinitions = {
  results: ReadinessDefinition[];
  [key: string]: unknown;
};

type Snapshot = {
  product: PanelProduct;
  variants: FlatMilgrainPanelVariant[];
  panelImages: PanelImage[];
  etsyListing: EtsyDraft;
  etsyInventory: EtsyInventory;
  etsyImages: EtsyImages;
  readinessDefinitions: ReadinessDefinitions;
};

type Preflight = {
  snapshot: Snapshot;
  payload: EtsyInventoryUpdate;
  readinessStateId: number;
  mode: "upgrade" | "unchanged";
  fingerprint: string;
};

export type EonThreeAxisPreviewResult =
  | { status: "ready" | "unchanged"; token: string; listingId: number; variants: 378; images: 10 }
  | { status: "blocked"; error: string; needsReconnect?: boolean };

export type EonThreeAxisApplyResult =
  | { status: "applied" | "unchanged"; listingId: number; variants: 378; images: 10 }
  | { status: "blocked" | "uncertain"; error: string; needsReconnect?: boolean };

function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`EON Flat Milgrain: ${message}`);
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(
        ([key, nested]) => [key, canonical(nested)],
      ),
    );
  }
  return value;
}

function listingIdentity(listing: EtsyDraft) {
  // Etsy views/favorites/timestamps may change without changing this draft.
  return { listingId: listing.listing_id, shopId: listing.shop_id, state: listing.state };
}

function fingerprint(target: FlatMilgrainTarget, snapshot: Snapshot): string {
  return createHash("sha256")
    .update(JSON.stringify(canonical({
      version: 1,
      target,
      panel: {
        product: snapshot.product,
        variants: snapshot.variants,
        images: snapshot.panelImages,
      },
      etsy: {
        listing: listingIdentity(snapshot.etsyListing),
        inventory: snapshot.etsyInventory,
        images: imageIdentity(snapshot.etsyImages, target.listingId),
        readinessDefinitions: snapshot.readinessDefinitions,
      },
    })))
    .digest("hex");
}

function imageIdentity(images: EtsyImages, listingId: number): string {
  ensure(Array.isArray(images.results) && images.results.length === 10, "Etsy galerisinde tam 10 görsel gerekir");
  const seen = new Set<number>();
  const identity = images.results.map((image) => {
    ensure(Number.isSafeInteger(image.listing_image_id) && image.listing_image_id > 0, "Etsy görsel ID'si eksik");
    ensure(!seen.has(image.listing_image_id), "Etsy galerisinde mükerrer görsel ID'si var");
    ensure(image.listing_id == null || image.listing_id === listingId, "Etsy görseli farklı listing'e ait");
    seen.add(image.listing_image_id);
    return { id: image.listing_image_id, rank: image.rank ?? null };
  });
  return JSON.stringify(identity.sort((a, b) => a.id - b.id));
}

function readinessStateId(inventory: EtsyInventory, definitions: ReadinessDefinitions): number {
  ensure(Array.isArray(definitions.results), "Etsy işlem profilleri okunamadı");
  const madeToOrder = definitions.results.filter(
    (definition) => definition.readiness_state === "made_to_order" &&
      Number.isSafeInteger(definition.readiness_state_id) && definition.readiness_state_id > 0,
  );
  ensure(madeToOrder.length > 0, "doğrulanmış made_to_order işlem profili yok");
  const observed = new Set<number>();
  let missing = 0;
  for (const product of inventory.products ?? []) {
    for (const offering of product.offerings ?? []) {
      const id = (offering as typeof offering & { readiness_state_id?: number }).readiness_state_id;
      if (id == null) missing += 1;
      else observed.add(id);
    }
  }
  ensure(observed.size <= 1, "mevcut offering'lerde farklı işlem profilleri var");
  ensure(!(missing > 0 && observed.size > 0), "mevcut işlem profilleri kısmen eksik");
  if (observed.size === 1) {
    const id = [...observed][0];
    ensure(madeToOrder.some((definition) => definition.readiness_state_id === id), "mevcut işlem profili made_to_order değil");
    return id;
  }
  ensure(madeToOrder.length === 1, "birden fazla made_to_order profili var; otomatik seçim güvenli değil");
  return madeToOrder[0].readiness_state_id;
}

function safeError(error: unknown): { error: string; needsReconnect?: boolean } {
  if (error instanceof EtsyNotConnectedError) {
    return { error: "Etsy bağlantısı yok. Ayarlar'dan yeniden bağlayın.", needsReconnect: true };
  }
  if (error instanceof Error && error.message.startsWith("EON Flat Milgrain:")) {
    return { error: error.message };
  }
  if (error instanceof Error && /Etsy API hatası \(403\)/.test(error.message)) {
    return { error: "Etsy erişimi reddetti (403). listings_w iznini ve üçüncü varyasyon Preview erişimini doğrulayın." };
  }
  if (error instanceof Error && /Etsy API hatası \((?:400|422)\)/.test(error.message) && /variat|property|max_variations_supported/i.test(error.message)) {
    return { error: "Etsy üçüncü varyasyon isteğini reddetti. Mağazanın üç varyasyon Preview erişimini doğrulayın." };
  }
  return { error: "Güvenli ön kontrol tamamlanamadı. Hiçbir envanter yazımı başlatılmadı." };
}

async function authorize(productId: string): Promise<FlatMilgrainTarget> {
  const member = await requireMembership();
  ensure(isManager(member.role), MANAGER_ONLY_ERROR);
  ensure(member.org_id === FLAT_MILGRAIN_ORG_ID, "aktif şirket EON değil");
  const target = getFlatMilgrainTarget(productId);
  ensure(target, "ürün izin verilen üç Flat Milgrain taslağından biri değil");
  const access = await getEtsyWriteAccess(member.org_id);
  ensure(access.connected && access.writeEnabled, "Etsy bağlantısı/listings_w yazma izni kapalı");
  return target;
}

async function preflight(target: FlatMilgrainTarget): Promise<Preflight> {
  const admin = createAdminClient();
  const [orgResult, productResult, variantsResult, imagesResult] = await Promise.all([
    admin.from("organizations").select("id,etsy_shop_id").eq("id", FLAT_MILGRAIN_ORG_ID).maybeSingle(),
    admin.from("products")
      .select("id,sku,status,etsy_listing_id,num_images,listing_metadata")
      .eq("org_id", FLAT_MILGRAIN_ORG_ID).eq("id", target.productId).maybeSingle(),
    admin.from("product_variants")
      .select("sku,active,properties,price_cents,quantity", { count: "exact" })
      .eq("org_id", FLAT_MILGRAIN_ORG_ID).eq("product_id", target.productId)
      .order("sku").limit(1000),
    admin.from("listing_images").select("id,position,url")
      .eq("org_id", FLAT_MILGRAIN_ORG_ID).eq("product_id", target.productId)
      .order("position", { ascending: true }).order("id", { ascending: true }).limit(1000),
  ]);
  ensure(!orgResult.error && !productResult.error && !variantsResult.error && !imagesResult.error, "panel kayıtları okunamadı");
  ensure(orgResult.data?.id === FLAT_MILGRAIN_ORG_ID, "EON organizasyon kaydı bulunamadı");
  // This column is nullable in existing orgs; the connected Etsy shop is authoritative.
  ensure(
    orgResult.data.etsy_shop_id == null || orgResult.data.etsy_shop_id === FLAT_MILGRAIN_SHOP_ID,
    "EON panel mağaza kimliği beklenenden farklı",
  );
  const product = productResult.data as PanelProduct | null;
  ensure(product?.id === target.productId && product.sku === target.skuPrefix, "panel ürün kimliği/SKU farklı");
  ensure(product.status === "draft" && product.etsy_listing_id === target.listingId, "panel kaydı beklenen Etsy taslağına bağlı değil");
  ensure(
    JSON.stringify(product.listing_metadata?.variationAxes) === JSON.stringify(["Width", "Ring Size", "Karat"]),
    "panel variationAxes beklenen üç eksen değil",
  );
  ensure(variantsResult.count === 378 && variantsResult.data?.length === 378, "panelde tam 378 varyant satırı yok");
  const variants = variantsResult.data as FlatMilgrainPanelVariant[];
  validateFlatMilgrainPanelVariants(target, variants);
  // The panel-managed gallery may be empty for synced Etsy drafts. Snapshot it,
  // but the live Etsy image endpoint is authoritative for the ten-image gate.
  const panelImages = (imagesResult.data ?? []) as PanelImage[];

  const client = await EtsyClient.forOrg(FLAT_MILGRAIN_ORG_ID);
  ensure((await client.requireShopId()) === FLAT_MILGRAIN_SHOP_ID, "Etsy bağlantısı farklı mağazaya ait");
  const [etsyListing, etsyInventory, etsyImages, readinessDefinitions] = await Promise.all([
    client.get<EtsyDraft>(etsyPaths.listing(target.listingId)),
    client.get<EtsyInventory>(etsyPaths.listingInventory(target.listingId), {
      legacy: "false", show_deleted: "false", max_variations_supported: 3,
    }),
    client.get<EtsyImages>(etsyPaths.listingImagesRead(target.listingId)),
    client.get<ReadinessDefinitions>(etsyPaths.readinessStateDefinitions(FLAT_MILGRAIN_SHOP_ID)),
  ]);
  ensure(
    etsyListing.listing_id === target.listingId &&
      etsyListing.shop_id === FLAT_MILGRAIN_SHOP_ID && etsyListing.state === "draft",
    "Etsy listing kimliği/mağazası/draft durumu farklı",
  );
  imageIdentity(etsyImages, target.listingId);
  const readiness = readinessStateId(etsyInventory, readinessDefinitions);
  const payload = buildFlatMilgrainThreeAxisInventory(target, variants, readiness);
  const mode = preflightFlatMilgrainInventory(target, etsyInventory, payload, readiness);
  const snapshot: Snapshot = {
    product, variants, panelImages, etsyListing, etsyInventory, etsyImages, readinessDefinitions,
  };
  return { snapshot, payload, readinessStateId: readiness, mode, fingerprint: fingerprint(target, snapshot) };
}

/** Preview performs complete live validation, but never writes listing inventory. */
export async function previewEonFlatMilgrainThreeAxis(productId: string): Promise<EonThreeAxisPreviewResult> {
  try {
    const target = await authorize(productId);
    const checked = await preflight(target);
    return {
      status: checked.mode === "upgrade" ? "ready" : "unchanged",
      token: checked.fingerprint,
      listingId: target.listingId,
      variants: 378,
      images: 10,
    };
  } catch (error) {
    return { status: "blocked", ...safeError(error) };
  }
}

/** Only a fresh, identical preview may authorize one full 378-row draft inventory PUT. */
export async function applyEonFlatMilgrainThreeAxis(
  productId: string,
  previewToken: string,
): Promise<EonThreeAxisApplyResult> {
  let writeAttempted = false;
  try {
    const target = await authorize(productId);
    ensure(/^[a-f0-9]{64}$/.test(previewToken), "geçerli önizleme token'ı gerekir");
    const checked = await preflight(target);
    ensure(checked.fingerprint === previewToken, "önizlemeden sonra panel/Etsy verisi değişti; yeniden önizleyin");
    if (checked.mode === "unchanged") {
      return { status: "unchanged", listingId: target.listingId, variants: 378, images: 10 };
    }

    const member = await requireMembership();
    ensure(member.org_id === FLAT_MILGRAIN_ORG_ID && isManager(member.role), "işlem yetkisi değişti");
    const admin = createAdminClient();
    const { data: backup, error: backupError } = await admin.from("audit_log")
      .insert({
        org_id: FLAT_MILGRAIN_ORG_ID,
        actor_id: member.user_id,
        action: "etsy.variant_sync",
        entity_type: "products",
        entity_id: target.productId,
        source: "panel",
        summary: `PREWRITE: EON Flat Milgrain ${target.skuPrefix} Etsy draft ${target.listingId}; raw panel/Etsy snapshot`,
        diff: {
          operation: "eon_flat_milgrain_three_axis_prewrite",
          previewSha256: checked.fingerprint,
          listingId: target.listingId,
          shopId: FLAT_MILGRAIN_SHOP_ID,
          snapshot: checked.snapshot,
        },
      })
      .select("id").single();
    ensure(!backupError && backup?.id, "ham ön-yazım audit_log yedeği kaydedilemedi; işlem durduruldu");

    // Re-read both panel and Etsy after the durable backup, not only Etsy.
    const final = await preflight(target);
    ensure(
      final.mode === "upgrade" && final.fingerprint === previewToken,
      "panel/Etsy verisi son kontrolde değişti; yeniden önizleyin",
    );
    const client = await EtsyClient.forOrg(FLAT_MILGRAIN_ORG_ID);
    ensure((await client.requireShopId()) === FLAT_MILGRAIN_SHOP_ID, "Etsy mağaza bağlantısı değişti");

    writeAttempted = true;
    await putListingInventory(client, target.listingId, final.payload, {
      legacy: false,
      eonVerified: true,
    });

    const [afterInventory, afterListing, afterImages] = await Promise.all([
      client.get<EtsyInventory>(etsyPaths.listingInventory(target.listingId), {
        legacy: "false", show_deleted: "false", max_variations_supported: 3,
      }),
      client.get<EtsyDraft>(etsyPaths.listing(target.listingId)),
      client.get<EtsyImages>(etsyPaths.listingImagesRead(target.listingId)),
    ]);
    verifyFlatMilgrainReadback(target, afterInventory, final.payload, final.readinessStateId);
    ensure(
      afterListing.listing_id === target.listingId && afterListing.shop_id === FLAT_MILGRAIN_SHOP_ID &&
        afterListing.state === "draft",
      "Etsy taslak durumu geri okumada doğrulanamadı",
    );
    ensure(imageIdentity(afterImages, target.listingId) === imageIdentity(final.snapshot.etsyImages, target.listingId), "Etsy galeri görselleri değişti");
    revalidatePath(`/tasarimlar/listing/${target.productId}`);
    return { status: "applied", listingId: target.listingId, variants: 378, images: 10 };
  } catch (error) {
    if (writeAttempted) {
      return {
        status: "uncertain",
        error: "Etsy envanter yazımı denenmiş olabilir; sonucu belirsiz. Yeniden çalıştırmayın, Etsy taslağını ve audit_log yedeğini bağımsız okuyun.",
      };
    }
    return { status: "blocked", ...safeError(error) };
  }
}
