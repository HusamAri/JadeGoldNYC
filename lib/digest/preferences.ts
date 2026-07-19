/**
 * Günlük özet içerik tercihleri — preference-center best practice:
 * 3–5 net kategori, yalnız gerçekten gönderilebilen seçenekler, varsayılan hepsi açık.
 */

export const DIGEST_SECTION_KEYS = [
  "performance",
  "trend",
  "actions",
  "suggestions",
  "activity",
] as const;

export type DigestSectionKey = (typeof DIGEST_SECTION_KEYS)[number];

/** Aksiyon gürültü eşiği — workflow: kritik only → kritik+önemli → hepsi. */
export type DigestActionLevel = "kritik" | "onemli" | "all";

export type DigestSections = Record<DigestSectionKey, boolean>;

export type DigestContentPrefs = {
  sections: DigestSections;
  actionLevel: DigestActionLevel;
};

export const DIGEST_SECTION_META: Record<
  DigestSectionKey,
  { label: string; description: string }
> = {
  performance: {
    label: "Son 24 saat",
    description: "Gelir, sipariş, ortalama sipariş ve önceki güne kıyas.",
  },
  trend: {
    label: "7 günlük gidişat",
    description: "NY takvimine göre günlük gelir ve sipariş tablosu.",
  },
  actions: {
    label: "Aksiyon bekleyenler",
    description: "Etsy, stok, yorum, P0 görev, bayat sync, reklam uyarıları.",
  },
  suggestions: {
    label: "Öneriler",
    description: "Reklam sinyalleri, boş gün, düşük puanlı yorum fırsatları.",
  },
  activity: {
    label: "Şirket hafızası",
    description: "Neler oldu + neler bitti (audit ve kapanan görevler).",
  },
};

export const DIGEST_ACTION_LEVEL_META: Record<
  DigestActionLevel,
  { label: string; description: string }
> = {
  kritik: {
    label: "Yalnız kritik",
    description: "Kopuk Etsy, tükenen stok, P0, bayat sync.",
  },
  onemli: {
    label: "Kritik + önemli",
    description: "Yukarıdakiler + süresi dolan listing, yorum, ekip sorusu.",
  },
  all: {
    label: "Tümü",
    description: "Bilgi seviyesindeki aksiyonlar da dahil.",
  },
};

export function defaultDigestSections(): DigestSections {
  return {
    performance: true,
    trend: true,
    actions: true,
    suggestions: true,
    activity: true,
  };
}

export function defaultDigestContentPrefs(): DigestContentPrefs {
  return {
    sections: defaultDigestSections(),
    actionLevel: "all",
  };
}

export function normalizeDigestContentPrefs(
  raw: unknown,
): DigestContentPrefs {
  const base = defaultDigestContentPrefs();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;

  const sectionsIn =
    obj.sections && typeof obj.sections === "object"
      ? (obj.sections as Record<string, unknown>)
      : obj;

  const sections = defaultDigestSections();
  for (const key of DIGEST_SECTION_KEYS) {
    if (typeof sectionsIn[key] === "boolean") {
      sections[key] = sectionsIn[key] as boolean;
    }
  }

  // En az bir bölüm açık kalsın.
  if (!DIGEST_SECTION_KEYS.some((k) => sections[k])) {
    sections.performance = true;
    sections.actions = true;
  }

  let actionLevel: DigestActionLevel = "all";
  if (
    obj.actionLevel === "kritik" ||
    obj.actionLevel === "onemli" ||
    obj.actionLevel === "all"
  ) {
    actionLevel = obj.actionLevel;
  }

  return { sections, actionLevel };
}

const SEVERITY_RANK = { kritik: 0, onemli: 1, bilgi: 2 } as const;

export function actionPassesLevel(
  severity: "kritik" | "onemli" | "bilgi",
  level: DigestActionLevel,
): boolean {
  const max =
    level === "kritik" ? 0 : level === "onemli" ? 1 : 2;
  return SEVERITY_RANK[severity] <= max;
}
