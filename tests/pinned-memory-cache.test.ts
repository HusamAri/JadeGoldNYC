import assert from "node:assert/strict";
import test from "node:test";
import { PinnedMemoryCache } from "@/lib/pinned-memory-cache";

const PIN = "reviewed-exact-hash";
type Value = { hash: string; complete: boolean; label: string };
function cache(now: () => number = Date.now) {
  return new PinnedMemoryCache<Value>({ ttlMs: 300_000, maxKeys: 2, now,
    accept: (value) => value.hash === PIN && value.complete });
}
function value(label: string): Value { return { hash: PIN, complete: true, label }; }

test("cache reuses only the same org key and expires after exactly five minutes", async () => {
  let time = 1_000; let loads = 0;
  const c = cache(() => time);
  const loader = async () => { loads++; return value(`load-${loads}`); };
  const original = await c.get("org-a", loader);
  time += 299_999;
  assert.equal(await c.get("org-a", loader), original);
  assert.equal(loads, 1);
  assert.notEqual(await c.get("org-b", loader), original);
  time++;
  assert.notEqual(await c.get("org-a", loader), original);
  assert.equal(loads, 3);
});

test("concurrent requests coalesce one complete historical load", async () => {
  const c = cache(); let loads = 0; let release: (value: Value) => void = () => {};
  const loader = () => { loads++; return new Promise<Value>((resolve) => { release = resolve; }); };
  const a = c.get("org-a", loader); const b = c.get("org-a", loader);
  await Promise.resolve(); assert.equal(loads, 1);
  release(value("complete"));
  assert.equal(await a, await b);
  assert.equal((await c.get("org-a", loader)).label, "complete");
  assert.equal(loads, 1);
});

test("failed loads are removed and never become cached partial results", async () => {
  const c = cache(); let loads = 0;
  const loader = async () => { loads++; if (loads === 1) throw new Error("Failed page"); return value("complete"); };
  await assert.rejects(c.get("org-a", loader), /Failed page/);
  assert.equal((await c.get("org-a", loader)).label, "complete");
  assert.equal(loads, 2);
});

test("wrong hashes and incomplete values are returned uncached", async () => {
  const c = cache(); let loads = 0;
  const wrong = async () => { loads++; return { hash: "wrong", complete: true, label: "wrong" }; };
  await c.get("org-a", wrong); await c.get("org-a", wrong);
  const partial = async () => { loads++; return { hash: PIN, complete: false, label: "partial" }; };
  await c.get("org-a", partial); await c.get("org-a", partial);
  assert.equal(loads, 4);
});

test("storage is bounded to two keys with least-recently-used eviction", async () => {
  const c = cache(); const loads = new Map<string, number>();
  const get = (key: string) => c.get(key, async () => { loads.set(key, (loads.get(key) ?? 0) + 1); return value(key); });
  await get("a"); await get("b"); await get("a"); await get("c");
  await get("a"); assert.equal(loads.get("a"), 1);
  await get("b"); assert.equal(loads.get("b"), 2);
});

test("evicted concurrent load cannot overwrite the newer result for its key", async () => {
  const c = cache(); let release: (value: Value) => void = () => {};
  const old = c.get("a", () => new Promise<Value>((resolve) => { release = resolve; }));
  await Promise.resolve();
  await c.get("b", async () => value("b")); await c.get("c", async () => value("c"));
  await c.get("a", async () => value("new-a"));
  release(value("old-a")); await old;
  assert.equal((await c.get("a", async () => value("unexpected"))).label, "new-a");
});
