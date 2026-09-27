import Link from "next/link";
import Image from "next/image";
import { requireMembership, getActiveOrg } from "@/lib/auth";
import { catalog, assertImportAccess } from "@/lib/artifact-2027/catalog";
import { WeightButton } from "./weight-button";
import { weightPlan } from "@/lib/artifact-2027/weight-plan";
import { createClient } from "@/lib/supabase/server";
import { ImportButton } from "./import-button";
export const metadata = { title: "Artifact Studio 2027 · 20 öneri" };
export const maxDuration = 60;
export default async function Artifact2027Page() {
  const m = await requireMembership();
  const org = await getActiveOrg();
  try { assertImportAccess(org?.name, m.role); } catch {
    return <p>Bu koleksiyon için by Artifact Studio Jewelry sahibi/yöneticisi olarak doğru markayı seçin.</p>;
  }
  const db=await createClient();
  const {data: saved}=await db.from("products").select("id,listing_metadata").eq("org_id",m.org_id).in("id",catalog.map(d=>d.productId));
  const applied=saved?.length===20 && saved.every(p=>p.listing_metadata?.weightEstimatePlan?.version===weightPlan.version);
  return <div className="space-y-6 p-6">
    <h1 className="text-3xl">Artifact Studio · 2027 Color &amp; Enamel</h1>
    <p>5 yüzük · 5 kolye · 5 zincirli bileklik · 5 çift küpe. 14 ayar sarı altın ve fırın minesi tasarım yönü.</p>
    <p>Her modelde tek AI tasarım görseli (1254 × 1254). Üretim numunesi değildir. Fiyat, gramaj, beden ve fırın uygunluğu teyit bekliyor.</p>
    {!applied && <ImportButton />}
    <p>US 4–10 yarım bedenler: 65 yüzük + 15 diğer = 80 varyant. Gramlar tahmini net altındır; kolye/bileklikte zincir ve kapama, küpede çift ve arkalıklar dahil.</p>
    <p>Altın + işçilik dahil maliyet: küpe $350 · bileklik $375 · kolye $380 · yüzük $365. Kullanıcı maliyeti, 27 Eylül 2026; satış fiyatı değildir. Beden ve altın fiyatıyla otomatik değişmez.</p>
    <WeightButton />
    <Link href="/listing-onerileri" className="underline">Listing önerilerine dön</Link>
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-5">{catalog.map(d => <article key={d.id} className="rounded-xl border p-3">
      <Image unoptimized src={d.imageUrl} width={300} height={300} alt={d.alt} className="rounded-lg" />
      <h2 className="mt-3 font-semibold">{d.id} · {d.name}</h2><p>{d.tr}</p>
      <p className="text-sm">{d.title}</p><p>Tahmini altın: {weightPlan.products.find(p=>p.id===d.id)?.weightGrams} g{d.id.startsWith("R") ? " · US 7 referans" : d.id.startsWith("E") ? " · çift" : " · zincir dahil"}</p><Link className="text-sm underline" href={`/tasarimlar/listing/${d.productId}`}>Kayıtlı öneriyi aç</Link>
    </article>)}</div>
  </div>;
}
