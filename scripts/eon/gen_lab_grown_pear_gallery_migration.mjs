#!/usr/bin/env node
/**
 * EON-PEAR2 galerisi → supabase/migrations/0194_eon_lab_grown_pear2_gallery.sql
 *
 * Girdi: docs/eon/lab-grown/08-double-pear/images/status.json. Sahibin 2026-11-14 kartındaki plan (1a,2a,3a): 9 Higgsfield
 * karesi ve yerelde dizilmiş ölçü kartı. Sahip ilk partide damlaların yönünü düzeltti ("damlaların yönü doğru değil");
 * v2 prompt seti ("devam") taşları her pozda kameraya yüzü dönük gösterir. 04 v3'te, 05 v3'te tuttu; 02 ve 08 v1 kaldı.
 * Kapılar, uygulama sırası ve SQL: scripts/eon/lab_grown_gallery.mjs. ÖNCE dağıtım: 10 URL canlıda 200 dönmeden
 * uygulanmaz.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_pear_gallery_migration.mjs
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { galleryMigrationSql } from "./lab_grown_gallery.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const outFile = path.join(repoRoot, "supabase/migrations/0194_eon_lab_grown_pear2_gallery.sql");

const sql = await galleryMigrationSql({
  repoRoot,
  statusRel: "docs/eon/lab-grown/08-double-pear/images/status.json",
  sku: "EON-PEAR2",
  folder: "lab-grown-pear2",
  count: 10,
  fileName: "0194_eon_lab_grown_pear2_gallery.sql",
  generatorScript: "scripts/eon/gen_lab_grown_pear_gallery_migration.mjs",
  tag: "pear2",
  look: "pencere gün ışığı, taşlar kameraya yüzü dönük, her metal tamamlayıcı renk zeminde; 10. kare yerelde dizilmiş ölçü kartı",
});
await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}: 10 images, cover https://amuletta.artifactstudio.info/eon/lab-grown-pear2/01.jpg`);
