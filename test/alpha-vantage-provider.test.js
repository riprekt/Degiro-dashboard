import assert from "node:assert/strict";
import test from "node:test";

import { createAlphaVantageProvider } from "../server/market/alpha-vantage-provider.mjs";

function response(payload) {
  return {
    ok: true,
    async json() {
      return payload;
    },
  };
}

test("an API key is required before the provider starts", () => {
  assert.throws(
    () => createAlphaVantageProvider(),
    /Missing ALPHA_VANTAGE_API_KEY/,
  );
});

test("DEGIRO symbols map to verified Alpha Vantage listings", async () => {
  let requestedUrl;
  const provider = createAlphaVantageProvider({
    apiKey: "test-key",
    async fetchImpl(url) {
      requestedUrl = new URL(url);
      return response({
        "Weekly Adjusted Time Series": {
          "2024-01-12": { "5. adjusted close": "42.50" },
          "2024-01-05": { "5. adjusted close": "40.25" },
        },
      });
    },
  });

  const points = await provider.fetchDailyCloses(
    "SWRD.AS",
    Date.parse("2024-01-01T00:00:00Z") / 1000,
    Date.parse("2024-02-01T00:00:00Z") / 1000,
  );

  assert.equal(requestedUrl.searchParams.get("symbol"), "SPPW.DEX");
  assert.equal(requestedUrl.searchParams.get("apikey"), "test-key");
  assert.deepEqual(points, [
    { date: "2024-01-05", close: 40.25 },
    { date: "2024-01-12", close: 42.5 },
  ]);
});

test("EUR/USD uses the forex history endpoint", async () => {
  let requestedUrl;
  const provider = createAlphaVantageProvider({
    apiKey: "test-key",
    async fetchImpl(url) {
      requestedUrl = new URL(url);
      return response({
        "Time Series FX (Weekly)": {
          "2024-01-05": { "4. close": "1.0950" },
        },
      });
    },
  });

  const points = await provider.fetchDailyCloses(
    "EURUSD=X",
    Date.parse("2024-01-01T00:00:00Z") / 1000,
    Date.parse("2024-02-01T00:00:00Z") / 1000,
  );

  assert.equal(requestedUrl.searchParams.get("function"), "FX_WEEKLY");
  assert.equal(requestedUrl.searchParams.get("from_symbol"), "EUR");
  assert.equal(requestedUrl.searchParams.get("to_symbol"), "USD");
  assert.deepEqual(points, [{ date: "2024-01-05", close: 1.095 }]);
});

test("API limit responses produce the provider message", async () => {
  const provider = createAlphaVantageProvider({
    apiKey: "test-key",
    async fetchImpl() {
      return response({ Information: "Daily request limit reached." });
    },
  });

  await assert.rejects(
    provider.fetchDailyCloses("AMC", 1, 2),
    /AMC: Daily request limit reached/,
  );
});
