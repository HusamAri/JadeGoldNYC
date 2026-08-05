import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  listDiscountBundles,
  listBundleProductOptions,
} from "@/lib/db/queries/discount-bundles";
import { PageHeader } from "@/components/page-header";
import { OrgMark } from "@/components/brand/org-mark";
import { Card, CardContent } from "@/components/ui/card";
import { BundleManager } from "@/components/discount/bundle-manager";

export const metadata = { title: "İndirimler" };

export default async function IndirimlerPage() {
  const m = await requireMembership();
  const supabase = await createClient();
  const [orgRes, bundles, products] = await Promise.all([
    supabase
      .from("organizations")
      .select("default_currency")
      .eq("id", m.org_id)
      .maybeSingle(),
    listDiscountBundles(m.org_id),
    listBundleProductOptions(m.org_id),
  ]);
  const currency =
    (orgRes.data as { default_currency: string | null } | null)
      ?.default_currency ?? "USD";
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="page-stack pb-32">
      <PageHeader
        title="İndirimler"
        description="Paket indirimleri — iki ürünü eşle. Listing indirimi (yüzde, tarih aralığı, min. sepet) her listing'in kendi sayfasında."
      />

      <div aria-hidden className="idx -mb-3">
        <span>İndirimler / 01 · Paket indirimleri</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span>
          <OrgMark />
        </span>
      </div>
      <Card>
        <CardContent>
          <BundleManager
            bundles={bundles}
            products={products}
            currency={currency}
            todayIso={todayIso}
          />
        </CardContent>
      </Card>
    </div>
  );
}
