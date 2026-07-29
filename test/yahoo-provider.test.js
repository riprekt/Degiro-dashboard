import assert from "node:assert/strict";
import test from "node:test";

import { createYahooProvider } from "../server/market/yahoo-provider.mjs";

function response({ status = 200, retryAfter = null, payload = null }) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        return name === "retry-after" ? retryAfter : null;
      },
    },
    async json() {
      return (
        payload ?? {
          chart: {
            result: [
              {
                meta: { gmtoffset: 0 },
                timestamp: [1_704_153_600],
                indicators: { quote: [{ close: [42.5] }] },
              },
            ],
          },
        }
      );
    },
  };
}

test("a rate-limited request retries on the alternate Yahoo host", async () => {
  const urls = [];
  const delays = [];
  const responses = [
    response({ status: 429, retryAfter: "1" }),
    response({ status: 200 }),
  ];
  const provider = createYahooProvider({
    async fetchImpl(url) {
      urls.push(url);
      return responses.shift();
    },
    async wait(milliseconds) {
      delays.push(milliseconds);
    },
  });

  const points = await provider.fetchDailyCloses("SWRD.AS", 1, 2);

  assert.equal(urls.length, 2);
  assert.match(urls[0], /^https:\/\/query2\.finance\.yahoo\.com/);
  assert.match(urls[1], /^https:\/\/query1\.finance\.yahoo\.com/);
  assert.deepEqual(delays, [1000]);
  assert.deepEqual(points, [{ date: "2024-01-02", close: 42.5 }]);
});

test("persistent rate limiting returns an actionable error", async () => {
  let calls = 0;
  const provider = createYahooProvider({
    async fetchImpl() {
      calls += 1;
      return response({ status: 429 });
    },
    async wait() {},
  });

  await assert.rejects(
    provider.fetchDailyCloses("SWRD.AS", 1, 2),
    /temporarily rate-limiting requests.*try again/i,
  );
  assert.equal(calls, 3);
});

test("non-temporary errors are not retried", async () => {
  let calls = 0;
  const provider = createYahooProvider({
    async fetchImpl() {
      calls += 1;
      return response({ status: 404 });
    },
  });

  await assert.rejects(
    provider.fetchDailyCloses("UNKNOWN", 1, 2),
    /HTTP 404/,
  );
  assert.equal(calls, 1);
});
