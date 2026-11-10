#!/usr/bin/env node
/**
 * EON-HS5 galerisi → supabase/migrations/0184_eon_lab_grown_hs5_gallery.sql
 *
 * Girdi: docs/eon/lab-grown/04-hammered-star/images/status.json (sahibin 2026-11-10 onayladığı 10 kare; seçilen ve
 * reddedilen çekimler, düzenlemeler gerekçeleriyle). Kapılar, uygulama sırası ve SQL: scripts/eon/lab_grown_gallery.mjs.
 * ÖNCE dağıtım: 10 URL canlıda 200 dönmeden uygulanmaz.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_hs_gallery_migration.mjs
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { galleryMigrationSql } from "./lab_grown_gallery.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const outFile = path.join(repoRoot, "supabase/migrations/0184_eon_lab_grown_hs5_gallery.sql");

const sql = await galleryMigrationSql({
  repoRoot,
  statusRel: "docs/eon/lab-grown/04-hammered-star/images/status.json",
  sku: "EON-HS5",
  folder: "lab-grown-hs5",
  count: 10,
  fileName: "0184_eon_lab_grown_hs5_gallery.sql",
  generatorScript: "scripts/eon/gen_lab_grown_hs_gallery_migration.mjs",
  tag: "hs",
  look: "pencere gün ışığı, her metal tamamlayıcı renk zeminde",
});
await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}: 10 images, cover https://amuletta.artifactstudio.info/eon/lab-grown-hs5/01.jpg`);
