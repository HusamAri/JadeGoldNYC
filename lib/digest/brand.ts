import {
  EON_SLUG,
  JADE_GOLD_SLUG,
  PLATFORM_NAME,
} from "@/lib/brand";
import type { DigestBrandId, DigestBrandTheme } from "@/lib/digest/types";

const JADE_THEME: DigestBrandTheme = {
  id: "jade-gold",
  brandName: "Jade Gold NYC",
  accent: "#B89347",
  ink: "#3F4A44",
  muted: "#A39F94",
  paper: "#F2EFE6",
  surface: "#FFFFFF",
  danger: "#9B3B2E",
  warn: "#9A6B2F",
  ok: "#2F6B4F",
  wordmark: "JADE GOLD",
};

const AMULETTA_THEME: DigestBrandTheme = {
  id: "amuletta",
  brandName: PLATFORM_NAME,
  accent: "#6B5BD6",
  ink: "#242835",
  muted: "#666C80",
  paper: "#EAECF3",
  surface: "#FFFFFF",
  danger: "#B42318",
  warn: "#B54708",
  ok: "#027A48",
  wordmark: "AMULETTA",
};

const EON_THEME: DigestBrandTheme = {
  id: "eon",
  brandName: "EON",
  accent: "#1C1C1C",
  ink: "#1C1C1C",
  muted: "#6B6B6B",
  paper: "#F5F3EF",
  surface: "#FFFFFF",
  danger: "#8B1E1E",
  warn: "#8A5A12",
  ok: "#1F5C45",
  wordmark: "EON",
};

export function resolveDigestBrand(
  slug: string | null | undefined,
  orgName: string,
): DigestBrandTheme {
  const s = (slug ?? "").toLowerCase();
  const name = (orgName ?? "").toUpperCase();
  if (s === JADE_GOLD_SLUG) return JADE_THEME;
  if (s === EON_SLUG || name === "EON") return EON_THEME;
  return {
    ...AMULETTA_THEME,
    brandName: orgName?.trim() || PLATFORM_NAME,
    wordmark: (orgName?.trim() || PLATFORM_NAME).toUpperCase(),
  };
}

export function brandIdFromTheme(theme: DigestBrandTheme): DigestBrandId {
  return theme.id;
}
