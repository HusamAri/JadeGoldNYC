/**
 * Koruma & Şans bölümü — içerik üretimi.
 *
 * Kaynak: `docs/jade/bolumler/protection.md` (Drive'daki marka çekirdeği +
 * Look Book Chapter I'in repo kopyası). Ses tonu ve sert kurallar oradan gelir.
 *
 * NEDEN `generateSeo` DEĞİL: `lib/seo/keyword-engine.ts` EON şeklinde kurulmuş —
 * plated/vermeil/18K sunuyor (Jade solid-only 10K/14K), sembol/bölüm farkında
 * değil ve ürettiği açıklama placeholder + sızmış Türkçe içeriyor. Oradan YALNIZ
 * tag dağıtıcısı (`selectTags` kova modeli) ve `validTag` devralınır.
 *
 * UYDURMAMA KURALI (PROJECT_INSTRUCTIONS §4 "accuracy over hype"): ölçü, ağırlık,
 * taş, zincir uzunluğu ASLA üretilmez — yalnız canlı metinden ÇIKARILIR. Çıkarım
 * başarısızsa alan `null` döner, satır düşük güvenle işaretlenir ve insan doldurur.
 * Sahte bir "18 inch" yazmak, boş bırakmaktan çok daha pahalıdır.
 */

import { selectTags, validTag, type Bucket } from "@/lib/seo/keyword-engine";

/** Bölümün sembol sözlüğü (protection.md §3). */
export type ProtectionSymbol =
  | "evil_eye"
  | "hamsa"
  | "cornicello"
  | "elephant"
  | "pharaoh"
  | "panther";

interface SymbolMeta {
  key: ProtectionSymbol;
  /** Alıcının aradığı ad — başlıkta ve tag'de bu geçer. */
  search: string;
  /** THE MEANING bölümünün gövdesi. Somut ve tarihsel; mistik satış değil. */
  meaning: string;
  /** Sembole özgü tag adayları (yamyamlığı kıran eksen). */
  tags: string[];
}

const SYMBOLS: Record<ProtectionSymbol, SymbolMeta> = {
  evil_eye: {
    key: "evil_eye",
    search: "evil eye",
    meaning:
      "The evil eye is the oldest protective mark people still wear. The blue " +
      "center is the part that does the work: it looks back. Worn from the " +
      "Mediterranean through Anatolia for the same reason for thousands of " +
      "years — you face outward so nothing lands on you.",
    tags: [
      "evil eye pendant",
      "evil eye necklace",
      "nazar necklace",
      "blue evil eye gold",
      "turkish evil eye",
      "greek evil eye charm",
    ],
  },
  hamsa: {
    key: "hamsa",
    search: "hamsa",
    meaning:
      "The hamsa is an open hand held up — a stop, not a decoration. Five " +
      "fingers for five senses, palm outward against harm. It carries the same " +
      "job across North Africa, the Levant and the Mediterranean, which is why " +
      "you see it on doorways as often as on necks.",
    tags: [
      "hamsa hand pendant",
      "hamsa necklace gold",
      "hand of fatima",
      "protection hand charm",
      "hamsa evil eye",
    ],
  },
  cornicello: {
    key: "cornicello",
    search: "cornicello",
    meaning:
      "The cornicello is the Italian horn — Naples gave it to the rest of the " +
      "world. It is handed down more often than it is bought: a grandfather " +
      "gives one when something matters. Against the malocchio, and for luck " +
      "you are expected to earn.",
    tags: [
      "italian horn pendant",
      "cornicello necklace",
      "italian horn charm",
      "corno portafortuna",
      "italian good luck",
    ],
  },
  elephant: {
    key: "elephant",
    search: "elephant",
    meaning:
      "The elephant carries strength, memory and loyalty. Trunk up is the " +
      "detail that matters — a raised trunk holds luck in rather than pouring " +
      "it out. Worn for steadiness more than for fortune.",
    tags: [
      "elephant pendant gold",
      "elephant necklace",
      "lucky elephant charm",
      "good luck elephant",
    ],
  },
  pharaoh: {
    key: "pharaoh",
    search: "pharaoh",
    meaning:
      "The pharaoh is authority worn openly — Egyptian kingship, the oldest " +
      "image of a ruler who also protects. Heavier in meaning than in metal: " +
      "you wear it when you want to be read as someone who holds their ground.",
    tags: [
      "pharaoh pendant gold",
      "egyptian pendant",
      "pharaoh necklace men",
      "egyptian king charm",
    ],
  },
  panther: {
    key: "panther",
    search: "panther",
    meaning:
      "The panther is quiet power — alert, unhurried, never announcing itself. " +
      "The stone set in the eye is the tell: the piece is watching, and that is " +
      "the whole idea.",
    tags: [
      "panther pendant gold",
      "panther necklace",
      "black panther charm",
      "big cat pendant",
    ],
  },
};

/**
 * Sembolü canlı başlıktan tanır.
 *
 * SIRA KRİTİK — spesifik olan önce: bu katalogda nazar (evil eye) ikincil bir
 * süsleme olarak başka sembollerin başlığında sıkça geçiyor
 * ("Hamsa Necklace | CZ Stone **Evil Eye** Pendant", "Hamsa Hand **Evil Eye**
 * Dangle Earrings"). Nazar önce sınanırsa bu parçalar nazar sanılır ve hem
 * yanlış anlam metni yazılır hem de tag'ler nazar kümesine yığılıp
 * yamyamlaşır. Nazar EN SONA bırakılır: diğerlerinden hiçbiri eşleşmediyse
 * parça gerçekten nazardır.
 */
export function detectSymbol(title: string): ProtectionSymbol | null {
  const t = title.toLowerCase();
  if (/hamsa|fatima/.test(t)) return "hamsa";
  if (/cornicello|italian horn/.test(t)) return "cornicello";
  if (/\belephant\b/.test(t)) return "elephant";
  if (/pharaoh|egyptian/.test(t)) return "pharaoh";
  if (/panther/.test(t)) return "panther";
  if (/evil eye|nazar/.test(t)) return "evil_eye";
  return null;
}

/**
 * Ayırt edici nitelik — AYNI sembol+form+karat üçlüsündeki kardeşleri ayırır.
 *
 * Bu bölümde dört listing birden `evil_eye/pendant/14K`; onları ancak başlıktaki
 * nitelik ayırıyor (puffed / diamond cut / dark blue / ocean blue). Tag setine
 * girmezse dördü de aynı 13 tag'i alır → `check_cross` 13/13 örtüşme = HATA.
 * Bu nitelikler aynı zamanda gerçek arama ifadeleri ("puffed evil eye").
 */
export function detectModifiers(title: string): string[] {
  const t = title.toLowerCase();
  const found: string[] = [];
  // TÜMÜ toplanır, ilk eşleşen DEĞİL: iki kardeş aynı ilk niteliği paylaşıp
  // ikincide ayrılabiliyor ("Puffed … Ocean Blue" vs "Puffed … Diamond Cut").
  // Tek nitelikle ikisi de "puffed" olur ve tag setleri birebir çakışır.
  if (/puffed/.test(t)) found.push("puffed");
  if (/diamond cut/.test(t)) found.push("diamond cut");
  if (/dark blue/.test(t)) found.push("dark blue");
  if (/ocean blue/.test(t)) found.push("ocean blue");
  if (/\bnavy\b/.test(t)) found.push("navy");
  if (/huggie/.test(t)) found.push("huggie");
  if (/dangle/.test(t)) found.push("dangle");
  return found;
}

/** Ürün formu — tag ayrıştırmasının ikinci ekseni. */
export type JadeForm = "pendant" | "necklace" | "bracelet" | "earrings";

export function detectForm(title: string): JadeForm {
  const t = title.toLowerCase();
  if (/earring|hoop|huggie|stud|dangle/.test(t)) return "earrings";
  if (/bracelet/.test(t)) return "bracelet";
  // "pendant necklace" → zincir dahil satılıyor; necklace daha doğru arama niyeti
  if (/necklace/.test(t)) return "necklace";
  return "pendant";
}

/** Karat — Jade gamı yalnız 10K/14K (18K = QA hatası). */
export function detectKarat(title: string, materials?: string[] | null): "10K" | "14K" {
  const hay = `${title} ${(materials ?? []).join(" ")}`.toLowerCase();
  return /\b10k\b/.test(hay) ? "10K" : "14K";
}

/**
 * Canlı açıklamadan ölçü/spec çıkarır. ÜRETMEZ — bulamazsa null döner.
 *
 * QA (`jade_listing_qa.py check_scale_clarity`) açıklamada somut bir mm/inç
 * ölçüsü ZORUNLU tutar; Jade'in 1 numaralı şikâyeti "fotoğraftakinden küçük
 * geldi". Ölçü bulunamayan listing düşük güvenle işaretlenir ve insan doldurur.
 */
export interface ExtractedSpecs {
  /** Charm/pendant ölçüsü, ham metin (ör. "18 x 12 mm"). */
  size: string | null;
  /** Zincir uzunlukları (ör. "16, 18, 20 inch"). */
  chainLength: string | null;
  /** Bail (askı) iç ölçüsü. */
  bail: string | null;
  /** Taş bilgisi (CZ, ruby, emerald…). */
  stone: string | null;
  /** Zincir tipi (rope, miami cuban…). */
  chainType: string | null;
}

export function extractSpecs(description: string | null): ExtractedSpecs {
  const d = description ?? "";
  const mm = d.match(/(\d+(?:\.\d+)?\s*(?:x|×)\s*\d+(?:\.\d+)?\s*mm|\d+(?:\.\d+)?\s*mm)/i);
  const inch = d.match(
    /((?:\d+(?:\.\d+)?["']?\s*[,/&]\s*)*\d+(?:\.\d+)?\s*(?:inch(?:es)?|"))/i,
  );
  const bail = d.match(/bail[^.\n]{0,60}/i);
  const stone = d.match(/\b(cubic zirconia|cz|ruby|emerald|sapphire|diamond cut|diamond)\b/i);
  const chain = d.match(/\b(rope|miami cuban|cuban|franco|figaro|box|ball|bead|curb)\s*chain\b/i);
  return {
    size: mm?.[1]?.trim() ?? null,
    chainLength: inch?.[1]?.trim() ?? null,
    bail: bail?.[0]?.trim() ?? null,
    stone: stone?.[1] ?? null,
    chainType: chain?.[1] ?? null,
  };
}

export interface CopyInput {
  etsyListingId: number;
  title: string;
  description: string | null;
  tags: string[] | null;
  materials: string[] | null;
  /** Hero ise başlığın ilk 40 karakteri ve tag kökü korunur (koruma-kurallari §1). */
  isHero: boolean;
  /**
   * Hazır çıkarılmış spec'ler. Verilmezse `description`dan çıkarılır.
   * Toplu üretimde spec'ler SQL tarafında çıkarılıp buradan geçilir — 17 tam
   * açıklamayı taşımadan aynı sonuç elde edilir.
   */
  specs?: ExtractedSpecs;
}

export interface CopyResult {
  proposedTitle: string;
  proposedDescription: string;
  proposedTags: string[];
  rationale: string;
  confidence: "dusuk" | "orta" | "yuksek";
  /** İnsanın doldurması gereken alanlar — boş değilse confidence düşer. */
  missing: string[];
  symbol: ProtectionSymbol | null;
  form: JadeForm;
  karat: "10K" | "14K";
}

const FORM_WORD: Record<JadeForm, string> = {
  pendant: "Pendant",
  necklace: "Necklace",
  bracelet: "Bracelet",
  earrings: "Earrings",
};

/**
 * Açıklama gövdesi. Ağırlık bloğu EKLENMEZ — `injectWeightBlock` push anında
 * sona ekler (bloğu burada üretmek çift blok riski doğurur).
 */
function buildDescription(
  i: CopyInput,
  sym: SymbolMeta | null,
  form: JadeForm,
  karat: "10K" | "14K",
  specs: ExtractedSpecs,
): { body: string; missing: string[] } {
  const missing: string[] = [];
  const symName = sym?.search ?? "protection charm";
  const formWord = FORM_WORD[form].toLowerCase();

  // Açılış: ~160 karakter, Etsy arama önizlemesinde görünen kısım.
  const opening =
    `Solid ${karat} gold ${symName} ${formWord} — real gold, never plated ` +
    `or filled. ${sym ? "A protective piece meant to be worn every day, not saved for one." : ""}`.trim();

  const details: string[] = [
    `Metal: solid ${karat} gold`,
    `Form: ${FORM_WORD[form]}`,
  ];
  if (specs.stone) details.push(`Stone: ${specs.stone}`);
  if (specs.chainType) details.push(`Chain: ${specs.chainType} chain`);

  const fit: string[] = [];
  if (specs.size) fit.push(`Charm measures ${specs.size}.`);
  else missing.push("ölçü (mm)");
  if (specs.chainLength) fit.push(`Chain length: ${specs.chainLength}.`);
  else if (form === "necklace") missing.push("zincir uzunluğu");
  if (specs.bail) fit.push(`${specs.bail.replace(/\s+/g, " ")}.`);

  // Ölçek netliği QA kapısı: mm/inç geçmeyen açıklama HATA verir.
  if (fit.length === 0) {
    fit.push(
      "Measurements are listed in the size chart photo — check it before ordering.",
    );
  }
  fit.push(
    "Measured without the chain unless stated; the bail is not counted in the drop.",
  );

  const meaning = sym?.meaning ?? "";

  const closing =
    `Stamped ${karat} and made in solid gold throughout — no plating to wear ` +
    `off at the edges. Wipe it with a soft cloth when it dulls; it is built to ` +
    `be worn, not stored.`;

  const body = [
    opening,
    "",
    "THE DETAILS",
    details.map((d) => `• ${d}`).join("\n"),
    "",
    "SIZE & FIT",
    fit.map((f) => `• ${f}`).join("\n"),
    ...(meaning ? ["", "THE MEANING", meaning] : []),
    "",
    closing,
  ].join("\n");

  return { body, missing };
}

/**
 * Tag seti. Yamyamlığı (check_cross ≥11/13 örtüşme = hata) kırmak için her
 * listing SEMBOL + FORM + KARAT ekseninde ayrışır; ortak "gold" kelimeleri
 * bilinçli olarak azdır.
 */
function buildTags(
  i: CopyInput,
  sym: SymbolMeta | null,
  form: JadeForm,
  karat: "10K" | "14K",
  modifiers: string[],
  angle: (typeof ANGLES)[number],
): string[] {
  const k = karat.toLowerCase();
  const symTags = sym?.tags ?? ["protection pendant"];
  const symWord = sym?.search ?? "protection";
  const formLabel = form === "earrings" ? "earrings" : FORM_WORD[form].toLowerCase();
  const fit = (s: string) => s.length <= 20 && s.includes(" ");

  // Ayırt edici nitelikler EN ÖNE — ve SPESİFİKTEN GENELE (ters sıra).
  // Sebep: iki kardeş genel niteliği paylaşıp ("puffed") yalnız spesifikte
  // ayrılıyor ("ocean blue" / "diamond cut"). Sıra düz bırakılırsa iki tag
  // yuvası da paylaşılan niteliğe gider ve setler 12/13 çakışır.
  const modTags = [...modifiers]
    .reverse()
    .flatMap((m) => [`${m} ${symWord}`, `${m} ${formLabel}`, `${m} gold charm`])
    .filter(fit);

  // Sembol kelimesi HER kovaya girer. Yoksa "nasil/kim/neden" kovaları tüm
  // bölümde birebir aynı kalır ve 13 tag'in 8'i ortak olur — sembol farklı
  // olsa bile check_cross eşiğini (≥11) tek başına aşmaya yeter.
  // İKİ KURAL AYNI ANDA SAĞLANMALI, ters yönde çekiyorlar:
  //   (a) check_cross — kardeşler arası örtüşme ≤10/13 (yoksa yamyamlık hatası)
  //   (b) kök-tekrarı — aynı kök ≥5 tag'de = slot israfı hatası
  // Sembol kelimesini her kovaya yaymak (a)'yı çözüp (b)'yi kırıyordu:
  // "panther" 11 tag'de. Doğru denge: SEMBOL yalnız `ne` kovasında (≤4 tag),
  // ayrışma ise nitelik + form + karat üzerinden diğer kovalarda sağlanır.
  const distinct = modifiers.length ? modifiers[modifiers.length - 1] : null;

  const cands: Record<Bucket, string[]> = {
    // NE — tek sembol yuvası. Nitelikli varyantlar önce (kardeşi ayırır).
    ne: [...modTags.slice(0, 2), ...symTags].filter(fit),
    // NASIL — malzeme + karat; sembol YOK. Karat/form kardeşi ayırır.
    nasil: [
      `${k} solid gold`,
      `${k} gold ${formLabel}`,
      `real gold ${formLabel}`,
      `solid gold ${formLabel}`,
    ].filter(fit),
    // STİL — nitelik burada taşınır; sembol YOK.
    stil: [
      ...(distinct ? [`${distinct} gold ${formLabel}`, `${distinct} charm`] : []),
      ...angle.stil,
      `dainty gold ${formLabel}`,
    ].filter(fit),
    // KİM — alıcı; sembol YOK. Niyet ekseninden gelir (kardeşi ayırır).
    kim: [...angle.kim, `womens gold ${formLabel}`].filter(fit),
    // NEDEN — niyet; sembol YOK. Niyet ekseninden gelir.
    neden: [...angle.neden, "good luck charm"].filter(fit),
  };

  const picked = selectTags(cands)
    .map((t) => t.text)
    .filter(validTag);

  // Hero koruması: satan tag kökü korunur — mevcut tag'ler öne alınır, yeni
  // öneriler yalnız boş slotları doldurur (koruma-kurallari §1).
  if (i.isHero && i.tags?.length) {
    const kept = i.tags.filter(validTag);
    const merged = [...kept];
    for (const t of picked) {
      if (merged.length >= 13) break;
      if (!merged.some((m) => m.toLowerCase() === t.toLowerCase())) merged.push(t);
    }
    return merged.slice(0, 13);
  }

  return picked.slice(0, 13);
}

function buildTitle(
  i: CopyInput,
  sym: SymbolMeta | null,
  form: JadeForm,
  karat: "10K" | "14K",
): string {
  // Hero: ilk 40 karakter DEĞİŞMEZ (Etsy arama eşleşmesi orada yoğunlaşır).
  if (i.isHero) return i.title;

  const symName = sym
    ? sym.search.replace(/\b\w/g, (c) => c.toUpperCase())
    : "Protection";
  // NİTELİK ZORUNLU: onsuz aynı sembol+form+karat'taki kardeşler BİREBİR aynı
  // başlığı alıyordu (QA: "başlığı AYNI" hatası, üç listing'de birden).
  const mods = detectModifiers(i.title);
  const modName = mods.length
    ? mods.map((m) => m.replace(/\b\w/g, (c) => c.toUpperCase())).join(" ") + " "
    : "";
  const base = `${karat} Solid Gold ${modName}${symName} ${FORM_WORD[form]}`;
  const tail =
    form === "necklace" || form === "pendant"
      ? ", Real Gold Protection Charm, Not Plated"
      : ", Real Gold Protection Jewelry";
  return `${base}${tail}`;
}

/**
 * Alıcı niyeti ekseni — AYNI sembol+form+karat kümesindeki kardeşleri ayırır.
 *
 * Nitelik (puffed / ocean blue) tek başına yetmiyor: katalogda "Puffed Evil Eye
 * Ocean Blue" ile "Evil Eye Ocean Blue" gibi gerçekten birbirine çok yakın iki
 * parça var. Tek listing'e bakan bir üretici bunları ayıramaz — çünkü fark
 * üründe değil, KİME satıldığında.
 *
 * Bu yüzden aynı kümedeki her listing'e sırayla farklı bir niyet ekseni verilir.
 * Bu kozmetik bir hile değil, kanibalizasyonun gerçek çözümü: aynı ürünün iki
 * varyantı aynı aramada yarışmak yerine iki ayrı alıcıyı hedefler.
 */
const ANGLES: { kim: string[]; neden: string[]; stil: string[] }[] = [
  {
    kim: ["womens gold charm", "gold charm for her"],
    neden: ["protection jewelry", "gift for her gold"],
    stil: ["dainty gold charm"],
  },
  {
    // "mens gold chain" DEĞİL: bu bölümün çoğu pendant/charm — ürünü yanlış
    // adlandıran tag alıcıyı yanlış sonuca götürür ve dönüşümü düşürür.
    kim: ["mens gold charm", "gold charm for men"],
    neden: ["good luck charm", "mens protection"],
    stil: ["bold gold charm"],
  },
  {
    kim: ["layered necklace", "stacking jewelry"],
    neden: ["amulet jewelry", "everyday jewelry"],
    stil: ["layering gold charm"],
  },
  {
    kim: ["unisex gold charm", "gift for teen"],
    neden: ["talisman necklace", "lucky jewelry"],
    stil: ["minimalist charm"],
  },
];

/** Küme anahtarı: aynı anahtardaki listingler farklı niyet ekseni alır. */
function clusterKey(i: CopyInput): string {
  return `${detectSymbol(i.title) ?? "none"}|${detectForm(i.title)}|${detectKarat(i.title, i.materials)}`;
}

/**
 * TOPLU üretim — küme farkında. Tekil `buildProtectionCopy` yerine bunu kullan:
 * yamyamlık ancak kardeşler birlikte görüldüğünde çözülebilir.
 */
export function buildProtectionBatch(inputs: CopyInput[]): CopyResult[] {
  const seen = new Map<string, number>();
  return inputs.map((i) => {
    const key = clusterKey(i);
    const idx = seen.get(key) ?? 0;
    seen.set(key, idx + 1);
    return buildProtectionCopy(i, idx);
  });
}

export function buildProtectionCopy(i: CopyInput, angleIndex = 0): CopyResult {
  const symKey = detectSymbol(i.title);
  const sym = symKey ? SYMBOLS[symKey] : null;
  const form = detectForm(i.title);
  const karat = detectKarat(i.title, i.materials);
  const specs = i.specs ?? extractSpecs(i.description);

  const modifiers = detectModifiers(i.title);
  const { body, missing } = buildDescription(i, sym, form, karat, specs);
  const tags = buildTags(i, sym, form, karat, modifiers, ANGLES[angleIndex % ANGLES.length]);
  const title = buildTitle(i, sym, form, karat);

  const oldLen = (i.description ?? "").trim().length;
  const parts: string[] = [];
  parts.push(
    `Açıklama ${oldLen} → ${body.length} karakter; bölüm iskeleti uygulandı ` +
      `(açılış / THE DETAILS / SIZE & FIT / THE MEANING).`,
  );
  if (sym) parts.push(`Sembol: ${sym.search} — anlam bölümü eklendi.`);
  if (i.isHero)
    parts.push(
      "HERO: başlık ve tag kökü korundu; yalnız açıklama derinleştirildi.",
    );
  if (missing.length)
    parts.push(`Kaynak metinde bulunamayan alan: ${missing.join(", ")} — elle doldurulmalı.`);

  const confidence: CopyResult["confidence"] = missing.length
    ? "dusuk"
    : sym
      ? "yuksek"
      : "orta";

  return {
    proposedTitle: title,
    proposedDescription: body,
    proposedTags: tags,
    rationale: parts.join(" "),
    confidence,
    missing,
    symbol: symKey,
    form,
    karat,
  };
}
