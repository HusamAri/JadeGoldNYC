import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { catalog, BRAND, assertImportAccess, validateCatalog, productRow } from "../lib/artifact-2027/catalog";
test("exact 5/5/5/5 scope, 20 distinct byte-verified single images", () => {
  validateCatalog(catalog);
  assert.equal(new Set(catalog.map(d => d.imageSha256)).size, 20);
  assert.equal(new Set(catalog.flatMap(d => [d.productId,d.variantId,d.imageId])).size, 60);
  for (const d of catalog) {
    const bytes=readFileSync(`public/artifact/2027-enamel/${d.id}.png`);
    assert.equal(createHash("sha256").update(bytes).digest("hex"),d.imageSha256);
    assert.equal(bytes.readUInt32BE(16),1254); assert.equal(bytes.readUInt32BE(20),1254);
    const p=productRow(d,"test-org");
    assert.equal(p.status,"draft"); assert.equal(p.price_cents,null); assert.equal(p.weight_grams,null);
    assert.equal(p.quantity,0); assert.equal(p.num_images,1);
    assert.equal(p.listing_metadata.approval.etsyDraftCreationAuthorized,false);
    assert.equal(p.listing_metadata.approval.livePublicationAuthorized,false);
    if(d.id.startsWith("B")) assert.match(d.geometry,/Flexible chain bracelet/);
    if(d.id.startsWith("E")) assert.equal(p.product_type,"earring");
  }
});
test("brand and role are both required, and corrupt catalog fails closed", () => {
  assertImportAccess(BRAND,"owner"); assertImportAccess(BRAND,"admin");
  assert.throws(()=>assertImportAccess("EON","owner"));
  assert.throws(()=>assertImportAccess(BRAND,"member"));
  assert.throws(()=>validateCatalog(catalog.slice(1)));
  assert.throws(()=>validateCatalog(catalog.map((d,i)=>i===0?{...d,tags:["over twenty characters in this tag"]}:d)));
});
