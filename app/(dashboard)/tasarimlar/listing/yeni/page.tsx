import { requireMembership } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ListingComposer } from "@/components/listing/listing-composer";

export const metadata = { title: "Yeni Listing" };

export default async function YeniListingPage() {
  await requireMembership();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Yeni Listing"
        description="Künye + varyantlarla taslak listing oluştur; eksik gramlar bedenden, eksik fiyatlar ağırlıktan otomatik dağıtılır."
      />
      <p className="text-muted-foreground font-mono text-[11px] tracking-wide uppercase">
        Taslak panelde saklanır; Etsy&apos;ye gönderim yazma yetkisi açılınca.
      </p>
      <ListingComposer />
    </div>
  );
}
