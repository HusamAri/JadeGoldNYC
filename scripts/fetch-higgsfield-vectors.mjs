// One-shot: pull the ORIGINAL Higgsfield vector logo/icon system and make the
// backgrounds transparent, then (optionally) drop them in over the hand-drawn
// recreations so the guidelines board uses the verbatim marks.
//
// REQUIRES network egress to the Higgsfield CDN. If you see
//   "Host not in allowlist: d8j0ntlcm91z4.cloudfront.net"
// add that host to the environment's egress allowlist and run in a NEW session.
//
//   node scripts/fetch-higgsfield-vectors.mjs           # fetch + strip -> public/brand/higgsfield/
//   node scripts/fetch-higgsfield-vectors.mjs --apply   # also overwrite public/brand/{logo,icons}/*.svg
//   node scripts/build-brand-guidelines.mjs             # rebuild the board afterwards
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE =
  "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e";

// Pinned: the "last 13" generations — 5 logo marks + 8 line icons (recraft_v4_1).
const LOGO = {
  "logo-primary": "hf_20260622_093843_926a6128-e7cb-40a1-80eb-0d2c7594ad98.svg",
  "logo-wordmark": "hf_20260622_100956_091a4a60-ef4b-4b6a-838d-0e93094395e4.svg",
  "logo-stacked": "hf_20260622_100841_6a6b9c80-332d-472c-bee9-3c0eea409dc2.svg",
  "monogram-jg": "hf_20260622_093815_f9d9622c-2ba0-4d18-af4e-1676d955dd02.svg",
  "seal-badge": "hf_20260622_101057_7fff393b-22c0-424b-a939-e49c112a34bc.svg",
};
const ICONS = {
  "icon-shield": "hf_20260622_102422_7a0fc878-f056-4126-a1bb-55d9ddf66939.svg",
  "icon-monogram": "hf_20260622_102308_ddd53cbe-fc03-4ff2-a942-5bce3032f13d.svg",
  "icon-loupe": "hf_20260622_102155_1fd8aaa7-ce14-4ec7-9318-75359bfc8806.svg",
  "icon-diamond": "hf_20260622_102111_fbaba0cd-0b75-4b17-b0c2-02e006a9fb9f.svg",
  "icon-chain": "hf_20260622_102038_e37af9a4-0581-4aa3-b7be-ec8f0fe13643.svg",
  "icon-skyline": "hf_20260622_102002_d99bfc42-2e3e-4d5e-96b9-18f00ea976bc.svg",
  "icon-ring": "hf_20260622_101918_fffad31d-419f-4547-b89b-777bf0f7b63b.svg",
  "icon-column": "hf_20260622_101855_dd6c53b2-56ee-488e-948d-dfba28daf79e.svg",
};

// Transparency + normalization pass for recraft vector SVGs. The ivory ground
// is a full-canvas <path> (d = the viewBox rectangle), not a <rect>; remove it.
// Also drop the root width/height/preserveAspectRatio="none" so the viewBox
// governs aspect and CSS/<img> sizing can't distort the mark. Inner ivory shapes
// (letter counters, the ring's hole) are kept — they blend on an ivory ground.
function makeTransparent(svg) {
  return svg
    .replace(
      /<path\b[^>]*\bd="M 0 0 L \d+(?:\.\d+)? 0 L \d+(?:\.\d+)? \d+(?:\.\d+)? L 0 \d+(?:\.\d+)? L 0 0 z"[^>]*><\/path>\s*/g,
      "",
    )
    .replace(/<svg\b[^>]*>/, (tag) =>
      tag
        .replace(/\s(?:width|height)="[^"]*"/g, "")
        .replace(/\spreserveAspectRatio="[^"]*"/g, ""),
    );
}

const apply = process.argv.includes("--apply");
const work = resolve(ROOT, "public/brand/higgsfield");
const raw = resolve(work, "raw");
mkdirSync(raw, { recursive: true });

const groups = [
  ["logo", LOGO, resolve(ROOT, "public/brand/logo")],
  ["icons", ICONS, resolve(ROOT, "public/brand/icons")],
];

let ok = 0;
for (const [kind, map, dest] of groups) {
  for (const [name, file] of Object.entries(map)) {
    const url = `${BASE}/${file}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const svg = await res.text();
      writeFileSync(resolve(raw, `${name}.svg`), svg);
      const clean = makeTransparent(svg);
      writeFileSync(resolve(work, `${name}.svg`), clean);
      if (apply) copyFileSync(resolve(work, `${name}.svg`), resolve(dest, `${name}.svg`));
      ok++;
      console.log(`ok   ${kind}/${name}`);
    } catch (e) {
      console.error(`FAIL ${kind}/${name} -> ${e.message} (${url})`);
    }
  }
}
console.log(`\n${ok}/13 fetched into public/brand/higgsfield/ (raw originals in raw/).`);
console.log(apply ? "Applied over public/brand/{logo,icons}. Now: node scripts/build-brand-guidelines.mjs"
  : "Review them, then re-run with --apply, then: node scripts/build-brand-guidelines.mjs");
