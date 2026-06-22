// Builds a self-contained Jade Gold NYC brand guidelines board (fixed-canvas HTML).
// - Inlines the authored transparent SVG logo/icon system (public/brand/{logo,icons}).
// - Base64-embeds real product photography (public/brand/gallery) so the file is
//   self-contained (required for a clean Adobe Express import — no external fetch).
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
  ["public/brand/gallery/nyc-rosary.webp", "Rosary · cathedral"],
].map(([p, cap]) => ({ src: dataUri(p), cap }));

// ---- Markup helpers ------------------------------------------------------
const swatch = (c) => `
  <div class="chip">
    <div class="chip-color" style="background:${c.hex};${c.dark ? "" : "border:1px solid rgba(19,19,19,.12)"}"></div>
    <div class="chip-meta">
      <span class="chip-name">${c.name}</span>
      <span class="chip-hex">${c.hex.toUpperCase()}</span>
      <span class="chip-use">${c.use}</span>
    </div>
  </div>`;

const iconCell = (i) => `
  <div class="icon-cell">
    <div class="icon-art">${i.svg}</div>
    <span class="icon-label">${i.label}</span>
  </div>`;

const bandTile = (t, i) => `
  <figure class="ph" style="left:${i * (220 + 10)}px">
    <img src="${t.src}" width="220" height="184" alt="${t.cap}"/>
    <figcaption>${t.cap}</figcaption>
  </figure>`;

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
  .board::before { /* subtle inner frame */
    content:""; position:absolute; inset:30px; border:1px solid rgba(184,147,71,.28); pointer-events:none;
  }

  /* ---- shared type ---- */
  .eyebrow { font-family:${SANS}; font-weight:700; font-size:12px; letter-spacing:3.4px;
             text-transform:uppercase; color:${GOLD}; }
  .num { font-family:${SANS}; font-weight:500; font-size:11px; letter-spacing:2px; color:${STONE}; }

  /* ---- header ---- */
  .header { position:absolute; left:64px; top:62px; right:64px; height:104px;
            display:flex; justify-content:space-between; align-items:flex-start; }
  .h-brand { font-family:${SANS}; font-weight:500; font-size:34px; letter-spacing:13px; color:${GOLD}; line-height:1; }
  .h-sub { font-family:${SANS}; font-weight:500; font-size:11px; letter-spacing:6px; color:${STONE}; margin-top:12px; }
  .h-right { text-align:right; }
  .h-title { font-family:${SERIF}; font-style:italic; font-size:24px; color:${IVORY}; line-height:1; }
  .h-meta { font-family:${SANS}; font-weight:500; font-size:11px; letter-spacing:4px; color:${STONE}; margin-top:12px; }
  .rule { position:absolute; left:64px; right:64px; top:178px; height:1px; background:linear-gradient(90deg,${GOLD},rgba(184,147,71,.15)); }

  /* ---- hero feature ---- */
  .hero { position:absolute; left:64px; top:198px; width:548px; height:594px; overflow:hidden; }
  .hero img { width:100%; height:100%; object-fit:cover; filter:saturate(.92) contrast(1.02); }
  .hero .scrim { position:absolute; inset:0;
    background:linear-gradient(180deg, rgba(19,19,19,.55) 0%, rgba(19,19,19,0) 30%, rgba(19,19,19,.18) 55%, rgba(19,19,19,.9) 100%); }
  .hero .seal { position:absolute; top:26px; left:26px; width:96px; height:96px; opacity:.96; }
  .hero .cap { position:absolute; left:34px; right:34px; bottom:36px; }
  .hero .cap h2 { font-family:${SERIF}; font-weight:400; font-size:52px; line-height:.98; color:${IVORY}; letter-spacing:.5px; }
  .hero .cap h2 em { font-style:italic; color:${GOLD}; }
  .hero .cap p { font-family:${SANS}; font-weight:500; font-size:13px; letter-spacing:5px; color:${STONE};
                 text-transform:uppercase; margin-top:16px; }

  /* ---- panel base ---- */
  .panel { position:absolute; }
  .panel-head { display:flex; align-items:baseline; gap:12px; margin-bottom:14px; }
  .light { background:${IVORY}; color:${CHAR}; }
  .light .eyebrow { color:#8a6d2f; }
  .light .num { color:#9a8f7a; }
  .dark-card { border:1px solid rgba(184,147,71,.30); }

  /* logo system */
  #logosys { left:636px; top:198px; width:1028px; height:230px; padding:24px 30px; }
  .logo-grid { display:flex; align-items:center; height:152px; margin-top:6px; }
  .logo-grid > div { flex:1; display:flex; align-items:center; justify-content:center; height:100%;
                     border-right:1px solid rgba(19,19,19,.12); padding:0 18px; }
  .logo-grid > div:last-child { border-right:0; }
  .lg-primary svg { width:210px; } .lg-word svg { width:212px; }
  .lg-stack svg { height:128px; } .lg-mono svg { height:118px; }
  .logo-cap { position:absolute; bottom:14px; font-family:${SANS}; font-weight:500; font-size:9.5px;
              letter-spacing:2px; color:#9a8f7a; text-transform:uppercase; }

  /* color */
  #color { left:636px; top:446px; width:504px; height:172px; padding:22px 26px; }
  .chips { display:flex; flex-direction:column; gap:9px; margin-top:6px; }
  .chip { display:flex; align-items:center; gap:14px; }
  .chip-color { width:46px; height:30px; border-radius:2px; flex:none; }
  .chip-meta { display:flex; align-items:baseline; gap:10px; width:100%; }
  .chip-name { font-family:${SANS}; font-weight:700; font-size:12px; letter-spacing:.6px; color:${IVORY}; width:120px; }
  .chip-hex { font-family:${SANS}; font-weight:500; font-size:11px; letter-spacing:1.5px; color:${GOLD}; width:84px; }
  .chip-use { font-family:${SANS}; font-weight:500; font-size:10px; letter-spacing:.4px; color:${STONE}; }

  /* typography */
  #type { left:1164px; top:446px; width:500px; height:172px; padding:22px 26px; }
  .type-row { display:flex; gap:24px; margin-top:8px; }
  .type-spec { flex:1; }
  .type-Aa { font-size:62px; line-height:.9; color:${IVORY}; }
  .type-Aa.s { font-family:${SERIF}; font-weight:400; }
  .type-Aa.g { font-family:${SANS}; font-weight:500; }
  .type-name { font-family:${SANS}; font-weight:700; font-size:12px; letter-spacing:1px; color:${GOLD}; margin-top:12px; }
  .type-desc { font-family:${SANS}; font-weight:500; font-size:10.5px; letter-spacing:.3px; color:${STONE}; margin-top:5px; line-height:1.5; }

  /* submarks */
  #stamps { left:636px; top:638px; width:504px; height:154px; padding:18px 26px; }
  .stamp-row { display:flex; align-items:center; gap:26px; margin-top:4px; }
  .stamp-row svg { display:block; }
  .stamp-seal { width:104px; height:104px; }
  .stamp-mono { width:78px; height:78px; }
  .stamp-note { font-family:${SANS}; font-weight:500; font-size:10.5px; letter-spacing:.3px; color:${STONE}; line-height:1.55; }
  .stamp-note b { color:${IVORY}; font-weight:700; letter-spacing:.6px; }

  /* iconography */
  #icons { left:1164px; top:638px; width:500px; height:154px; padding:18px 24px; }
  .icon-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:4px 8px; margin-top:6px; }
  .icon-cell { display:flex; flex-direction:column; align-items:center; gap:5px; }
  .icon-art { width:30px; height:30px; }
  .icon-art svg { width:100%; height:100%; }
  .icon-label { font-family:${SANS}; font-weight:500; font-size:8px; letter-spacing:1px; color:#9a8f7a; text-transform:uppercase; }

  /* photography band */
  .photo-head { position:absolute; left:64px; top:812px; display:flex; align-items:baseline; gap:12px; }
  .photo-band { position:absolute; left:64px; top:838px; width:1600px; height:184px; }
  .ph { position:absolute; top:0; width:220px; height:184px; overflow:hidden; }
  .ph img { width:100%; height:100%; object-fit:cover; filter:saturate(.92) contrast(1.02); display:block; }
  .ph figcaption { position:absolute; left:8px; bottom:7px; right:8px;
     font-family:${SANS}; font-weight:500; font-size:8.5px; letter-spacing:1px; text-transform:uppercase;
     color:${IVORY}; text-shadow:0 1px 3px rgba(0,0,0,.85); }

  /* footer */
  .footer { position:absolute; left:64px; right:64px; top:1046px; height:46px;
            display:flex; align-items:center; justify-content:space-between; }
  .footer .line { flex:1; height:1px; background:rgba(184,147,71,.3); }
  .footer .mark { font-family:${SANS}; font-weight:500; font-size:12px; letter-spacing:8px; color:${GOLD}; padding:0 22px; }
  .footer .tag { font-family:${SANS}; font-weight:500; font-size:10px; letter-spacing:4px; color:${STONE}; padding:0 22px; text-transform:uppercase; }
</style>
</head>
<body>
  <div class="board" data-canvas-width="1728" data-canvas-height="1152">

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

    <section class="hero">
      <img src="${HERO}" width="548" height="594" alt="Gold Franco chain on volcanic stone"/>
      <div class="scrim"></div>
      <div class="seal">${logo.seal}</div>
      <div class="cap">
        <h2>Modern<br/><em>Heirlooms</em></h2>
        <p>Built to be lived in</p>
      </div>
    </section>

    <section class="panel light dark-card" id="logosys">
      <div class="panel-head"><span class="eyebrow">Logo System</span><span class="num">/ 01</span></div>
      <div class="logo-grid">
        <div class="lg-primary">${logo.primary}</div>
        <div class="lg-word">${logo.wordmark}</div>
        <div class="lg-stack">${logo.stacked}</div>
        <div class="lg-mono">${logo.monogram}</div>
      </div>
    </section>

    <section class="panel dark-card" id="color">
      <div class="panel-head"><span class="eyebrow">Colour</span><span class="num">/ 02</span></div>
      <div class="chips">${PALETTE.map(swatch).join("")}</div>
    </section>

    <section class="panel dark-card" id="type">
      <div class="panel-head"><span class="eyebrow">Typography</span><span class="num">/ 03</span></div>
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
    </section>

    <section class="panel light dark-card" id="stamps">
      <div class="panel-head"><span class="eyebrow">Submarks &amp; Stamps</span><span class="num">/ 04</span></div>
      <div class="stamp-row">
        <div class="stamp-seal">${logo.seal}</div>
        <div class="stamp-mono">${logo.monogram}</div>
        <p class="stamp-note"><b>Apply as a hallmark.</b><br/>Foil or deboss on packaging,<br/>tags &amp; authenticity cards.</p>
      </div>
    </section>

    <section class="panel light dark-card" id="icons">
      <div class="panel-head"><span class="eyebrow">Iconography</span><span class="num">/ 05</span></div>
      <div class="icon-grid">${ICONS.map(iconCell).join("")}</div>
    </section>

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
