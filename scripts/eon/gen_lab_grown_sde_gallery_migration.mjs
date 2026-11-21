#!/usr/bin/env node
/**
 * EON-SDE6 galerisi → supabase/migrations/0196_eon_lab_grown_sde6_gallery.sql
 *
 * Girdi: docs/eon/lab-grown/09-satin-diamond-edge/images/status.json (sahip kartları 2026-11-21: prompt setinden 9 Higgsfield
 * karesi + yerelde dizilmiş ölçü kartı, önce hero sahibin fotoğraflarıyla kontrol; sahibin fotoğrafı 4 son kare, düzenlenmeden).
 * Set incelemesinde 05 (üst sıra bandın iç duvarındaydı) ve 08 (avuçta ~%30 büyük, sarı karede rose tonu) birer kez yeniden
 * çekildi; seçilen/reddedilen çekimler gerekçeleriyle status.json'da. Kapılar, uygulama sırası ve SQL:
 * scripts/eon/lab_grown_gallery.mjs. ÖNCE dağıtım: 11 URL canlıda 200 dönmeden uygulanmaz. 11. kare 1200×1600 dikey JPEG'dir
 * (sahibin fotoğrafı; meta veri segmenti yoktu, bayt bayt kopyalandı).
 *
 * Kullanım: node scripts/eon/gen_lab_grown_sde_gallery_migration.mjs
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { galleryMigrationSql } from "./lab_grown_gallery.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const outFile = path.join(repoRoot, "supabase/migrations/0196_eon_lab_grown_sde6_gallery.sql");

const sql = await galleryMigrationSql({
  repoRoot,
  statusRel: "docs/eon/lab-grown/09-satin-diamond-edge/images/status.json",
  sku: "EON-SDE6",
  folder: "lab-grown-sde6",
  count: 11,
  fileName: "0196_eon_lab_grown_sde6_gallery.sql",
  generatorScript: "scripts/eon/gen_lab_grown_sde_gallery_migration.mjs",
  tag: "sde6",
  look: "pencere gün ışığı, metalin tamamlayıcısı düşük doygun zeminler; 10. kare yerelde dizilmiş ölçü kartı; 11. kare sahibin kendi fotoğrafı, düzenlenmeden",
});
await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}: 11 images, cover https://amuletta.artifactstudio.info/eon/lab-grown-sde6/01.jpg`);
