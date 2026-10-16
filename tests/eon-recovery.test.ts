import assert from "node:assert/strict";
import test from "node:test";

import {
  CHRISTMAS_LISTING_IDS,
  fontMenuLabel,
  hasUnconfirmedHolidayDisclosure,
  repairCoreListingCopy,
} from "@/lib/etsy/eon-recovery";

const DOME =
  "Free interior engraving accommodates up to 30 characters copied exactly as entered.\n" +
  "Script is the default engraving style, while block letters are available by request.\n" +
  "Leave the personalization box blank for a clean interior.";

const FLAT =
  "ABOUT EON\n\nEON makes personalized solid gold for people who buy jewelry as something to carry forward. Every piece is made to order by our goldsmith in solid 10k or 14k gold, never plated and never filled.";

const LAUREL = "Choose a width of 7, or 8 mm from the variation menu.";

const COUNTERFORM =
  "WEIGHT NOTE\nGold weight is a pre-production estimate and may vary by approximately 10% after final CAD, casting and finishing. Final metal weight will be confirmed before the listing is approved for Etsy.\n\nNo engraving or text personalization";

test("all 17 Christmas listings are in the pause set once", () => {
  assert.equal(CHRISTMAS_LISTING_IDS.length, 17);
  assert.equal(new Set(CHRISTMAS_LISTING_IDS).size, 17);
});

test("holiday disclosure stays detectable and is not treated as a rewrite", () => {
  const copy =
    "The images are design visualizations. Final gold purity, ring sizes, measurements, weight, fit and production details will be confirmed before this design is offered for sale.";
  assert.equal(hasUnconfirmedHolidayDisclosure(copy), true);
  const repaired = repairCoreListingCopy({
    listingId: 4593654581,
    description: copy,
    fontMenu: "Engraving Font",
  });
  assert.deepEqual(repaired.changes, []);
  assert.equal(repaired.description, copy);
});

test("font menu is the live dropdown, not a guessed name", () => {
  assert.equal(
    fontMenuLabel([
      {
        question_type: "text_input",
        question_text: "Inside band engraving (optional)",
      },
      {
        question_type: "dropdown",
        question_text: "Engraving Font",
        options: [{ label: "1 Prata" }, { label: "2 Cinzel" }],
      },
    ]),
    "Engraving Font",
  );
  assert.equal(
    fontMenuLabel([
      { question_type: "text_input", question_text: "Inside engraving" },
    ]),
    null,
  );
});

test("script or block prose follows the live font menu", () => {
  const repaired = repairCoreListingCopy({
    listingId: 4539666999,
    description: DOME,
    fontMenu: "Engraving Font",
  });
  assert.deepEqual(repaired.changes, ["engraving-menu"]);
  assert.match(repaired.description, /Choose your font from the Engraving Font menu\./);
  assert.doesNotMatch(repaired.description, /script|block letters/i);
  const again = repairCoreListingCopy({
    listingId: 4539666999,
    description: repaired.description,
    fontMenu: "Engraving Font",
  });
  assert.deepEqual(again.changes, []);
});

test("engraving prose is left alone when the listing has no font menu", () => {
  const repaired = repairCoreListingCopy({
    listingId: 4539666999,
    description: DOME,
    fontMenu: null,
  });
  assert.equal(repaired.description, DOME);
  assert.deepEqual(repaired.changes, []);
});

test("white gold flat brand block includes 18K and keeps the plated exclusion", () => {
  const repaired = repairCoreListingCopy({
    listingId: 4539780408,
    description: FLAT,
    fontMenu: null,
  });
  assert.deepEqual(repaired.changes, ["metal-scope"]);
  assert.match(repaired.description, /solid 10K, 14K or 18K gold/);
  assert.match(repaired.description, /never plated or filled/);
  assert.doesNotMatch(repaired.description, /10k or 14k gold/);
});

test("laurel width sentence drops the stray comma", () => {
  const repaired = repairCoreListingCopy({
    listingId: 4569902788,
    description: LAUREL,
    fontMenu: null,
  });
  assert.equal(
    repaired.description,
    "Choose a width of 7 or 8 mm from the variation menu.",
  );
});

test("counterform drops the internal approval sentence and keeps the estimate", () => {
  const repaired = repairCoreListingCopy({
    listingId: 4561605534,
    description: COUNTERFORM,
    fontMenu: "Engraving Font",
  });
  assert.deepEqual(repaired.changes, ["internal-approval-note"]);
  assert.match(repaired.description, /pre-production estimate/);
  assert.match(repaired.description, /No engraving/);
  assert.doesNotMatch(repaired.description, /approved for Etsy/);
});
