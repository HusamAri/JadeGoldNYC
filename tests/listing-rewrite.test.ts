import { strict as assert } from "node:assert";
import test from "node:test";
import { readFileSync } from "node:fs";

import {
  planAttributes,
  parsePersonalization,
  splitMaterials,
  parseQuantity,
  type TaxonomyProperty,
} from "@/lib/etsy/listing-rewrite";

const PROPS: TaxonomyProperty[] = [
  { property_id: 507, name: "Materials", is_multivalued: true, max_values_allowed: 5,
    possible_values: [{ value_id: 1, name: "Gold" }, { value_id: 2, name: "Ruby" }] },
  { property_id: 600, name: "Gold purity", possible_values: [{ value_id: 10, name: "10k" }, { value_id: 14, name: "14k" }] },
  { property_id: 601, name: "Occasion", is_multivalued: true, max_values_allowed: 5,
    possible_values: [{ value_id: 20, name: "Anniversary" }, { value_id: 21, name: "Birthday" }, { value_id: 22, name: "Everyday" }] },
  { property_id: 602, name: "Bracelet width", scales: [{ scale_id: 5, display_name: "Millimeters" }, { scale_id: 6, display_name: "Inches" }] },
  { property_id: 603, name: "Bracelet length", scales: [{ scale_id: 6, display_name: "Inches" }] },
  { property_id: 604, name: "Gemstone", possible_values: [{ value_id: 30, name: "Ruby" }] },
  { property_id: 605, name: "Can be personalized", possible_values: [{ value_id: 40, name: "Yes" }, { value_id: 41, name: "No" }] },
  { property_id: 606, name: "Gem color", possible_values: [{ value_id: 50, name: "Red" }] },
];

test("evil eye red: Ruby düşer, varyasyon atlanır, ölçek mm, atölye alanına dokunulmaz", () => {
  const plan = planAttributes(
    {
      Materials: "Gold",
      "Gold purity": "14k",
      Occasion: "Anniversary, Birthday, Everyday",
      "Bracelet width": "9 mm",
      "Bracelet length": "6.5, 7 or 7.5 inches (variation)",
      Gemstone: "leave unset until the workshop confirms the stone",
      "Gem color": "Red",
      Closure: "Lobster claw",
    },
    PROPS,
    [
      { property_id: 507, value_ids: [1, 2], values: ["Gold", "Ruby"] },
      { property_id: 600, value_ids: [14], values: ["14k"] },
      { property_id: 606, value_ids: [50], values: ["Red"] },
    ],
  );
  const set = Object.fromEntries(plan.set.map((s) => [s.key, s]));
  assert.deepEqual(set.Materials.value_ids, [1]); // Ruby kaldırıldı
  assert.deepEqual(set.Occasion.value_ids, [20, 21, 22]);
  assert.deepEqual([set["Bracelet width"].values, set["Bracelet width"].scale_id], [["9"], 5]);
  assert.ok(plan.unchanged.includes("Gold purity") && plan.unchanged.includes("Gem color"));
  const why = Object.fromEntries(plan.skipped.map((s) => [s.key, s.reason]));
  assert.match(why["Bracelet length"], /variation/);
  assert.match(why.Gemstone, /workshop/);
  assert.match(why.Closure, /not offered/);
  assert.equal(plan.clear.length, 0);
});

test("none boşaltır; parantezli Yes çözülür; listede olmayan değer atlanır", () => {
  const plan = planAttributes(
    { Gemstone: "none", "Can be personalized": "Yes (inside engraving)", "Gold purity": "10k, 14k, 18k (per variation)", Materials: "Platinum" },
    PROPS,
    [{ property_id: 604, value_ids: [30], values: ["Ruby"] }],
  );
  assert.deepEqual(plan.clear.map((c) => c.key), ["Gemstone"]);
  assert.deepEqual(plan.set.map((s) => [s.key, s.value_ids]), [["Can be personalized", [40]]]);
  const why = Object.fromEntries(plan.skipped.map((s) => [s.key, s.reason]));
  assert.match(why["Gold purity"], /variation/);
  assert.match(why.Materials, /not in Etsy's list: Platinum/);
});

test("kişiselleştirme metni soruya çevrilir", () => {
  assert.equal(parsePersonalization("none"), null);
  const a = parsePersonalization("Inside engraving (optional): up to 10 characters, letters, numbers, dots, <3 for a heart")!;
  assert.deepEqual([a.question_text, a.required, a.max_allowed_characters], ["Inside engraving (optional)", false, 10]);
  assert.equal(a.instructions, "Up to 10 characters, letters, numbers, dots, <3 for a heart");
  const b = parsePersonalization("Initial (one uppercase letter A to Z), required")!;
  assert.deepEqual([b.question_text, b.required, b.max_allowed_characters, b.instructions], ["Initial", true, 1, "One uppercase letter A to Z"]);
  const c = parsePersonalization("Face engraving (optional): initials or a monogram, up to 4 characters")!;
  assert.deepEqual([c.required, c.max_allowed_characters], [false, 4]);
});

test("gerçek JSON: 41 kişiselleştirme alanı çözülür, materials kuralı yalnız tireyi reddeder", () => {
  const L = JSON.parse(readFileSync("docs/artifact-studio/etsy-rewrite/listings_rewrite.json", "utf8")).listings;
  assert.equal(L.length, 41);
  const parsed = L.map((l: { new: { personalization_field: string } }) => parsePersonalization(l.new.personalization_field));
  assert.equal(parsed.filter(Boolean).length, 8);
  for (const q of parsed.filter(Boolean)) assert.ok(q!.question_text.length > 0 && q!.max_allowed_characters <= 256);
  const rejected = L.flatMap((l: { new: { materials_tags: string[] } }) => splitMaterials(l.new.materials_tags).rejected);
  assert.deepEqual(rejected, ["Lab-grown diamond"]);
  assert.deepEqual(L.map((l: { settings: { quantity: string } }) => parseQuantity(l.settings.quantity)).filter((q: number | null) => q !== 20), []);
});

test("çok değerli nitelikte listede olmayan değer atlanır, eşleşenler yazılır", () => {
  const plan = planAttributes({ Occasion: "Anniversary, Birthday, Weekday", "Gold purity": "15k" }, PROPS, []);
  assert.deepEqual(plan.set.map((s) => [s.key, s.value_ids]), [["Occasion", [20, 21]]]);
  const why = plan.skipped.map((s) => `${s.key}: ${s.reason}`);
  assert.deepEqual(why, ["Occasion: not in Etsy's list: Weekday", "Gold purity: not in Etsy's list: 15k"]);
});
