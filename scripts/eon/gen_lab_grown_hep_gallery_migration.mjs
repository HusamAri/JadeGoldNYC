#!/usr/bin/env node
/**
 * EON-HEP galerisi → supabase/migrations/0186_eon_lab_grown_hep_gallery.sql
 *
 * Girdi: docs/eon/lab-grown/05-half-eternity-pave/images/status.json (sahibin 2026-11-11 onayladığı 10 kare: 9 Higgsfield
 * karesi + yerelde dizilmiş taş tablosu; v1'den sonra sahip "taşlar yarım tur tam tur değil" dedi, 6 kare yeniden
 * çekildi; seçilen ve reddedilen çekimler gerekçeleriyle). Kapılar, uygulama sırası ve SQL: scripts/eon/lab_grown_gallery.mjs.
 * ÖNCE dağıtım: 10 URL canlıda 200 dönmeden uygulanmaz.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_hep_gallery_migration.mjs
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { galleryMigrationSql } from "./lab_grown_gallery.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const outFile = path.join(repoRoot, "supabase/migrations/0186_eon_lab_grown_hep_gallery.sql");

const sql = await galleryMigrationSql({
  repoRoot,
  statusRel: "docs/eon/lab-grown/05-half-eternity-pave/images/status.json",
  sku: "EON-HEP",
  folder: "lab-grown-hep",
  count: 10,
  fileName: "0186_eon_lab_grown_hep_gallery.sql",
  generatorScript: "scripts/eon/gen_lab_grown_hep_gallery_migration.mjs",
  tag: "hep",
  look: "pencere gün ışığı, her metal tamamlayıcı renk zeminde; 10. kare yerelde dizilmiş taş tablosu",
});
await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}: 10 images, cover https://amuletta.artifactstudio.info/eon/lab-grown-hep/01.jpg`);
