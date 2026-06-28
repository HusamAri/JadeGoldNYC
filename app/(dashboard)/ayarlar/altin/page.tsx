import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

import { getGoldSettings } from "@/lib/db/queries/gold-settings";
import { getGoldPricePerOunce } from "@/lib/gold-price";
import { TROY_OUNCE_GRAMS, KARAT_PURITY } from "@/lib/gold-cost";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoldSettingsForm } from "./settings-form";

export const metadata = { title: "Altın Ayarları" };

export default async function AltinAyarlarPage() {
  const [settings, goldPriceOunce] = await Promise.all([
    getGoldSettings(),
    getGoldPricePerOunce(),
  ]);

  const goldPricePerGram = goldPriceOunce / TROY_OUNCE_GRAMS;
  const gold14kPerGram = goldPricePerGram * KARAT_PURITY["14K"];
  const gold10kPerGram = goldPricePerGram * KARAT_PURITY["10K"];

  const labor14k =
    settings.purchase_price_14k_cents / 100 - gold14kPerGram;
  const labor10k =
    settings.purchase_price_10k_cents / 100 - gold10kPerGram;
  const markup14k =
    gold14kPerGram > 0 ? (labor14k / gold14kPerGram) * 100 : 0;
  const markup10k =
    gold10kPerGram > 0 ? (labor10k / gold10kPerGram) * 100 : 0;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Altin Ayarlari"
        description="Tedarikciden gram basi alim fiyatlari ve iscilik orani yapilandirmasi"
        action={
          <Button asChild variant="outline">
            <Link href="/ayarlar">
              <ArrowLeft />
              Ayarlar
            </Link>
          </Button>
        }
      />

      {/* ── Güncel Fiyat Bilgisi ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="size-4" />
            Guncel Altin Piyasasi
          </CardTitle>
          <CardDescription>
            Canli altin fiyati otomatik olarak API&apos;den cekilmektedir
            (metals.dev / metals.live). Anahtar gerekmez.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Altin Ons Fiyati</dt>
            <dd className="font-semibold tabular-nums">
              ${goldPriceOunce.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </dd>
            <dt className="text-muted-foreground">24K Gram</dt>
            <dd className="font-semibold tabular-nums">
              ${goldPricePerGram.toFixed(2)}
            </dd>
            <dt className="text-muted-foreground">14K Gram Degeri</dt>
            <dd className="font-semibold tabular-nums">
              ${gold14kPerGram.toFixed(2)}
            </dd>
            <dt className="text-muted-foreground">10K Gram Degeri</dt>
            <dd className="font-semibold tabular-nums">
              ${gold10kPerGram.toFixed(2)}
            </dd>
          </dl>
        </CardContent>
      </Card>

      {/* ── Alım Fiyatı Ayarları ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Tedarikciden Alim Fiyatlari
          </CardTitle>
          <CardDescription>
            Her ayar icin gram basi tedarikciye odenen alim fiyati (USD).
            Iscilik = Alim fiyati − Altin degeri olarak hesaplanir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoldSettingsForm
            price14k={settings.purchase_price_14k_cents / 100}
            price10k={settings.purchase_price_10k_cents / 100}
          />
        </CardContent>
      </Card>

      {/* ── Hesaplanan İşçilik Özeti ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hesaplanan Iscilik Oranlari</CardTitle>
          <CardDescription>
            Alim fiyatindan altin degerini cikararak otomatik hesaplanir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <dt className="text-muted-foreground">14K Iscilik (gram)</dt>
            <dd className="font-semibold tabular-nums">
              ${labor14k.toFixed(2)} (%{markup14k.toFixed(1)})
            </dd>
            <dt className="text-muted-foreground">10K Iscilik (gram)</dt>
            <dd className="font-semibold tabular-nums">
              ${labor10k.toFixed(2)} (%{markup10k.toFixed(1)})
            </dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
