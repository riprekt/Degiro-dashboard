import assert from "node:assert/strict";
import test from "node:test";

import { createInstrumentResolver } from "../server/market/instrument-resolver.mjs";

function memoryCache(initial = {}) {
  const entries = new Map(Object.entries(initial));
  return {
    async read(isin) {
      return entries.get(isin) ?? null;
    },
    async write(isin, instrument) {
      entries.set(isin, instrument);
    },
  };
}

test("an ISIN resolves to a portfolio symbol and an available price listing", async () => {
  const calls = [];
  const resolver = createInstrumentResolver({
    cache: memoryCache(),
    client: {
      async map(jobs) {
        calls.push(jobs);
        return [
          { data: [{ ticker: "EMIM", name: "iShares Core MSCI EM IMI" }] },
          { data: [{ ticker: "IS3N", name: "iShares Core MSCI EM IMI" }] },
        ];
      },
      async search() {
        throw new Error("Search should not be needed.");
      },
    },
    now: () => Date.parse("2026-07-29T12:00:00Z"),
  });

  const result = await resolver.resolveMany([{
    isin: "IE00BKM4GZ66",
    name: "iShares Core MSCI Emerging Markets IMI",
    currency: "EUR",
    venues: ["XAMS"],
  }]);

  assert.deepEqual(calls[0], [
    {
      idType: "ID_ISIN",
      idValue: "IE00BKM4GZ66",
      currency: "EUR",
      micCode: "XAMS",
    },
    {
      idType: "ID_ISIN",
      idValue: "IE00BKM4GZ66",
      currency: "EUR",
      micCode: "XETR",
    },
  ]);
  assert.deepEqual(result.unresolved, []);
  assert.equal(result.instruments.IE00BKM4GZ66.ticker, "EMIM.AS");
  assert.equal(result.instruments.IE00BKM4GZ66.priceSymbol, "IS3N.DEX");
});

test("fresh resolutions are reused without contacting OpenFIGI", async () => {
  const cached = {
    version: 1,
    isin: "IE00B4L5Y983",
    shortName: "IWDA",
    name: "iShares Core MSCI World",
    ticker: "IWDA.AS",
    priceSymbol: "EUNL.DEX",
    currency: "EUR",
    resolvedAt: "2026-07-28T12:00:00.000Z",
    source: "OpenFIGI",
  };
  const resolver = createInstrumentResolver({
    cache: memoryCache({ [cached.isin]: cached }),
    client: {
      async map() {
        throw new Error("OpenFIGI should not be contacted.");
      },
    },
    now: () => Date.parse("2026-07-29T12:00:00Z"),
  });

  const result = await resolver.resolveMany([{
    isin: cached.isin,
    name: cached.name,
    currency: "EUR",
    venues: ["XAMS"],
  }]);

  assert.deepEqual(result.instruments[cached.isin], cached);
});

test("the product name is used when an old ISIN no longer maps directly", async () => {
  const resolver = createInstrumentResolver({
    cache: memoryCache(),
    client: {
      async map() {
        return [{ error: "No identifier found." }, { error: "No identifier found." }];
      },
      async search(query, currency) {
        assert.equal(query, "AMC Entertainment");
        assert.equal(currency, "USD");
        return {
          data: [{
            ticker: "AMC",
            name: "AMC Entertainment Holdings Inc",
            exchCode: "US",
          }],
        };
      },
    },
    now: () => Date.parse("2026-07-29T12:00:00Z"),
  });

  const result = await resolver.resolveMany([{
    isin: "US00165C1045",
    name: "AMC Entertainment",
    currency: "USD",
    venues: ["XNYS"],
  }]);

  assert.equal(result.instruments.US00165C1045.ticker, "AMC");
  assert.equal(result.instruments.US00165C1045.priceSymbol, "AMC");
});
