import assert from "node:assert/strict";
import test from "node:test";

import {
  EtsyRateLimitError,
  etsyRateLimitDetails,
  etsyRateLimitRetryDelayMs,
  parseEtsyRetryAfter,
} from "../lib/etsy/client";

test("parses Retry-After delta seconds and HTTP dates", () => {
  assert.equal(parseEtsyRetryAfter("90"), 90);
  assert.equal(
    parseEtsyRetryAfter("Thu, 01 Jan 2026 00:01:30 GMT", Date.UTC(2026, 0, 1)),
    90,
  );
  assert.equal(parseEtsyRetryAfter("invalid"), null);
});

test("does not retry an exhausted daily quota", () => {
  const details = etsyRateLimitDetails(
    '{"error":"Exceeded daily rate limit"}',
    "3600",
  );
  assert.equal(details.daily, true);
  assert.equal(etsyRateLimitRetryDelayMs(details, 1), null);

  const error = new EtsyRateLimitError(details);
  assert.match(error.message, /günlük API kotası dolu/);
  assert.match(error.message, /1 saat sonra/);
});

test("retries only a short non-daily throttle", () => {
  const shortThrottle = etsyRateLimitDetails("rate limited", "1");
  assert.equal(etsyRateLimitRetryDelayMs(shortThrottle, 1), 1000);
  assert.equal(etsyRateLimitRetryDelayMs(shortThrottle, 0), null);

  const longThrottle = etsyRateLimitDetails("rate limited", "30");
  assert.equal(etsyRateLimitRetryDelayMs(longThrottle, 1), null);
});
