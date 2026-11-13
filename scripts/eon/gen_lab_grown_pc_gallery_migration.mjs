#!/usr/bin/env node
/**
 * EON-PC9 galerisi → supabase/migrations/0190_eon_lab_grown_pc9_gallery.sql
 *
 * Girdi: docs/eon/lab-grown/06-princess-channel/images/status.json (sahibin 2026-11-13 kartındaki plan: 9 Higgsfield
 * karesi + yerelde dizilmiş ölçü kartı; önce hero referansla kontrol, sonra kalan 8; set incelemesinde 4 karede tek
 * kusur adlandırılıp yeniden çekildi, 08 dördüncü çekimde pozu değişerek tuttu). Kapılar, uygulama sırası ve SQL:
 * scripts/eon/lab_grown_gallery.mjs. ÖNCE dağıtım: 10 URL canlıda 200 dönmeden uygulanmaz.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_pc_gallery_migration.mjs
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { galleryMigrationSql } from "./lab_grown_gallery.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const outFile = path.join(repoRoot, "supabase/migrations/0190_eon_lab_grown_pc9_gallery.sql");

const sql = await galleryMigrationSql({
  repoRoot,
  statusRel: "docs/eon/lab-grown/06-princess-channel/images/status.json",
  sku: "EON-PC9",
  folder: "lab-grown-pc9",
  count: 10,
  fileName: "0190_eon_lab_grown_pc9_gallery.sql",
  generatorScript: "scripts/eon/gen_lab_grown_pc_gallery_migration.mjs",
  tag: "pc9",
  look: "pencere gün ışığı, her metal tamamlayıcı renk zeminde; 10. kare yerelde dizilmiş ölçü kartı",
});
await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}: 10 images, cover https://amuletta.artifactstudio.info/eon/lab-grown-pc9/01.jpg`);
