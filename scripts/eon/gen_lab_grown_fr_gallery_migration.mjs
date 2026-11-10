#!/usr/bin/env node
/**
 * EON-FR6 galerisi → supabase/migrations/0180_eon_lab_grown_fr6_gallery.sql
 *
 * Girdi: docs/eon/lab-grown/03-flush-round/images/status.json (sahibin 2026-11-08 onayladığı 10 kare; seçilen ve
 * reddedilen çekimler gerekçeleriyle). Kapılar, uygulama sırası ve SQL: scripts/eon/lab_grown_gallery.mjs.
 * ÖNCE dağıtım: 10 URL canlıda 200 dönmeden uygulanmaz.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_fr_gallery_migration.mjs
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { galleryMigrationSql } from "./lab_grown_gallery.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const outFile = path.join(repoRoot, "supabase/migrations/0180_eon_lab_grown_fr6_gallery.sql");

const sql = await galleryMigrationSql({
  repoRoot,
  statusRel: "docs/eon/lab-grown/03-flush-round/images/status.json",
  sku: "EON-FR6",
  folder: "lab-grown-fr6",
  count: 10,
  fileName: "0180_eon_lab_grown_fr6_gallery.sql",
  generatorScript: "scripts/eon/gen_lab_grown_fr_gallery_migration.mjs",
  tag: "fr",
});
await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}: 10 images, cover https://amuletta.artifactstudio.info/eon/lab-grown-fr6/01.jpg`);
