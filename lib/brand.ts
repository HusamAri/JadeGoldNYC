import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/auth";

/**
 * Platform kimliği — Amuletta.
 *
 * Panel artık çok-kiracılı bir platform: kabuk (login, kurulum, sekme başlığı,
 * manifest, kenar çubuğu kromu, renk skalası) PLATFORM markasını taşır.
 * Jade Gold NYC yalnız KENDİ organizasyonu aktifken kendi sıcak temasını ve
 * monogramını görür — diğer tüm bağlamlar Amuletta görünümündedir.
 */
export const PLATFORM_NAME = "Amuletta";
export const PLATFORM_TAGLINE =
  "Çok markalı e-ticaret yönetim platformu — satış, maliyet, performans ve şirket hafızası tek çatıda.";

export const JADE_GOLD_SLUG = "jade-gold-nyc";

/**
 * EON markası. Migrasyonlar (0087/0089/0090) EON'u `organizations.name = 'EON'`
 * ile tanır; uygulama içi geçit için slug'ı da destekleriz.
 */
export const EON_SLUG = "eon";

/**
 * Aktif organizasyon EON mu? Drive'dan görsel ekleme gibi EON'a özel yetenekler
 * yalnız EON aktifken açılır. Oturum/üyelik yoksa false.
 */
export const isEonActive = cache(async (): Promise<boolean> => {
  const m = await getMembership();
  if (!m) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("name, slug")
    .eq("id", m.org_id)
    .maybeSingle();
  const org = data as { name: string | null; slug: string | null } | null;
  if (!org) return false;
  return org.slug === EON_SLUG || (org.name ?? "").toUpperCase() === "EON";
});

export type BrandScope = "artifact" | "jade-gold";

/**
 * Aktif organizasyona göre marka kapsamı. Oturum yoksa ya da aktif şirket
 * Jade Gold değilse platform (Amuletta) kapsamı döner. Kök layout bunu
 * `<html data-brand>` olarak basar; tüm tema tokenleri bu özniteliği izler.
 */
export const getBrandScope = cache(async (): Promise<BrandScope> => {
  const m = await getMembership();
  if (!m) return "artifact";
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", m.org_id)
    .maybeSingle();
  const slug = (data as { slug: string | null } | null)?.slug;
  return slug === JADE_GOLD_SLUG ? "jade-gold" : "artifact";
});
