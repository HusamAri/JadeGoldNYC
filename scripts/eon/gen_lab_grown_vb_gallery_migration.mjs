#!/usr/bin/env node
/**
 * EON-VB6 galerisi → supabase/migrations/0177_eon_lab_grown_vb6_gallery.sql
 *
 * Girdi: docs/eon/lab-grown/02-vertical-baguette/images/status.json (sahibin onayladığı 10 kare; seçilen ve
 * reddedilen çekimler gerekçeleriyle). Kapılar, uygulama sırası ve SQL: scripts/eon/lab_grown_gallery.mjs.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_vb_gallery_migration.mjs
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { galleryMigrationSql } from "./lab_grown_gallery.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const outFile = path.join(repoRoot, "supabase/migrations/0177_eon_lab_grown_vb6_gallery.sql");

const sql = await galleryMigrationSql({
  repoRoot,
  statusRel: "docs/eon/lab-grown/02-vertical-baguette/images/status.json",
  sku: "EON-VB6",
  folder: "lab-grown-vb6",
  count: 10,
  fileName: "0177_eon_lab_grown_vb6_gallery.sql",
  generatorScript: "scripts/eon/gen_lab_grown_vb_gallery_migration.mjs",
  tag: "vb",
});
await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}: 10 images, cover https://amuletta.artifactstudio.info/eon/lab-grown-vb6/01.jpg`);
