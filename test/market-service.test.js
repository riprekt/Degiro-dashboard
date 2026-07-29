import assert from "node:assert/strict";
import test from "node:test";

import { createMarketService } from "../server/market/market-service.mjs";

function memoryCache(initialEntry = null) {
  let entry = initialEntry;
  return {
    async read() {
      return entry;
    },
    async write(_symbol, nextEntry) {
      entry = nextEntry;
    },
    value() {
      return entry;
    },
  };
}

const request = {
  symbols: ["TEST"],
  period1: Date.parse("2024-01-01T00:00:00Z") / 1000,
  period2: Date.parse("2024-02-01T00:00:00Z") / 1000,
};
const currentTime = Date.parse("2024-02-01T12:00:00Z");

test("a fresh complete cache avoids a provider request", async () => {
  const cache = memoryCache({
    version: 1,
    symbol: "TEST",
    source: "Test",
    fetchedAt: new Date(currentTime - 60_000).toISOString(),
    coveredFrom: request.period1,
    points: [{ date: "2024-01-31", close: 110 }],
  });
  let providerCalls = 0;
  const service = createMarketService({
    cache,
    provider: {
      name: "Test",
      async fetchDailyCloses() {
        providerCalls += 1;
        return [];
      },
    },
    now: () => currentTime,
  });

  const prices = await service.getPrices(request);

  assert.equal(providerCalls, 0);
  assert.equal(prices.TEST.stale, false);
  assert.equal(prices.TEST.points[0].close, 110);
});

test("a stale cache is refreshed and merged by date", async () => {
  const cache = memoryCache({
    version: 1,
    symbol: "TEST",
    source: "Test",
    fetchedAt: "2024-01-01T00:00:00.000Z",
    coveredFrom: request.period1,
    points: [
      { date: "2024-01-30", close: 100 },
      { date: "2024-01-31", close: 105 },
    ],
  });
  const service = createMarketService({
    cache,
    provider: {
      name: "Test",
      async fetchDailyCloses() {
        return [
          { date: "2024-01-31", close: 106 },
          { date: "2024-02-01", close: 110 },
        ];
      },
    },
    now: () => currentTime,
  });

  const prices = await service.getPrices(request);

  assert.deepEqual(prices.TEST.points, [
    { date: "2024-01-30", close: 100 },
    { date: "2024-01-31", close: 106 },
    { date: "2024-02-01", close: 110 },
  ]);
  assert.deepEqual(cache.value().points, prices.TEST.points);
});

test("a complete stale cache remains available when refresh fails", async () => {
  const cache = memoryCache({
    version: 1,
    symbol: "TEST",
    source: "Test",
    fetchedAt: "2024-01-01T00:00:00.000Z",
    coveredFrom: request.period1,
    points: [{ date: "2024-01-31", close: 105 }],
  });
  const service = createMarketService({
    cache,
    provider: {
      name: "Test",
      async fetchDailyCloses() {
        throw new Error("offline");
      },
    },
    now: () => currentTime,
  });

  const prices = await service.getPrices(request);

  assert.equal(prices.TEST.stale, true);
  assert.equal(prices.TEST.refreshError, "offline");
  assert.equal(prices.TEST.points[0].close, 105);
});
