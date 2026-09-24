type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

export interface DraftStagingData {
  sku?: string;
  quantity?: number;
  weightSource?: "manual" | "estimated";
  metadata: JsonObject;
}

interface StagingContext {
  listingProtocol: string;
  productType: string;
  variationAxes: string[];
}

type StagingResult = { data: DraftStagingData; error?: never } | { error: string; data?: never };

const MAX_STAGING_BYTES = 256 * 1024;
const metadataKeys = new Set([
  "protocolVersion", "productType", "listingProtocol", "section", "fixedMetal",
  "dimensions", "variationAxes", "taxonomy", "production", "pricing",
  "contentTranslations", "materials", "materialTags", "goldSolidity", "research",
  "imagePlan", "approval", "ownerOverrides", "sourcePackage", "manifestSha256",
  "listingCostMeaning", "variantPricing",
]);
const approvalBooleanKeys = new Set([
  "ownerApprovalRequiredForEtsy", "panelCreationAuthorized", "etsyDraftCreationAuthorized",
  "livePublicationAuthorized", "imageReviewCompleted", "priceReadyForEtsy",
  "cogsReadbackVerified", "marketResearchReadbackVerified", "sourceWeightMethodApprovedByOwner",
  "ownerDelegatedImageQa",
]);

function object(value: unknown, label: string): asserts value is JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} bir JSON nesnesi olmalı.`);
  }
}

function knownKeys(value: JsonObject, allowed: Set<string>, label: string) {
  const unknown = Object.keys(value).find((key) => !allowed.has(key));
  if (unknown) throw new Error(`${label}: desteklenmeyen alan ${unknown}.`);
}

/** Bounds apply recursively, including nested research/taxonomy evidence. */
function boundedJson(value: unknown) {
  let nodes = 0;
  function visit(item: unknown, depth: number) {
    nodes += 1;
    if (nodes > 20_000 || depth > 10) throw new Error("Taslak JSON'u fazla büyük veya iç içe.");
    if (item === null || typeof item === "boolean") return;
    if (typeof item === "string") {
      if (item.length > 30_000) throw new Error("Taslak JSON'unda bir metin 30000 karakteri aşıyor.");
      return;
    }
    if (typeof item === "number") {
      if (!Number.isFinite(item)) throw new Error("Taslak JSON'unda sayı sonlu olmalı.");
      return;
    }
    if (Array.isArray(item)) {
      if (item.length > 1000) throw new Error("Taslak JSON'unda bir dizi 1000 öğeyi aşıyor.");
      for (const child of item) visit(child, depth + 1);
      return;
    }
    object(item, "Taslak alanı");
    const entries = Object.entries(item);
    if (entries.length > 200) throw new Error("Taslak JSON'unda bir nesne 200 alanı aşıyor.");
    for (const [key, child] of entries) {
      if (key.length > 100 || ["__proto__", "prototype", "constructor"].includes(key)) {
        throw new Error("Taslak JSON'unda geçersiz alan adı.");
      }
      visit(child, depth + 1);
    }
  }
  visit(value, 0);
}

/** Optional metadata for NEW panel drafts; never controls org, state, IDs or Etsy writes. */
export function parseDraftStagingJson(text: string | undefined, context: StagingContext): StagingResult {
  if (text === undefined) return { data: { metadata: {} } };
  if (typeof text !== "string") return { error: "Taslak JSON'u metin olarak girilmeli." };
  if (!text.trim()) return { data: { metadata: {} } };
  try {
    if (new TextEncoder().encode(text).byteLength > MAX_STAGING_BYTES) {
      throw new Error("Taslak JSON'u 256 KB'ı aşamaz.");
    }
    const input: unknown = JSON.parse(text);
    object(input, "Taslak JSON'u");
    boundedJson(input);
    knownKeys(input, new Set(["sku", "quantity", "weightSource", "metadata"]), "Taslak JSON'u");
    const result: DraftStagingData = { metadata: {} };
    if (input.sku !== undefined) {
      if (typeof input.sku !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/.test(input.sku)) {
        throw new Error("Üst SKU 1–32 harf, sayı, nokta, alt çizgi veya tire içermeli.");
      }
      result.sku = input.sku;
    }
    if (input.quantity !== undefined) {
      if (typeof input.quantity !== "number" || !Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 999) {
        throw new Error("Taslak adedi 1–999 arasında tam sayı olmalı.");
      }
      result.quantity = input.quantity;
    }
    if (input.weightSource !== undefined) {
      if (input.weightSource !== "manual" && input.weightSource !== "estimated") {
        throw new Error("Ağırlık kaynağı manual veya estimated olmalı.");
      }
      result.weightSource = input.weightSource;
    }
    if (input.metadata === undefined) return { data: result };
    object(input.metadata, "metadata");
    const metadata = input.metadata;
    knownKeys(metadata, metadataKeys, "metadata");
    for (const key of ["dimensions", "taxonomy", "production", "pricing", "contentTranslations", "fixedMetal", "approval"]) {
      if (metadata[key] !== undefined) object(metadata[key], `metadata.${key}`);
    }
    for (const [key, expected] of [["listingProtocol", context.listingProtocol], ["productType", context.productType]] as const) {
      if (metadata[key] !== undefined && metadata[key] !== expected) {
        throw new Error(`metadata.${key}, formda seçilen ürün tipiyle eşleşmiyor.`);
      }
    }
    if (metadata.variationAxes !== undefined && JSON.stringify(metadata.variationAxes) !== JSON.stringify(context.variationAxes)) {
      throw new Error("metadata.variationAxes, formdaki eksen adları ve sırasıyla eşleşmeli.");
    }
    if (metadata.approval !== undefined) {
      const approval = metadata.approval as JsonObject;
      knownKeys(approval, new Set([...approvalBooleanKeys, "status", "blockers"]), "metadata.approval");
      for (const key of approvalBooleanKeys) {
        if (approval[key] !== undefined && typeof approval[key] !== "boolean") {
          throw new Error(`metadata.approval.${key} true veya false olmalı.`);
        }
      }
      if (approval.etsyDraftCreationAuthorized === true || approval.livePublicationAuthorized === true) {
        throw new Error("Bu alan yalnız panel taslağı içindir; Etsy taslak/yayın izni true olamaz.");
      }
      if (approval.status !== undefined && (typeof approval.status !== "string" || approval.status.length > 200)) {
        throw new Error("Taslak onay durumu en fazla 200 karakter olmalı.");
      }
      if (approval.blockers !== undefined && (!Array.isArray(approval.blockers) || approval.blockers.length > 100 || approval.blockers.some((item) => typeof item !== "string" || item.length > 1000))) {
        throw new Error("Taslak engelleri en fazla 100 kısa metinden oluşmalı.");
      }
    }
    // Retain source evidence exactly; no verified/ready flags are invented here.
    result.metadata = metadata;
    return { data: result };
  } catch (error) {
    return { error: error instanceof SyntaxError ? "Taslak JSON'u geçersiz." : error instanceof Error ? error.message : "Taslak JSON'u doğrulanamadı." };
  }
}
