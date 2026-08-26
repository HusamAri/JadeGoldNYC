// Yalnız tip olarak kullanılıyor — `import type` ile sabitlerin (aşağıdaki
// DEFAULT_PERSONALIZATION_QUESTIONS) istemci modülünü sürüklemesini önler.
import type { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";

/**
 * LISTING KİŞİSELLEŞTİRMESİ ("custom options") — okuma, kopyalama, doğrulama.
 *
 * Kullanıcı hammered listing'inde (4543442596) Etsy editöründen İKİ soru
 * kurmuş: iç gravür metni + çoktan seçmeli yazı tipi. Panelin oluşturma akışı
 * ise tek soru gönderiyordu, dolayısıyla sonradan açılan her listing eksik
 * kalıyor. İstenen: "hammered'daki 2 seçeneği tüm listing'lere uygula".
 *
 * Tasarım kararı — SORULARI KODA GÖMMÜYORUZ. Referans listing Etsy'den OKUNUR
 * ve aynısı hedeflere yazılır. Nedeni ikisi de sert kısıt:
 *  - Seçenek etiketlerini (yazı tipi adları) tahmin etmek "bilinmeyeni uydurma"
 *    olurdu; tek doğruluk kaynağı kullanıcının Etsy'de kurduğu hâldir.
 *  - Kullanıcı Etsy editöründe soruları değiştirdiğinde kodda sabit bir kopya
 *    sessizce bayatlar ve bir sonraki gönderim onun elle yaptığı düzenlemeyi
 *    EZER (2026-07-31'de başlıklarda tam bu yaşandı).
 *
 * Etsy sözleşmesi (canlı OpenAPI'den doğrulandı, 2026-08-04):
 *  - POST /shops/{shop_id}/listings/{listing_id}/personalization — mevcut
 *    kişiselleştirmeyi TAMAMEN DEĞİŞTİRİR (kısmi güncelleme yok).
 *  - Okuma AYRI uçtur: GET /listings/{listing_id}/personalization (shop_id yok).
 *  - `supports_multiple_personalization_questions=true` olmadan çağırmak
 *    satıcının girdiği veriyi silebilir — daima gönderilir.
 *  - question_text 1-45 karakter · dropdown seçenek etiketi ≤20 karakter ·
 *    `instructions` dropdown'da YASAK · max_allowed_characters yalnız
 *    text_input'ta · max_allowed_files yalnız *_upload tiplerinde.
 */

export type PersonalizationQuestionType =
  | "text_input"
  | "dropdown"
  | "unlabeled_upload"
  | "labeled_upload";

export interface PersonalizationOption {
  option_id?: number;
  label: string;
}

export interface PersonalizationQuestion {
  question_id?: number;
  question_text: string;
  question_type: PersonalizationQuestionType;
  required?: boolean;
  instructions?: string | null;
  max_allowed_characters?: number | null;
  max_allowed_files?: number | null;
  options?: PersonalizationOption[] | null;
}

interface PersonalizationResponse {
  personalization_questions?: PersonalizationQuestion[];
}

/** Etsy sınırları — aşan içerik 400 döndürür, önden keseriz. */
const MAX_QUESTION_TEXT = 45;
const MAX_DROPDOWN_LABEL = 20;

/**
 * YENİ listing'in açılış kişiselleştirmesi ve EON'un numaralı gravür kanonu:
 *  1. iç gravür metni — opsiyonel, 30 karakter
 *  2. "Engraving Font" — opsiyonel dropdown, blueprint ile eşleşen 4 seçenek
 *
 * Etsy dropdown etiketi en fazla 20 karakterdir. Tam "Cinzel Decorative"
 * adını korumak için sayı ile ayraç arasında boşluk kullanılmaz.
 */
const ENGRAVING_INSTRUCTIONS =
  "Optional inside-band engraving, up to 30 characters. " +
  "Select the numbered font below. Blank means no engraving.";

export const DEFAULT_PERSONALIZATION_QUESTIONS: PersonalizationQuestion[] = [
  {
    question_type: "text_input",
    question_text: "Inside band engraving (optional)",
    instructions: ENGRAVING_INSTRUCTIONS,
    required: false,
    max_allowed_characters: 30,
  },
  {
    question_type: "dropdown",
    // `instructions` dropdown'da YASAK — bilerek yok.
    question_text: "Engraving Font",
    required: false,
    options: [
      { label: "1| Prata" },
      { label: "2| Cinzel" },
      { label: "3| Cinzel Decorative" },
      { label: "4| Great Vibes" },
    ],
  },
];

/**
 * Personalization contract for the nine Intaglio 1010 recessed-channel bands.
 * A single text field avoids conflicting top and inside engraving requests,
 * while placement remains an explicit buyer choice.
 */
export const INTAGLIO_1010_PERSONALIZATION_QUESTIONS: PersonalizationQuestion[] = [
  {
    question_type: "dropdown",
    question_text: "Engraving Placement",
    required: false,
    options: [{ label: "Top Engraving" }, { label: "Inside Engraving" }],
  },
  {
    question_type: "text_input",
    question_text: "Engraving Text (optional)",
    instructions:
      "Choose one placement above. Top engraving: up to 20 characters. " +
      "Inside engraving: up to 30 characters. Blank means no engraving.",
    required: false,
    max_allowed_characters: 30,
  },
  {
    question_type: "dropdown",
    question_text: "Engraving Font",
    required: false,
    options: [
      { label: "1| Prata" },
      { label: "2| Cinzel" },
      { label: "3| Cinzel Decorative" },
      { label: "4| Great Vibes" },
    ],
  },
];

/** Tek listing'in canlı kişiselleştirmesini okur (shop_id gerekmez). */
export async function getListingPersonalization(
  client: EtsyClient,
  listingId: number,
): Promise<PersonalizationQuestion[]> {
  const res = await client.get<PersonalizationResponse>(
    etsyPaths.listingPersonalizationRead(listingId),
  );
  return res?.personalization_questions ?? [];
}

/**
 * Okunan soruları YAZILABİLİR hâle getirir: kaynağa ait kimlikler atılır
 * (question_id/option_id hedef listing'de başka bir şeye denk gelir — Etsy
 * dokümanı bu değerlerin güncellemede DEĞİŞEBİLECEĞİNİ söylüyor) ve tipe
 * uymayan alanlar temizlenir.
 */
export function normalizePersonalizationForWrite(
  questions: PersonalizationQuestion[],
): PersonalizationQuestion[] {
  return questions.map((q) => {
    const dropdown = q.question_type === "dropdown";
    const upload =
      q.question_type === "unlabeled_upload" ||
      q.question_type === "labeled_upload";
    const out: PersonalizationQuestion = {
      question_text: q.question_text.slice(0, MAX_QUESTION_TEXT),
      question_type: q.question_type,
      required: q.required ?? false,
    };
    // `instructions` dropdown'da YASAK (Etsy 400) — yalnız diğer tiplerde.
    if (!dropdown && q.instructions) out.instructions = q.instructions;
    if (q.question_type === "text_input" && q.max_allowed_characters != null) {
      out.max_allowed_characters = q.max_allowed_characters;
    }
    if (upload && q.max_allowed_files != null) {
      out.max_allowed_files = q.max_allowed_files;
    }
    if ((dropdown || q.question_type === "labeled_upload") && q.options?.length) {
      out.options = q.options.map((o) => ({
        label: dropdown ? o.label.slice(0, MAX_DROPDOWN_LABEL) : o.label,
      }));
    }
    return out;
  });
}

/**
 * Karşılaştırma anahtarı — read-back doğrulamasında kullanılır. Kimlikler ve
 * seçenek SIRASI dışındaki her şeyi kapsar; sıra Etsy'de korunduğu için
 * sırayı da anahtara dahil ediyoruz (dropdown sırası alıcıya görünür).
 */
export function personalizationKey(
  questions: PersonalizationQuestion[],
): string {
  return normalizePersonalizationForWrite(questions)
    .map((q) =>
      [
        q.question_type,
        q.question_text.trim().toLowerCase(),
        q.required ? "1" : "0",
        q.max_allowed_characters ?? "",
        (q.options ?? []).map((o) => o.label.trim().toLowerCase()).join(","),
      ].join("~"),
    )
    .join("||");
}

export interface PersonalizationApplyResult {
  ok: boolean;
  /** Doğrulanamadıysa kullanıcıya gösterilecek tek cümle. */
  detail?: string;
}

/**
 * Referans soruları hedef listing'e yazar ve AYNI TURDA geri okuyarak doğrular.
 *
 * "200 OK teslim sayılmaz" kuralı (docs/second-brain.md): POST mevcut
 * kişiselleştirmeyi tamamen değiştirdiği için yanlış/eksik yazım sessizce
 * satıcının alanlarını siler. Yazdığımızı görmeden başarı raporlanmaz.
 */
export async function applyListingPersonalization(
  client: EtsyClient,
  shopId: number,
  listingId: number,
  questions: PersonalizationQuestion[],
  opts: { verifyDelayMs?: number } = {},
): Promise<PersonalizationApplyResult> {
  const yazilacak = normalizePersonalizationForWrite(questions);
  if (yazilacak.length === 0) {
    // Boş gövde yazmak hedefteki soruları SİLER — koruma.
    return {
      ok: false,
      detail: "referans listing'de kişiselleştirme sorusu yok",
    };
  }
  await client.request(
    "POST",
    etsyPaths.listingPersonalization(shopId, listingId) +
      "?supports_multiple_personalization_questions=true",
    { personalization_questions: yazilacak },
  );

  await new Promise((r) => setTimeout(r, opts.verifyDelayMs ?? 400));
  let canli: PersonalizationQuestion[];
  try {
    canli = await getListingPersonalization(client, listingId);
  } catch (e) {
    return {
      ok: false,
      detail: `yazma sonrası okuma başarısız: ${
        e instanceof Error ? e.message.slice(0, 120) : String(e)
      }`,
    };
  }
  if (personalizationKey(canli) !== personalizationKey(yazilacak)) {
    return {
      ok: false,
      detail: `Etsy'de ${canli.length} soru okundu, ${yazilacak.length} soru beklendi (içerik farklı)`,
    };
  }
  return { ok: true };
}

/** Kısa, kullanıcıya gösterilebilir özet: "2 soru — gravür metni + yazı tipi (5 seçenek)". */
export function personalizationSummary(
  questions: PersonalizationQuestion[],
): string {
  if (questions.length === 0) return "Kişiselleştirme yok";
  const parcalar = questions.map((q) => {
    const ad = q.question_text.trim();
    if (q.question_type === "dropdown") {
      return `${ad} (${q.options?.length ?? 0} seçenek)`;
    }
    if (q.question_type === "text_input") {
      return q.max_allowed_characters
        ? `${ad} (metin, ${q.max_allowed_characters} kr)`
        : `${ad} (metin)`;
    }
    return `${ad} (${q.question_type})`;
  });
  return `${questions.length} soru — ${parcalar.join(" + ")}`;
}
