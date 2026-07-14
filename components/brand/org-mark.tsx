import { getActiveOrg } from "@/lib/auth";

/**
 * .idx dekoratif satırlarının marka kuyruğu — AKTİF org'un adı. "Jade Gold ·
 * NYC" gibi marka imzaları hardcode edilemez: EON panelinde Jade yazamaz.
 * Jade'de mevcut sanat yönetimi (orta nokta ayracı) aynen korunur; diğer
 * org'larda org adı gösterilir.
 */
export async function OrgMark() {
  const org = await getActiveOrg();
  if (!org) return "Amuletta";
  if (org.slug.startsWith("jade")) return "Jade Gold · NYC";
  return org.name;
}
