// One-shot: pull the Panel süreç sahnesi videos (seedance_2.0, 720p/5s/sessiz)
// from the Higgsfield CDN into public/brand/video/. The ScrollStory on the
// Panel falls back to the poster images until these files exist.
//
// REQUIRES network egress to the Higgsfield CDN. If you see
//   "Host not in allowlist: d8j0ntlcm91z4.cloudfront.net"
// run this via .github/workflows/fetch-brand-videos.yml instead — GitHub-hosted
// runners have open internet.
//
//   node scripts/fetch-brand-videos.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE =
  "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e";

// Pinned: the three Panel süreç sahnesi generations (cevher → işçilik → eser).
const VIDEOS = {
  "surec-cevher": "hf_20260701_233429_e0886f66-edec-4bf1-83df-4d9dc1351f0e.mp4",
  "surec-iscilik": "hf_20260701_233442_15eb225a-7259-4b04-ad57-f59b999bb7fc.mp4",
  "surec-eser": "hf_20260701_233446_56c227b7-5f8d-4bc3-9498-edc4ae971903.mp4",
};

const dest = resolve(ROOT, "public/brand/video");
mkdirSync(dest, { recursive: true });

let ok = 0;
for (const [name, file] of Object.entries(VIDEOS)) {
  const url = `${BASE}/${file}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    // Sanity: ISO BMFF containers carry "ftyp" at byte 4 — reject HTML error pages.
    if (buf.length < 12 || buf.toString("latin1", 4, 8) !== "ftyp") {
      throw new Error(`not an MP4 (${buf.length} bytes)`);
    }
    writeFileSync(resolve(dest, `${name}.mp4`), buf);
    ok++;
    console.log(`ok   ${name}.mp4 (${(buf.length / 1e6).toFixed(1)} MB)`);
  } catch (e) {
    console.error(`FAIL ${name} -> ${e.message} (${url})`);
  }
}
console.log(`\n${ok}/${Object.keys(VIDEOS).length} fetched into public/brand/video/.`);
if (ok !== Object.keys(VIDEOS).length) process.exit(1);
