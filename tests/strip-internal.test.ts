import { test } from "node:test";
import assert from "node:assert/strict";

import { stripInternalNotes, stripPublicDescription, INTERNAL_RE } from "../lib/etsy/strip-internal";

// Real lines from live listings (panel mirror of Etsy, 2026-10-31) -> expected line.
// "" = the line goes.
const LINES: [string, string][] = [
  // EON Christmas collection (English + Spanish), 17 active listings.
  ["An individual, minimalist ring concept with a continuous closed band, designed for delicate stacking. The motif is expressed entirely in metal, without gemstones or enamel.",
   "An individual, minimalist ring with a continuous closed band, designed for delicate stacking. The motif is expressed entirely in metal, without gemstones or enamel."],
  ["• Intended metal: Yellow and white gold", "• Metal: Yellow and white gold"],
  ["Shown as a single ring. Final gold purity, ring sizes, measurements, weight, fit and production details will be confirmed before this design is offered for sale.",
   "Shown as a single ring."],
  ["Un concepto de anillo individual y minimalista con aro cerrado continuo, pensado para combinar en capas delicadas. El motivo se expresa únicamente en metal, sin piedras ni esmalte.",
   "Un anillo individual y minimalista con aro cerrado continuo, pensado para combinar en capas delicadas. El motivo se expresa únicamente en metal, sin piedras ni esmalte."],
  ["• Metal previsto: Oro amarillo y blanco", "• Metal: Oro amarillo y blanco"],
  ["Se muestra un solo anillo. La ley del oro, las tallas, las medidas, el peso, el ajuste y los detalles de producción se confirmarán antes de poner este diseño a la venta.",
   "Se muestra un solo anillo."],
  ["- The integrated motif shows five petals with folds and raised lines, as seen in the design image.",
   "- The integrated motif shows five petals with folds and raised lines, as seen in the listing image."],
  ["- The intended metal is yellow gold; gold karat and ring size are selected from the listing variations.",
   "- The metal is yellow gold; gold karat and ring size are selected from the listing variations."],
  ["- Sizes, final karat, measurements, weight, fit and production details will be confirmed before the design is offered for sale.", ""],
  ["A Christmas-inspired poinsettia ring that also works with everyday stacks. Final specifications will be confirmed before sale.",
   "A Christmas-inspired poinsettia ring that also works with everyday stacks."],
  ["- The listing is for one ring, made to order; final production details are confirmed before the design is offered for sale.",
   "- The listing is for one ring, made to order."],
  ["- The listed materials are yellow and white gold; final gold purity will be confirmed before this design is offered for sale.",
   "- The listed materials are yellow and white gold."],
  ["- Ring size is selected from the available variation options, and final measurements, weight, and fit will be confirmed before the design is offered for sale.",
   "- Ring size is selected from the available variation options."],
  ["- Choose your ring size and gold karat from the available options; final details will be confirmed before the design is offered for sale.",
   "- Choose your ring size and gold karat from the available options."],
  ["This Christmas gold ring is part of the EON Christmas Collection and recalls the evergreen fir. Measurements, weight, fit and production details are not yet specified; they will be confirmed before the design is available.",
   "This Christmas gold ring is part of the EON Christmas Collection and recalls the evergreen fir."],
  // EON Quiet Bevel and weight lines.
  ["• Design target thickness: approximately 1.5 mm", "• Thickness: approximately 1.5 mm"],
  ["- The design target thickness is approximately 1.8 mm, and the width remains fixed at approximately 6.0 mm.",
   "- The thickness is approximately 1.8 mm, and the width remains fixed at approximately 6.0 mm."],
  ["- Weight figures are pre-production estimates based on the design target.", ""],
  ["Gold weight is a pre-production estimate and may vary by approximately 10% after final CAD, casting and finishing.",
   "Gold weight is an estimate and may vary by approximately 10% after casting and finishing."],
  ["- The estimated finished weight at US size 7 is approximately 2.75 g and may vary by about 10% after final CAD, casting, and finishing.",
   "- The estimated finished weight at US size 7 is approximately 2.75 g and may vary by about 10% after casting and finishing."],
  ["- Weight may vary by approximately 10 percent after final CAD, casting and finishing",
   "- Weight may vary by approximately 10 percent after casting and finishing"],
  // Jade Gold NYC.
  ["• Proposed solid 14K or 18K gold construction, never plated or filled", "• Solid 14K or 18K gold construction, never plated or filled"],
  ["• Proposed in solid bright white gold, never plated or filled", "• Solid bright white gold, never plated or filled"],
  ["• Proposed solid 14K yellow, white and rose gold, supplier confirmation pending", "• Solid 14K yellow, white and rose gold"],
  ["• Sold as one pair, exact diameter and closure pending supplier confirmation", "• Sold as one pair"],
  ["• Ready-to-ship stock model with a proposed 3 to 5 business day handling window", "• Ready-to-ship stock model with a 3 to 5 business day handling window"],
  ["Proposed in solid 14K yellow gold with blue topaz and amethyst, it balances sculptural weight with an airy chain for quiet everyday color.",
   "In solid 14K yellow gold with blue topaz and amethyst, it balances sculptural weight with an airy chain for quiet everyday color."],
  ["✔ Length Options: [Insert sizes – 7\", 7.5\", 8\", 8.5\"", "✔ Length Options: 7\", 7.5\", 8\", 8.5\""],
  ["- The final 18K weight is added after production readback, so the finished weight is confirmed after production.", ""],
  ["The 18K gold necklace is prepared from the approved Threshold design.", ""],
  ["This is a provisional Fall 2026 panel proposal built from the approved reference image. Exact gram weight, dimensions, hallmark, closure construction and final supplier cost will be added after production readback. No unverified measurement is presented as final.", ""],
  ["Final wearable minimum and maximum length will be added after supplier readback.", ""],
  ["Gold karat, gemstone identity, treatment, carat weight, hallmark and total weight must be confirmed from the supplier before this panel proposal can be sent to Etsy.", ""],
  ["The supplier quote identifies this bracelet at 7.5 inches and the supplied product image shows an extension chain.", ""],
  ["• 7.5 inch quoted bracelet length", "• 7.5 inch bracelet length"],
  ["Personalization is not enabled in this provisional listing", "Personalization is not enabled"],
  ["Gold weight is a pre-production estimate and may vary by approximately 10% after final CAD, casting and finishing. Final metal weight will be confirmed before the listing is approved for Etsy.",
   "Gold weight is an estimate and may vary by approximately 10% after casting and finishing."],
  // The owner's example, without its heading, and the 2027 enamel catalog lines.
  ["Dimensions are development targets. Gold weight, final size options, alloy/enamel compatibility, durability, post/chain joints, price and production time require a physical sample and maker approval. No stock, hallmark, allergy or performance claim is made.", ""],
  ["Internal reference: BAS-27-MINE-R01-14Y", ""],
  ["Protect the enamel from hard impacts and bending. Wipe gently with a soft cloth; avoid abrasive cleaners and ultrasonic cleaning until the maker confirms the care method.",
   "Protect the enamel from hard impacts and bending. Wipe gently with a soft cloth; avoid abrasive cleaners and ultrasonic cleaning."],
];

// Ordinary buyer copy from the same listings: must come back byte for byte.
const KEEP: string[] = [
  "Each listing is for one ring in the karat and gold color named in the title. Width and ring size are selected within this listing.",
  "Your ring is made to order after the ring size is confirmed. The delivery date shown at checkout includes the making time.",
  "- The estimated finished weight is approximately 2.10 g at US size 7 and may vary by approximately 10% after final production.",
  "- Choose your ring size and gold karat from the available variations; specific measurements and weight are not provided here.",
  "- The slender profile is intended for delicate stacking, or wear it on its own as a sculptural gold band ring.",
  "Engagements and proposals",
  "Bridesmaid proposals",
  "Design meaning is a personal interpretation, not a protective or healing promise.",
  "• Listing images show the 6 mm reference width unless otherwise noted",
  "The photo shows the yellow gold version with a brushed face and polished edges.",
  "──────── ESPAÑOL ────────",
  "Order before the sale ends and save.",
  "Colors and appearance may vary slightly depending on lighting, photography, and individual screen settings.",
];

test("each real internal line is cut to its buyer fact", () => {
  for (const [input, expected] of LINES) {
    assert.equal(stripInternalNotes(input).text, expected, input);
  }
});

test("ordinary buyer copy is untouched, byte for byte", () => {
  for (const line of KEEP) {
    const r = stripInternalNotes(line);
    assert.equal(r.text, line);
    assert.equal(r.edits.length, 0, line);
  }
});

test("the owner's example goes as one section", () => {
  const before = [
    "Blue Notch — a small accent of cobalt blue.",
    "",
    "CARE",
    "Protect the enamel from hard impacts and bending.",
    "",
    "DESIGN PROPOSAL — NOT READY FOR SALE",
    "The single image is an AI-generated design visualization, not a photograph of a finished product. Dimensions are development targets. Gold weight, final size options, alloy/enamel compatibility, durability, post/chain joints, price and production time require a physical sample and maker approval. No stock, hallmark, allergy or performance claim is made.",
    "",
    "Internal reference: BAS-27-MINE-R01-14Y",
    "Collection: Artifact Studio 2027 Color and Enamel.",
  ].join("\n");
  const r = stripPublicDescription(before);
  assert.equal(
    r.text,
    [
      "Blue Notch — a small accent of cobalt blue.",
      "",
      "CARE",
      "Protect the enamel from hard impacts and bending.",
      "",
      "Collection: Artifact Studio 2027 Color and Enamel.",
    ].join("\n"),
  );
  assert.ok(!INTERNAL_RE.test(r.text));
});

test("Jade production note section and an emptied personalization section both go", () => {
  const before = [
    "DETAILS",
    "• Fine cable chain",
    "• Proposed solid 14K or 18K gold construction, never plated or filled",
    "• Made to order",
    "",
    "VARIATIONS",
    "Choose 14K or 18K solid yellow, white or rose gold, then select chain size.",
    "",
    "PERSONALIZATION",
    "Personalization is planned, but the submission format and production readback must be owner-approved before Etsy publication.",
    "",
    "IMPORTANT PRODUCTION NOTE",
    "Exact finished weight, hallmark, closure mechanics and supplier cost are pending production readback. All karat-specific panel prices are provisional and cannot be published to Etsy until owner approval.",
    "",
    "Jade Gold NYC, designed in New York City.",
  ].join("\n");
  assert.equal(
    stripInternalNotes(before).text,
    [
      "DETAILS",
      "• Fine cable chain",
      "• Solid 14K or 18K gold construction, never plated or filled",
      "• Made to order",
      "",
      "VARIATIONS",
      "Choose 14K or 18K solid yellow, white or rose gold, then select chain size.",
      "",
      "Jade Gold NYC, designed in New York City.",
    ].join("\n"),
  );
});

test("EON weight and price note section goes, the details bullets stay", () => {
  const before = [
    "DETAILS",
    "• Design target thickness: approximately 1.5 mm",
    "• No engraving or text personalization",
    "",
    "MADE TO ORDER",
    "Your ring is made to order after the ring size is confirmed.",
    "",
    "WEIGHT AND PRICE NOTE",
    "Weights are pre-production estimates based on the design target. Every price includes one additional gram of casting waste and USD 100 production cost. Final CAD and cast-weight approval are required before Etsy price action.",
    "",
    "Each listing is for one ring in the karat and gold color named in the title.",
  ].join("\n");
  assert.equal(
    stripInternalNotes(before).text,
    [
      "DETAILS",
      "• Thickness: approximately 1.5 mm",
      "• No engraving or text personalization",
      "",
      "MADE TO ORDER",
      "Your ring is made to order after the ring size is confirmed.",
      "",
      "Each listing is for one ring in the karat and gold color named in the title.",
    ].join("\n"),
  );
});

test("a description without any signal comes back unchanged", () => {
  const d = "A solid 14K band.\r\n\r\n- Made to order.\n\n\nCARE\nWipe it clean.";
  assert.equal(stripInternalNotes(d).text, d);
});

test("visualization and internal rules run together", () => {
  const r = stripPublicDescription(
    "- The necklace is made to order with 1–3 days of processing, and the styled images are production visualizations rather than a final product gallery.",
  );
  assert.equal(r.text, "- The necklace is made to order with 1–3 days of processing.");
});
