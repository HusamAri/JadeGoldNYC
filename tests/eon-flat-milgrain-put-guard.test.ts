import assert from "node:assert/strict";
import test from "node:test";

import { putListingInventory } from "@/lib/etsy/inventory";
import {
  buildFlatMilgrainThreeAxisInventory,
  FLAT_MILGRAIN_TARGETS,
  type FlatMilgrainPanelVariant,
} from "@/lib/etsy/eon-flat-milgrain-three-axis";
import type { EtsyClient } from "@/lib/etsy/client";
import type { EtsyInventoryUpdate } from "@/lib/etsy/types";

function payload(count: number, propertyIds: number[]): EtsyInventoryUpdate {
  return {
    products: Array.from({ length: count }, (_, index) => ({
      sku: `SKU-${index}`,
      property_values: propertyIds.map((id) => ({
        property_id: id,
        value_ids: [],
        values: [String(index)],
      })),
      offerings: [{ price: 100, quantity: 20, is_enabled: true }],
    })),
  };
}

function validPayload(): EtsyInventoryUpdate {
  const target = FLAT_MILGRAIN_TARGETS[0];
  const rows: FlatMilgrainPanelVariant[] = [];
  for (const karat of [10, 14, 18]) {
    for (let width = 2; width <= 7; width += 1) {
      for (let size = 30; size <= 130; size += 5) {
        rows.push({
          sku: `${target.skuPrefix}-${karat}-${String(width).padStart(2, "0")}-${String(size).padStart(3, "0")}`,
          active: true,
          properties: {
            Karat: `${karat}K`,
            Width: `${width} mm`,
            "Ring Size": `US ${size / 10}`,
          },
          price_cents: 64_000,
          quantity: 20,
        });
      }
    }
  }
  return buildFlatMilgrainThreeAxisInventory(target, rows, 42);
}

test("Flat Milgrain drafts reject generic or incomplete full-replacement PUTs", async () => {
  let requests = 0;
  const client = {
    request: async () => { requests += 1; },
  } as unknown as EtsyClient;
  const listingId = 4570232103;

  await assert.rejects(putListingInventory(client, listingId, payload(378, [516, 513, 514]), { legacy: false }));
  await assert.rejects(putListingInventory(client, listingId, payload(18, [516, 513]), { legacy: false, eonVerified: true }));
  await assert.rejects(putListingInventory(client, listingId, payload(378, [513, 514, 516]), { legacy: false, eonVerified: true }));
  await assert.rejects(putListingInventory(client, listingId, payload(378, [516, 513, 514]), { legacy: false, eonVerified: true }));
  assert.equal(requests, 0);
});

test("verified three-axis PUT adds Etsy's required support parameter", async () => {
  let requestedPath = "";
  const client = {
    request: async (_method: string, path: string) => { requestedPath = path; },
  } as unknown as EtsyClient;
  await putListingInventory(client, 4570232103, validPayload(), {
    legacy: false,
    eonVerified: true,
  });
  assert.equal(
    requestedPath,
    "/listings/4570232103/inventory?legacy=false&max_variations_supported=3",
  );
});
