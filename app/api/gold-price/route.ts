import { NextResponse } from "next/server";

import { getGoldPricePerOunce } from "@/lib/gold-price";
import { TROY_OUNCE_GRAMS, KARAT_PURITY } from "@/lib/gold-cost";

export const revalidate = 3600; // 1 saat ISR cache

export async function GET() {
  const pricePerOunce = await getGoldPricePerOunce();
  const pricePerGram = pricePerOunce / TROY_OUNCE_GRAMS;

  return NextResponse.json({
    pricePerOunce,
    pricePerGram,
    karat14PerGram: pricePerGram * KARAT_PURITY["14K"],
    karat10PerGram: pricePerGram * KARAT_PURITY["10K"],
    updatedAt: new Date().toISOString(),
  });
}
