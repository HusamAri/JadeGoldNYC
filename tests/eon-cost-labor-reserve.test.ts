import { strict as assert } from "node:assert";
import test from "node:test";

import {
  computeEonCost,
  laborUsdFor,
  type EonPricingConfig,
} from "@/lib/pricing-engine/eon-cost";

test("EON fiyat motoru yeni Alura labor tabanını ve gram oranını kullanır", () => {
  assert.equal(laborUsdFor("dome", undefined, 1), 100);
  assert.equal(laborUsdFor("dome", undefined, 5), 105);
  assert.equal(laborUsdFor("milgrain", undefined, 5), 115);
  assert.equal(laborUsdFor("hammered", undefined, 5), 135);
});

test("hesaplanan maliyetin labor satırı varyant gramına göre değişir", () => {
  const narrow = computeEonCost({ karat: "10K", profile: "milgrain", widthMm: 5, sizeUs: 7 });
  const wide = computeEonCost({ karat: "10K", profile: "milgrain", widthMm: 12, sizeUs: 13 });
  assert.equal(narrow.laborUsd, 100);
  assert.ok(wide.laborUsd > narrow.laborUsd);
  assert.ok(wide.saleCents > narrow.saleCents);
});

test("eski panel ayarı yeni rezervin üstündeyse korunur", () => {
  const config: Partial<EonPricingConfig> = {
    laborUsd: 140,
    laborHandfinishedUsd: 160,
  };
  assert.equal(laborUsdFor("flat", config as EonPricingConfig, 1), 140);
  assert.equal(laborUsdFor("hammered", config as EonPricingConfig, 1), 160);
});

test("kampanya oranı fiyat zincirine uygulanır", () => {
  const result = computeEonCost({
    karat: "10K",
    profile: "flat",
    widthMm: 5,
    sizeUs: 7,
    config: { saleRate: 0.7 },
  });
  assert.equal(result.saleCents, Math.round(result.listCents * 0.7));
  assert.equal(result.listUsd % 5, 0);
  assert.ok(result.modeledProfitUsd >= 50);
});
