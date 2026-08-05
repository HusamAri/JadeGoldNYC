import { notFound } from "next/navigation";

import { getBrandScope, isEonActive } from "@/lib/brand";
import { JadeMarkaKilavuzu } from "./jade-marka-kilavuzu";
import { EonMarkaKilavuzu } from "./eon-marka-kilavuzu";

export const metadata = { title: "Marka Kılavuzu" };

/**
 * Marka Kılavuzu — aktif org'a göre Jade veya EON içeriği.
 * Diğer şirketlerde rota kapalı (nav da brandBook ile gizlenir).
 */
export default async function MarkaKilavuzuPage() {
  const [eon, brand] = await Promise.all([isEonActive(), getBrandScope()]);
  if (eon) return <EonMarkaKilavuzu />;
  if (brand === "jade-gold") return <JadeMarkaKilavuzu />;
  notFound();
}
