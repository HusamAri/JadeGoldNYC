#!/usr/bin/env node
/**
 * Buyer Memory loop launcher — Cursor Cloud Agents API.
 *
 * Usage:
 *   CURSOR_API_KEY=… node scripts/buyer-memory-loops/launch.mjs A
 *   CURSOR_API_KEY=… node scripts/buyer-memory-loops/launch.mjs D --pr-url https://github.com/…
 *
 * Auth: https://cursor.com/dashboard/api → User API Key → repo secret CURSOR_API_KEY
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const REPO_URL = "https://github.com/HusamAri/JadeGoldNYC";
const STARTING_REF = "claude/serene-knuth-js7wvl";
const API = "https://api.cursor.com/v1/agents";

const LOOPS = {
  A: {
    name: "Buyer Memory · Capture Etsy variations",
    file: "A-capture.txt",
    autoCreatePR: true,
  },
  B: {
    name: "Buyer Memory · Identity + /musteriler",
    file: "B-identity.txt",
    autoCreatePR: true,
  },
  C: {
    name: "Buyer Memory · Return reminder",
    file: "C-remind.txt",
    autoCreatePR: true,
  },
  D: {
    name: "Buyer Memory · Clean UI gate",
    file: "D-clean-gate.txt",
    autoCreatePR: false,
  },
  E: {
    name: "Buyer Memory · Quality dig",
    file: "E-quality.txt",
    autoCreatePR: true,
  },
};

function argVal(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const loopId = (process.argv[2] || "").toUpperCase();
const prUrl = argVal("--pr-url");
const key = process.env.CURSOR_API_KEY;

if (!LOOPS[loopId]) {
  console.error(`Usage: launch.mjs <A|B|C|D|E> [--pr-url <url>]`);
  process.exit(1);
}
if (!key) {
  console.error(
    "CURSOR_API_KEY missing. Create at https://cursor.com/dashboard/api and add as GitHub Actions secret.",
  );
  process.exit(2);
}

const loop = LOOPS[loopId];
const promptText = readFileSync(join(__dir, "prompts", loop.file), "utf8").trim();

const body = {
  name: loop.name.slice(0, 100),
  prompt: { text: promptText },
  repos: [
    {
      url: REPO_URL,
      startingRef: STARTING_REF,
      ...(prUrl ? { prUrl } : {}),
    },
  ],
  autoCreatePR: loop.autoCreatePR,
  skipReviewerRequest: true,
};

const auth = Buffer.from(`${key}:`).toString("base64");
const res = await fetch(API, {
  method: "POST",
  headers: {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const text = await res.text();
if (!res.ok) {
  console.error(`Cursor API ${res.status}: ${text}`);
  process.exit(1);
}

let json;
try {
  json = JSON.parse(text);
} catch {
  console.log(text);
  process.exit(0);
}

const agentId = json.agent?.id ?? json.id ?? "?";
const runId = json.run?.id ?? "?";
const url =
  json.agent?.url ??
  (typeof agentId === "string" && agentId.startsWith("bc-")
    ? `https://cursor.com/agents/${agentId}`
    : null);

console.log(`Launched loop ${loopId}: ${loop.name}`);
console.log(`agent=${agentId} run=${runId}`);
if (url) console.log(url);
