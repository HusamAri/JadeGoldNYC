// Playwright: tema laboratuvarını açık/koyu ve beş tonda çeker, computed
// renklerden WCAG kontrastını ölçer. Kullanım: node scripts/theme-lab/shoot.mjs
import path from "node:path";
import fs from "node:fs";
// Konteynerde playwright global kurulu (/opt/node-tools); repoya bağımlılık eklenmez.
const pw = await import(process.env.PLAYWRIGHT_PKG || "/opt/node-tools/node_modules/playwright/index.js");
const chromium = pw.chromium ?? pw.default.chromium;

const dir = path.dirname(new URL(import.meta.url).pathname);
const out = process.env.LAB_OUT || path.join(dir, "shots");
fs.mkdirSync(out, { recursive: true });
const url = "file://" + path.join(dir, "lab.html");

function lum([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }
// Chromium oklch() renklerini oklch dizesi olarak döndürür; sRGB'ye canvas ile çevrilir (sayfa içinde).

const browser = await chromium.launch();
const report = [];
for (const scheme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, colorScheme: scheme, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(url);
  if (scheme === "dark") await page.evaluate(() => document.documentElement.classList.add("dark"));
  for (const tone of ["moss", "olive", "forest", "lichen", "slate"]) {
    await page.evaluate((t) => document.getElementById("frame").setAttribute("data-tone", t), tone);
    await page.waitForTimeout(80);
    const m = await page.evaluate(() => {
      const cs = (id) => getComputedStyle(document.getElementById(id));
      const cv = document.createElement("canvas"); cv.width = cv.height = 1;
      const c2 = cv.getContext("2d", { willReadFrequently: true });
      const toRgb = (col) => { c2.clearRect(0,0,1,1); c2.fillStyle = "#000"; c2.fillRect(0,0,1,1); c2.fillStyle = col; c2.fillRect(0,0,1,1); const d = c2.getImageData(0,0,1,1).data; return `rgb(${d[0]} ${d[1]} ${d[2]})`; };
      const bg = toRgb(cs("frame").backgroundColor);
      const pick = (id, prop = "color") => prop === "color" || prop.endsWith("Color") ? toRgb(cs(id)[prop]) : cs(id)[prop];
      return {
        bg,
        fg: pick("h2"), muted: pick("desc"), th: pick("th"), gold: pick("gold-text"), pos: toRgb(getComputedStyle(document.querySelector("#kpi .text-\\[var\\(--positive\\)\\]")).color),
        neg: pick("neg"), hairline: pick("input", "borderTopColor"), heroBg: pick("btn-hero", "backgroundImage"), heroFg: pick("btn-hero"),
        kpiShadow: pick("kpi", "boxShadow").slice(0, 120), wellShadow: pick("well", "boxShadow").slice(0, 100),
        navActiveBg: pick("nav-active", "backgroundImage").slice(0, 80),
      };
    });
    const parse = (str) => str.match(/\d+/g).slice(0, 3).map(Number);
    const bg = parse(m.bg);
    const row = {
      scheme, tone, bg: m.bg,
      fg: ratio(parse(m.fg), bg).toFixed(2), muted: ratio(parse(m.muted), bg).toFixed(2), th: ratio(parse(m.th), bg).toFixed(2),
      gold: ratio(parse(m.gold), bg).toFixed(2), pos: ratio(parse(m.pos), bg).toFixed(2), neg: ratio(parse(m.neg), bg).toFixed(2),
      hairline: ratio(parse(m.hairline), bg).toFixed(2),
    };
    report.push(row);
    if (tone === "moss" || tone === "forest") await page.screenshot({ path: path.join(out, `${scheme}-${tone}.png`), fullPage: false });
    if (tone === "moss") report.push({ note: `${scheme} kpiShadow: ${m.kpiShadow} | well: ${m.wellShadow} | nav: ${m.navActiveBg}` });
  }
  await ctx.close();
}
await browser.close();
console.table(report.filter((r) => !r.note));
for (const r of report.filter((r) => r.note)) console.log(r.note);
