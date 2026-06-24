// Builds a self-contained Jade Gold NYC brand guidelines board (fixed-canvas HTML).
// - Inlines the authored transparent SVG logo/icon system (public/brand/{logo,icons}).
// - Base64-embeds real product photography (public/brand/gallery) so the file is
//   self-contained (required for a clean Adobe Express import — no external fetch).
//
// Logo discipline (intentional restraint):
//   Marks are NEVER shown large/centred as decoration. They appear only as
//   (a) faint monochrome "cold stamp" watermarks placed OUTSIDE text blocks,
//   (b) a small corner hallmark on a card, or
//   (c) documented specimens inside the two panels that exist to define them
//       (Logo System, Submarks & Stamps). Every other panel carries at most one
//       tiny corner monogram. Watermarks stay low-opacity and clear of body copy
//       so text/ground contrast holds to WCAG AA+.
//
// Run: node scripts/build-brand-guidelines.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const r = (p) => resolve(ROOT, p);
const svg = (p) => readFileSync(r(p), "utf8").trim();
const dataUri = (p) =>
  `data:image/webp;base64,${readFileSync(r(p)).toString("base64")}`;

// ---- Brand tokens --------------------------------------------------------
const GOLD = "#B89347";
const IVORY = "#F2EFE6";
const STONE = "#A39F94";
const JADE = "#3F4A44";
const CHAR = "#131313";
const SANS = `"itc-avant-garde-gothic-pro", "Futura", "Century Gothic", sans-serif`;
const SERIF = `"meno-banner", "Didot", "Bodoni MT", serif`;

// Ink tones for text on light (ivory) cards — kept dark enough for AA+ body copy.
const INK = "#1c1a16"; // primary ink on ivory (≈14:1)
const INK_SOFT = "#6f6857"; // muted label ink on ivory (≈4.7:1) — labels only
const GOLD_DEEP = "#7c5f25"; // accent text on ivory (≈5.0:1) — eyebrows on light cards

const PALETTE = [
  { hex: GOLD, name: "Antique Gold", use: "Primary · marks & accents", dark: false },
  { hex: IVORY, name: "Warm Ivory", use: "Light ground", dark: false },
  { hex: STONE, name: "Stone Grey", use: "Neutral support", dark: false },
  { hex: JADE, name: "Deep Jade", use: "Depth · secondary", dark: true },
  { hex: CHAR, name: "Charcoal", use: "Dark ground", dark: true },
];

// ---- Assets --------------------------------------------------------------
const logo = {
  primary: svg("public/brand/logo/logo-primary.svg"),
  wordmark: svg("public/brand/logo/logo-wordmark.svg"),
  stacked: svg("public/brand/logo/logo-stacked.svg"),
  monogram: svg("public/brand/logo/monogram-jg.svg"),
  seal: svg("public/brand/logo/seal-badge.svg"),
};
const ICONS = [
  ["icon-monogram", "Monogram"],
  ["icon-diamond", "Diamond"],
  ["icon-chain", "Chain"],
  ["icon-ring", "Ring"],
  ["icon-skyline", "Skyline"],
  ["icon-column", "Column"],
  ["icon-loupe", "Loupe"],
  ["icon-shield", "Shield"],
].map(([f, label]) => ({ label, svg: svg(`public/brand/icons/${f}.svg`) }));

const HERO = dataUri("public/brand/gallery/koyu-franco.webp");
const BAND = [
  ["public/brand/gallery/aydinlik-cuban.webp", "Miami Cuban · linen"],
  ["public/brand/gallery/model-hamsa.webp", "Hamsa · worn"],
  ["public/brand/gallery/koyu-paperclip.webp", "Paperclip · slate"],
  ["public/brand/gallery/nyc-butterfly.webp", "Butterfly · stone"],
  ["public/brand/gallery/aydinlik-nugget.webp", "Nugget · cream"],
  ["public/brand/gallery/model-dome.webp", "Dome band · hand"],
].map(([p, cap]) => ({ src: dataUri(p), cap }));

// ---- Markup helpers ------------------------------------------------------
const swatch = (c) => `
  <li class="chip">
    <span class="chip-color" style="background:${c.hex};${c.dark ? "" : "border:1px solid rgba(28,26,22,.16)"}"></span>
    <span class="chip-meta">
      <span class="chip-name">${c.name}</span>
      <span class="chip-hex">${c.hex.toUpperCase()}</span>
      <span class="chip-use">${c.use}</span>
    </span>
  </li>`;

const iconCell = (i) => `
  <li class="icon-cell">
    <span class="icon-art" aria-hidden="true">${i.svg}</span>
    <span class="icon-label">${i.label}</span>
  </li>`;

const bandTile = (t, i) => `
  <figure class="ph" style="left:${i * (262 + 12)}px">
    <img src="${t.src}" width="262" height="200" alt="${t.cap}"/>
    <figcaption>${t.cap}</figcaption>
  </figure>`;

// A panel header: eyebrow + number, no logo.
const head = (label, num) =>
  `<div class="panel-head"><span class="eyebrow">${label}</span><span class="num">${num}</span></div>`;

// ---- Document ------------------------------------------------------------
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Jade Gold NYC — Brand Guidelines</title>
<meta name="hz:slide-selector" content=".board"/>
<meta name="hz:canvas-width" content="1728"/>
<meta name="hz:canvas-height" content="1152"/>
<link rel="stylesheet" href="https://use.typekit.net/xab4rhd.css"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { display:flex; justify-content:center; align-items:center; min-height:100vh; background:#0a0a0a; }
  .board {
    position:relative; width:1728px; height:1152px; background:${CHAR};
    color:${IVORY}; overflow:hidden; font-family:${SANS};
  }
  /* Single faint board watermark — one cold stamp, monochrome, far from copy.
     Sits low-right behind the photography band edge; never over a text block. */
  .board-watermark {
    position:absolute; right:-150px; bottom:-160px; width:620px; height:620px;
    opacity:.035; filter:grayscale(1) brightness(1.7); pointer-events:none; z-index:0;
  }
  .board-watermark svg { width:100%; height:100%; }
  .board::before { /* subtle inner frame */
    content:""; position:absolute; inset:28px; border:1px solid rgba(184,147,71,.26);
    pointer-events:none; z-index:3;
  }
  .board > * { position:relative; z-index:1; }

  /* ---- shared type ---- */
  .eyebrow { font-family:${SANS}; font-weight:700; font-size:12px; letter-spacing:3px;
             text-transform:uppercase; color:${GOLD}; }
  .num { font-family:${SANS}; font-weight:500; font-size:11px; letter-spacing:2px; color:${STONE}; }

  /* ---- header ---- */
  .header { position:absolute; left:64px; top:60px; right:64px; height:104px;
            display:flex; justify-content:space-between; align-items:flex-start; }
  .h-brand { font-family:${SANS}; font-weight:500; font-size:34px; letter-spacing:13px; color:${GOLD}; line-height:1; }
  .h-sub { font-family:${SANS}; font-weight:500; font-size:11px; letter-spacing:6px; color:${STONE}; margin-top:12px; }
  .h-right { text-align:right; }
  .h-title { font-family:${SERIF}; font-style:italic; font-size:25px; color:${IVORY}; line-height:1; }
  .h-meta { font-family:${SANS}; font-weight:500; font-size:11px; letter-spacing:4px; color:${STONE}; margin-top:13px; }
  .rule { position:absolute; left:64px; right:64px; top:178px; height:1px;
          background:linear-gradient(90deg,${GOLD},rgba(184,147,71,.12)); }

  /* ---- hero feature ---- */
  .hero { position:absolute; left:64px; top:206px; width:560px; height:606px; overflow:hidden; border-radius:2px; }
  .hero img { width:100%; height:100%; object-fit:cover; filter:saturate(.92) contrast(1.02); }
  .hero .scrim { position:absolute; inset:0;
    background:linear-gradient(180deg, rgba(19,19,19,.20) 0%, rgba(19,19,19,0) 32%, rgba(19,19,19,.30) 60%, rgba(19,19,19,.94) 100%); }
  /* Hero hallmark: faint monochrome cold stamp in the corner, clear of the caption. */
  .hero .stamp { position:absolute; top:22px; right:22px; width:110px; height:110px;
                 opacity:.16; filter:grayscale(1) brightness(2.2); }
  .hero .stamp svg { width:100%; height:100%; }
  .hero .cap { position:absolute; left:36px; right:36px; bottom:38px; }
  .hero .cap h2 { font-family:${SERIF}; font-weight:400; font-size:54px; line-height:.98; color:${IVORY}; letter-spacing:.5px; }
  .hero .cap h2 em { font-style:italic; color:${GOLD}; }
  .hero .cap p { font-family:${SANS}; font-weight:500; font-size:13px; letter-spacing:5px; color:${IVORY};
                 text-transform:uppercase; margin-top:16px; opacity:.86; }

  /* ---- panel base ---- */
  .panel { position:absolute; border-radius:3px; }
  .panel-head { display:flex; align-items:baseline; gap:12px; margin-bottom:16px; }
  /* Light (ivory) cards: dark ink for AA+ contrast. */
  .light { background:${IVORY}; color:${INK}; box-shadow:0 1px 0 rgba(184,147,71,.12); }
  .light .eyebrow { color:${GOLD_DEEP}; }
  .light .num { color:${INK_SOFT}; }
  /* Dark cards: hairline gold frame on charcoal. */
  .dark-card { border:1px solid rgba(184,147,71,.28); background:rgba(184,147,71,.018); }

  /* Tiny corner monogram hallmark — at most one per card, never over copy.
     Monochrome, faint, parked in the top-right gutter. */
  .corner-mark { position:absolute; top:16px; right:18px; width:26px; height:26px;
                 opacity:.5; filter:grayscale(1) brightness(.55); pointer-events:none; }
  .dark-card .corner-mark { filter:grayscale(1) brightness(1.7); opacity:.4; }
  .corner-mark svg { width:100%; height:100%; }

  /* === LOGO SYSTEM (panel 01) — one of two panels allowed to show specimens.
     A single reference lockup at usable size + a compact variant strip. === */
  #logosys { left:660px; top:206px; width:1004px; height:286px; padding:26px 32px; }
  .ls-body { display:flex; gap:34px; align-items:stretch; height:198px; margin-top:4px; }
  .ls-ref { width:330px; flex:none; display:flex; flex-direction:column; }
  .ls-ref-stage { flex:1; display:flex; align-items:center; justify-content:center;
                  background:#fbf9f4; border:1px solid rgba(28,26,22,.12); border-radius:2px; padding:16px; }
  .ls-ref-stage svg { width:236px; }
  .ls-ref-cap { font-family:${SANS}; font-weight:700; font-size:10px; letter-spacing:2px;
                color:${INK_SOFT}; text-transform:uppercase; margin-top:10px; }
  .ls-variants { flex:1; display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
  .ls-var { display:flex; flex-direction:column; }
  .ls-var-stage { flex:1; display:flex; align-items:center; justify-content:center;
                  background:#fbf9f4; border:1px solid rgba(28,26,22,.10); border-radius:2px; }
  .ls-var-stage svg { max-width:118px; max-height:108px; }
  .ls-var-stage.word svg { width:128px; }
  .ls-var-cap { font-family:${SANS}; font-weight:500; font-size:9.5px; letter-spacing:1.6px;
                color:${INK_SOFT}; text-transform:uppercase; margin-top:8px; }

  /* === COLOUR (panel 02) === */
  #color { left:660px; top:512px; width:494px; height:300px; padding:24px 28px; }
  .chips { list-style:none; display:flex; flex-direction:column; gap:13px; margin-top:6px; }
  .chip { display:flex; align-items:center; gap:15px; }
  .chip-color { width:54px; height:38px; border-radius:3px; flex:none; }
  .chip-meta { display:flex; align-items:baseline; gap:12px; width:100%; }
  .chip-name { font-family:${SANS}; font-weight:700; font-size:12.5px; letter-spacing:.4px; color:${INK}; width:128px; }
  .chip-hex { font-family:${SANS}; font-weight:700; font-size:11px; letter-spacing:1.2px; color:${GOLD_DEEP}; width:82px; }
  .chip-use { font-family:${SANS}; font-weight:500; font-size:10.5px; letter-spacing:.2px; color:${INK_SOFT}; }

  /* === TYPOGRAPHY (panel 03) === */
  #type { left:1170px; top:512px; width:494px; height:300px; padding:24px 28px; }
  .type-row { display:flex; gap:28px; margin-top:10px; }
  .type-spec { flex:1; }
  .type-Aa { font-size:84px; line-height:.84; color:${INK}; }
  .type-Aa.s { font-family:${SERIF}; font-weight:400; }
  .type-Aa.g { font-family:${SANS}; font-weight:500; }
  .type-name { font-family:${SANS}; font-weight:700; font-size:13px; letter-spacing:.6px; color:${GOLD_DEEP}; margin-top:18px; }
  .type-desc { font-family:${SANS}; font-weight:500; font-size:11px; letter-spacing:.2px; color:${INK_SOFT}; margin-top:7px; line-height:1.55; }
  .type-scale { font-family:${SANS}; font-weight:500; font-size:10px; letter-spacing:1.4px; color:${INK_SOFT};
                text-transform:uppercase; margin-top:14px; padding-top:13px; border-top:1px solid rgba(28,26,22,.12); }

  /* ---- photography band ---- */
  .photo-head { position:absolute; left:64px; top:832px; display:flex; align-items:baseline; gap:12px; z-index:1; }
  .photo-band { position:absolute; left:64px; top:858px; width:1600px; height:200px; z-index:1; }
  .ph { position:absolute; top:0; width:262px; height:200px; overflow:hidden; border-radius:2px; }
  .ph img { width:100%; height:100%; object-fit:cover; filter:saturate(.92) contrast(1.02); display:block; }
  .ph::after { content:""; position:absolute; inset:0;
    background:linear-gradient(180deg, rgba(19,19,19,0) 52%, rgba(19,19,19,.82) 100%); }
  .ph figcaption { position:absolute; left:11px; bottom:10px; right:11px; z-index:1;
     font-family:${SANS}; font-weight:700; font-size:9.5px; letter-spacing:1.2px; text-transform:uppercase;
     color:${IVORY}; }
  /* Stamps + iconography ride beside the band, kept compact. */

  /* === SUBMARKS & STAMPS (panel 04) — second specimen panel; the seal + monogram
     ARE the subject here, shown as documented cold-stamp specimens. === */
  #stamps { left:660px; top:832px; width:494px; height:226px; padding:22px 26px; }
  .stamp-row { display:flex; align-items:center; gap:26px; margin-top:6px; }
  .stamp-spec { display:flex; flex-direction:column; align-items:center; gap:10px; }
  /* Specimens rendered as monochrome cold stamps on a paper tile. */
  .stamp-tile { width:108px; height:108px; display:flex; align-items:center; justify-content:center;
                background:#fbf9f4; border:1px solid rgba(28,26,22,.14); border-radius:2px; }
  .stamp-tile svg { width:76px; height:76px; filter:grayscale(1) brightness(.42); opacity:.9; }
  .stamp-tile.mono svg { width:62px; height:62px; }
  .stamp-label { font-family:${SANS}; font-weight:700; font-size:9px; letter-spacing:1.6px;
                 color:${INK_SOFT}; text-transform:uppercase; }
  .stamp-note { font-family:${SANS}; font-weight:500; font-size:11px; letter-spacing:.2px; color:${INK}; line-height:1.6; }
  .stamp-note b { color:${GOLD_DEEP}; font-weight:700; }

  /* === ICONOGRAPHY (panel 05) === */
  #icons { left:1170px; top:832px; width:494px; height:226px; padding:22px 26px; }
  .icon-grid { list-style:none; display:grid; grid-template-columns:repeat(4,1fr); gap:14px 10px; margin-top:8px; }
  .icon-cell { display:flex; flex-direction:column; align-items:center; gap:7px; }
  .icon-art { width:34px; height:34px; }
  .icon-art svg { width:100%; height:100%; }
  .icon-label { font-family:${SANS}; font-weight:500; font-size:8.5px; letter-spacing:1.2px; color:${INK_SOFT}; text-transform:uppercase; }

  /* ---- footer ---- */
  .footer { position:absolute; left:64px; right:64px; top:1086px; height:40px;
            display:flex; align-items:center; justify-content:space-between; z-index:1; }
  .footer .line { flex:1; height:1px; background:rgba(184,147,71,.28); }
  .footer .mark { font-family:${SANS}; font-weight:500; font-size:12px; letter-spacing:8px; color:${GOLD}; padding:0 22px; }
  .footer .tag { font-family:${SANS}; font-weight:500; font-size:10px; letter-spacing:4px; color:${STONE}; padding:0 22px; text-transform:uppercase; }
</style>
</head>
<body>
  <div class="board" data-canvas-width="1728" data-canvas-height="1152">

    <!-- One faint, monochrome cold-stamp watermark for the whole board, parked
         in the dead corner so it never reduces text contrast. -->
    <div class="board-watermark" aria-hidden="true">${logo.seal}</div>

    <header class="header">
      <div>
        <div class="h-brand">JADE&nbsp;GOLD</div>
        <div class="h-sub">NEW YORK &middot; EST. 2024</div>
      </div>
      <div class="h-right">
        <div class="h-title">Brand Guidelines</div>
        <div class="h-meta">VISUAL IDENTITY &nbsp;/&nbsp; VOL.01 &mdash; 2026</div>
      </div>
    </header>
    <div class="rule"></div>

    <section class="hero" aria-label="Feature">
      <img src="${HERO}" width="560" height="606" alt="Gold Franco chain resting on volcanic stone"/>
      <div class="scrim"></div>
      <div class="stamp" aria-hidden="true">${logo.seal}</div>
      <div class="cap">
        <h2>Modern<br/><em>Heirlooms</em></h2>
        <p>Built to be lived in</p>
      </div>
    </section>

    <!-- 01 · Logo System — reference lockup + variant specimens (specimen panel) -->
    <section class="panel light" id="logosys" aria-label="Logo system">
      ${head("Logo System", "/ 01")}
      <div class="ls-body">
        <div class="ls-ref">
          <div class="ls-ref-stage">${logo.primary}</div>
          <div class="ls-ref-cap">Primary lockup · reference</div>
        </div>
        <div class="ls-variants">
          <div class="ls-var">
            <div class="ls-var-stage word">${logo.wordmark}</div>
            <div class="ls-var-cap">Wordmark</div>
          </div>
          <div class="ls-var">
            <div class="ls-var-stage">${logo.stacked}</div>
            <div class="ls-var-cap">Stacked</div>
          </div>
          <div class="ls-var">
            <div class="ls-var-stage">${logo.monogram}</div>
            <div class="ls-var-cap">Monogram</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 02 · Colour -->
    <section class="panel light" id="color" aria-label="Colour palette">
      ${head("Colour", "/ 02")}
      <ul class="chips">${PALETTE.map(swatch).join("")}</ul>
    </section>

    <!-- 03 · Typography -->
    <section class="panel light" id="type" aria-label="Typography">
      ${head("Typography", "/ 03")}
      <div class="type-row">
        <div class="type-spec">
          <div class="type-Aa s">Aa</div>
          <div class="type-name">Meno Banner</div>
          <div class="type-desc">High-contrast Didone display. Headlines &amp; editorial voice.</div>
        </div>
        <div class="type-spec">
          <div class="type-Aa g">Aa</div>
          <div class="type-name">ITC Avant Garde</div>
          <div class="type-desc">Geometric sans. Logotype, labels &amp; body copy.</div>
        </div>
      </div>
      <div class="type-scale">Display &middot; Heading &middot; Body &middot; Label / caps</div>
    </section>

    <!-- 04 · Submarks &amp; Stamps — specimen panel (seal + monogram as subject) -->
    <section class="panel light" id="stamps" aria-label="Submarks and stamps">
      ${head("Submarks &amp; Stamps", "/ 04")}
      <div class="stamp-row">
        <div class="stamp-spec">
          <div class="stamp-tile" aria-hidden="true">${logo.seal}</div>
          <span class="stamp-label">Seal</span>
        </div>
        <div class="stamp-spec">
          <div class="stamp-tile mono" aria-hidden="true">${logo.monogram}</div>
          <span class="stamp-label">Monogram</span>
        </div>
        <p class="stamp-note"><b>Apply as a hallmark.</b><br/>Cold-stamp, foil or deboss<br/>on packaging, tags &amp;<br/>authenticity cards.</p>
      </div>
    </section>

    <!-- 05 · Iconography -->
    <section class="panel light" id="icons" aria-label="Iconography">
      ${head("Iconography", "/ 05")}
      <ul class="icon-grid">${ICONS.map(iconCell).join("")}</ul>
    </section>

    <!-- 06 · Photography -->
    <div class="photo-head"><span class="eyebrow">Photography</span><span class="num">/ 06 &mdash; QUIET LUXURY EDITORIAL</span></div>
    <div class="photo-band">${BAND.map(bandTile).join("")}</div>

    <footer class="footer">
      <div class="line"></div>
      <div class="mark">JADE GOLD NYC</div>
      <div class="line"></div>
      <div class="tag">Designed in New York to last</div>
      <div class="line"></div>
    </footer>

  </div>
</body>
</html>`;

mkdirSync(r("public/brand"), { recursive: true });
const out = r("public/brand/jade-gold-nyc-guidelines.html");
writeFileSync(out, html);
console.log("wrote", out, "(" + (html.length / 1024).toFixed(0) + " KB)");
