import {
  EON_SLUG,
  JADE_GOLD_SLUG,
  PLATFORM_NAME,
} from "@/lib/brand";
import type { DigestBrandId, DigestBrandTheme } from "@/lib/digest/types";

/**
 * Digest renkleri panel `globals.css` token’larıyla hizalı.
 * Arka plan görselleri: `public/brand/digest/` (holo-drift hissi).
 */

const AMULETTA_THEME: DigestBrandTheme = {
  id: "amuletta",
  brandName: PLATFORM_NAME,
  wordmark: "AMULETTA",
  // Light — panel :root
  accent: "#6b5bd6",
  ink: "#242835",
  muted: "#666c80",
  paper: "#eaecf3",
  surface: "#ffffff",
  card: "#f4f5fb",
  danger: "#b42318",
  warn: "#b54708",
  ok: "#027a48",
  headerBg: "#242835",
  headerInk: "#eef0f6",
  headerMuted: "#a99bff",
  border: "rgba(107,91,214,0.18)",
  bgImage: "/brand/digest/bg-amuletta-light.jpg",
  // Dark — panel .dark
  dark: {
    accent: "#a99bff",
    ink: "#eef0f6",
    muted: "#9aa0b5",
    paper: "#14161e",
    surface: "#1c1f2a",
    card: "#262935",
    danger: "#f97066",
    warn: "#fdb022",
    ok: "#5ecf9f",
    headerBg: "#0f1117",
    headerInk: "#eef0f6",
    headerMuted: "#a99bff",
    border: "rgba(169,155,255,0.22)",
    bgImage: "/brand/digest/bg-amuletta-dark.jpg",
  },
};

const JADE_THEME: DigestBrandTheme = {
  id: "jade-gold",
  brandName: "Jade Gold NYC",
  wordmark: "JADE GOLD",
  accent: "#B89347",
  ink: "#3F4A44",
  muted: "#A39F94",
  paper: "#F2EFE6",
  surface: "#FFFdf8",
  card: "#F7F4EC",
  danger: "#9B3B2E",
  warn: "#9A6B2F",
  ok: "#2F6B4F",
  headerBg: "#3F4A44",
  headerInk: "#F2EFE6",
  headerMuted: "#B89347",
  border: "rgba(184,147,71,0.28)",
  bgImage: "/brand/digest/bg-jade-light.jpg",
  dark: {
    accent: "#D4B56A",
    ink: "#F2EFE6",
    muted: "#A39F94",
    paper: "#16140f",
    surface: "#1f1c16",
    card: "#2a261e",
    danger: "#E07A6A",
    warn: "#D4A04A",
    ok: "#5ecf9f",
    headerBg: "#1a1812",
    headerInk: "#F2EFE6",
    headerMuted: "#D4B56A",
    border: "rgba(212,181,106,0.28)",
    bgImage: "/brand/digest/bg-jade-dark.jpg",
  },
};

const EON_THEME: DigestBrandTheme = {
  id: "eon",
  brandName: "EON",
  wordmark: "EON",
  accent: "#1C1C1C",
  ink: "#1C1C1C",
  muted: "#6B6B6B",
  paper: "#F5F3EF",
  surface: "#FFFFFF",
  card: "#F0EEE9",
  danger: "#8B1E1E",
  warn: "#8A5A12",
  ok: "#1F5C45",
  headerBg: "#1C1C1C",
  headerInk: "#F5F3EF",
  headerMuted: "#C8C4BC",
  border: "rgba(28,28,28,0.14)",
  bgImage: "/brand/digest/bg-jade-light.jpg",
  dark: {
    accent: "#E8E4DC",
    ink: "#F5F3EF",
    muted: "#9A9690",
    paper: "#121212",
    surface: "#1C1C1C",
    card: "#262626",
    danger: "#E07A6A",
    warn: "#D4A04A",
    ok: "#5ecf9f",
    headerBg: "#0A0A0A",
    headerInk: "#F5F3EF",
    headerMuted: "#C8C4BC",
    border: "rgba(232,228,220,0.16)",
    bgImage: "/brand/digest/bg-jade-dark.jpg",
  },
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

export function digestAssetUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  if (path.startsWith("http")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
