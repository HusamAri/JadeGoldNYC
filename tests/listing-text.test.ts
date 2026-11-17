import { strict as assert } from "node:assert";
import test from "node:test";

import {
  planListingText,
  specProblems,
  unverifiedFields,
  type ListingTextSpec,
} from "@/lib/etsy/listing-text";
import specFile from "@/docs/artifact-studio/fix-plan-2026-11-17/listing-text.json";

/**
 * ops/listing-text. Girdi canlı listing'den: 4612132585 mesajlardan açılmış
 * özel sipariş listing'i (başlık ürün adı, açıklama yazım hatalı tek satır),
 * 4590689501 aynı ürünün mağazadaki listing'i.
 */

const PARENT_TITLE = "Elongated Cable Chain Bracelet, 3mm Links, 10K 14K 18K Solid Gold";
const spec = (specFile.specs as Record<string, ListingTextSpec>)["elongated-cable-7in"];
const live = { title: spec.expect.title, description: spec.expect.description, tags: [] as string[] };
const withSpec = (patch: Partial<ListingTextSpec>): ListingTextSpec => ({ ...spec, ...patch });

test("repodaki spec kusursuz ve canlı metne karşı yazılabilir", () => {
  assert.deepEqual(specProblems(spec, [PARENT_TITLE]), []);
  assert.deepEqual(planListingText(live, spec), {
    status: "would-write",
    fields: ["title", "description"],
  });
  assert.equal(spec.tags, undefined);
  assert.ok(!/inchches/.test(spec.description));
  assert.ok(!/free/i.test(spec.description));
});

test("başlık kuralları: kardeş listing ile aynı, 15 kelime, tekrar, uzun tire", () => {
  assert.ok(specProblems(withSpec({ title: PARENT_TITLE }), [PARENT_TITLE]).some((p) => p.includes("aynı")));
  assert.ok(
    specProblems(withSpec({ title: "a b c d e f g h i j k l m n o" }), []).some((p) => p.includes("15")),
  );
  assert.ok(
    specProblems(withSpec({ title: "Gold Bracelet, 7 Inch Gold Chain" }), []).some((p) => p.includes("tekrar")),
  );
  assert.ok(
    specProblems(withSpec({ title: "Cable Bracelet \u2013 7 Inch" }), []).some((p) => p.includes("tire")),
  );
  assert.ok(specProblems(withSpec({ title: "x".repeat(141) }), []).some((p) => p.includes("140")));
});

test("açıklama kuralları: iç not, uzun tire, eski metinle aynı", () => {
  assert.ok(
    specProblems(withSpec({ description: "DESIGN PROPOSAL \u2014 NOT READY FOR SALE. A bracelet." }), []).length > 0,
  );
  assert.ok(
    specProblems(withSpec({ description: "Made in 3\u20135 days." }), []).some((p) => p.includes("tire")),
  );
  assert.ok(
    specProblems(withSpec({ description: spec.expect.description }), []).some((p) => p.includes("eski")),
  );
});

test("tag kuralları yalnız tag verilince uygulanır", () => {
  const good = Array.from({ length: 13 }, (_, i) => `gold bracelet ${i}`);
  assert.deepEqual(specProblems(withSpec({ tags: good }), []), []);
  assert.ok(specProblems(withSpec({ tags: good.slice(0, 12) }), []).some((p) => p.includes("13")));
  assert.ok(
    specProblems(withSpec({ tags: [...good.slice(0, 12), "a tag that is far too long"] }), []).some((p) =>
      p.includes("20"),
    ),
  );
  assert.ok(
    specProblems(withSpec({ tags: [...good.slice(0, 12), "Gold Bracelet"] }), []).some((p) =>
      p.includes("büyük"),
    ),
  );
  assert.ok(
    specProblems(withSpec({ tags: [...good.slice(0, 12), good[0]] }), []).some((p) => p.includes("tekrar")),
  );
});

test("plan: hedefteki listing yeniden yazılmaz", () => {
  const done = { title: spec.title, description: spec.description, tags: [] };
  assert.deepEqual(planListingText(done, spec), { status: "already", fields: [] });
  // Etsy satır sonlarını ve entity'leri kendi biçiminde döndürür.
  const etsyShaped = {
    title: spec.title.replace("3mm", "3mm"),
    description: spec.description.replace(/\n/g, "\r\n") + "\r\n",
    tags: [],
  };
  assert.equal(planListingText(etsyShaped, spec).status, "already");
});

test("plan: sahip arada düzenlediyse yazılmaz", () => {
  const edited = { ...live, title: "Elongated Cable Chain Bracelet 7 inch custom" };
  assert.deepEqual(planListingText(edited, spec), { status: "live-changed", fields: ["title"] });
  const editedDesc = { ...live, description: "3mm Links, 10K Solid Gold, 7 inches, yellow" };
  assert.deepEqual(planListingText(editedDesc, spec), { status: "live-changed", fields: ["description"] });
});

test("plan: boşluk ve entity farkı beklenen eski metni bozmaz, yarım yazım tamamlanır", () => {
  const shaped = { title: " Elongated Cable Chain Bracelet ", description: "3mm Links, 10K Solid Gold 7 inchches", tags: [] };
  assert.equal(planListingText(shaped, spec).status, "would-write");
  const half = { title: spec.title, description: spec.expect.description, tags: [] };
  assert.deepEqual(planListingText(half, spec), { status: "would-write", fields: ["description"] });
});

test("geri okuma: entity çözülür, uymayan alan adıyla döner", () => {
  const s = withSpec({ title: "Men's Cable Bracelet, 7 Inch" });
  assert.deepEqual(
    unverifiedFields({ title: "Men&#39;s Cable Bracelet, 7 Inch", description: s.description, tags: [] }, s),
    [],
  );
  assert.deepEqual(
    unverifiedFields({ title: spec.expect.title, description: spec.description, tags: [] }, spec),
    ["title"],
  );
  const tagged = withSpec({ tags: ["b tag", "a tag"] });
  assert.deepEqual(
    unverifiedFields({ title: tagged.title, description: tagged.description, tags: ["A Tag", "b tag"] }, tagged),
    [],
  );
  assert.deepEqual(
    unverifiedFields({ title: tagged.title, description: tagged.description, tags: ["a tag"] }, tagged),
    ["tags"],
  );
});
