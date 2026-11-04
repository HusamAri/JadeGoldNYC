// Tailwind v4 derlemesi — Next bu konteynerde çalışmadığı için (SWC native
// binding yok) tema CSS'i doğrudan derlenir: syntax hatası burada patlar,
// Vercel'e gitmez. Kullanım: node scripts/theme-lab/compile.mjs
import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const dir = path.dirname(new URL(import.meta.url).pathname);
const from = path.join(dir, "lab.css");
const to = path.join(dir, "out.css");
const css = fs.readFileSync(from, "utf8");
const result = await postcss([tailwind({ base: path.resolve(dir, "../..") })]).process(css, { from, to });
fs.writeFileSync(to, result.css);
console.log("compiled", to, (result.css.length / 1024).toFixed(0) + " KB");
