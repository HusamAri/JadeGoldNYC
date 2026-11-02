import { test } from "node:test";
import assert from "node:assert/strict";

import { stripVisualizationDisclosure, stripSentence, VISUALIZATION_RE } from "../lib/etsy/strip-visualization";

// Real sentences from the live panel (by Artifact Studio Jewelry + EON, 2026-10-27) -> expected result.
const CASES: [string, string][] = [
  ["The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.",
   "The handmade piece may vary slightly."],
  ["The product image is a design visualization of the finished piece; the handmade piece may vary slightly.",
   "The handmade piece may vary slightly."],
  ["- The styled images are design visualizations of the finished chain; the unedited photo shows the real chain.",
   ""],
  ["- The bracelet has no stones, and the listing photos are design visualizations of the finished piece.",
   "- The bracelet has no stones."],
  ["These acorn earrings are sold as a pair; the product images are design visualizations, and a finished piece may vary slightly.",
   "These acorn earrings are sold as a pair."],
  ["A gift message can be added at checkout; the product image is a design visualization, and the finished piece may vary slightly.",
   "A gift message can be added at checkout."],
  ["- Product images are design visualizations, so the finished piece may vary slightly; you can add a gift message at checkout.",
   "- You can add a gift message at checkout."],
  ["- Wipe it with a soft cloth for care; the product images are design visualizations, and the finished piece may vary slightly.",
   "- Wipe it with a soft cloth for care."],
  ["- Each piece is made to order and has a 3–5 day processing time; the product photo is a design visualization, so the finished piece may vary slightly.",
   "- Each piece is made to order and has a 3–5 day processing time."],
  ["The gold chain bracelet has no stones, and the image shows the bracelet in a yellow-gold color; the three-metal image is a color visualization of the same design.",
   "The gold chain bracelet has no stones, and the image shows the bracelet in a yellow-gold color."],
  ["This evil eye necklace is shown in a product design visualization, so the finished piece may vary slightly.", ""],
  ["Tooling and finish may vary slightly from the design visualization.", ""],
  ["Product images are design visualizations, so the finished ring may vary slightly from the pictured rendering.", ""],
  ["The images are design visualizations.", ""],
  ["The gallery uses Higgsfield AI-assisted visualizations guided by a photograph of the physical design.", ""],
  ["The gallery shows the gold ring in an AI-assisted visualization; lighting and screen settings may affect how the metal appears.",
   "Lighting and screen settings may affect how the metal appears."],
  ["- Styled gallery images are AI-assisted visualizations; final physical dimensions and weight are not established by the images, and props are not included.",
   "- Final physical dimensions and weight are not established by the images, and props are not included."],
  ["The laurel wedding band is shown in an AI-assisted visualization guided by photographs of the physical design; props are not included.",
   "Props are not included."],
  ["- The listing is for one ring; the image is a design visualization, not a photograph of the finished piece.",
   "- The listing is for one ring."],
  ["The main image was recolored from the visualization made for another metal color, so the shape matches it exactly.", ""],
  ["- The product images are design visualizations; the finished piece may vary slightly, and the three-metal image shows the yellow, white, and rose gold options.",
   "- The finished piece may vary slightly, and the three-metal image shows the yellow, white, and rose gold options."],
];

test("each real disclosure sentence keeps only its non-disclosure facts", () => {
  for (const [input, want] of CASES) {
    const got = stripSentence(input);
    assert.equal(got, want, input);
    assert.equal(VISUALIZATION_RE.test(got), false, got);
  }
});

test("a full description changes only the disclosure, everything else byte for byte", () => {
  const desc = [
    "Solid 925 sterling silver Franco chain necklace for men.",
    "",
    "- Lobster clasp, stamped 925 on the tag plate.",
    "- Made to order at our bench in New Jersey and shipped within 2 business days.",
    "- The styled images are design visualizations of the finished chain; the unedited photo shows the real chain.",
    "",
    "Sold as a pair. The images are design visualizations. Wipe with a soft cloth.",
  ].join("\n");
  const { text, removed } = stripVisualizationDisclosure(desc);
  assert.equal(text, [
    "Solid 925 sterling silver Franco chain necklace for men.",
    "",
    "- Lobster clasp, stamped 925 on the tag plate.",
    "- Made to order at our bench in New Jersey and shipped within 2 business days.",
    "",
    "Sold as a pair. Wipe with a soft cloth.",
  ].join("\n"));
  assert.equal(removed.length, 2);
});

test("a line that is only the disclosure disappears without leaving a double blank line", () => {
  const { text } = stripVisualizationDisclosure("Intro.\n\nThe images are design visualizations.\n\nOutro.");
  assert.equal(text, "Intro.\n\nOutro.");
});

test("a description without the disclosure is returned unchanged", () => {
  const d = "Hand-finished 14K band.\n\n- Ships in 3 days.";
  assert.deepEqual(stripVisualizationDisclosure(d), { text: d, removed: [] });
});

test("words that merely contain 'ai' are not treated as the disclosure", () => {
  for (const s of ["Chain detail, plain and polished.", "Maintain with a soft cloth.", "Available in 7 to 9 inches."]) {
    assert.equal(VISUALIZATION_RE.test(s), false, s);
  }
});
