import assert from "node:assert/strict";
import test from "node:test";

import { buildPortfolioModel } from "../public/js/core/portfolio.js";

const accountCsv = [
  "Datum,Tijd,Valutadatum,Product,ISIN,Omschrijving,FX,Unused,Mutatie,Valuta,Saldo",
  "01-01-2024,09:00,,,,flatex deposit,,,1000,EUR,1000",
  "02-01-2024,10:00,,IWDA,IE00B4L5Y983,Koop,,,-500,EUR,500",
  "31-01-2024,18:00,,,,Cash Sweep,,,0,EUR,500",
].join("\n");

const transactionsCsv = [
  "Datum,Tijd,Product,ISIN,Uitvoeringsplaats,Valuta,Aantal,Koers,Koersvaluta,Lokale waarde,Lokale valuta,Waarde in EUR,Wisselkoers,AutoFX,Transactiekosten,Totaal",
  "02-01-2024,10:00,IWDA,IE00B4L5Y983,Euronext Amsterdam,EUR,5,100,EUR,500,EUR,500,1,,2,-502",
].join("\n");

function yahooPrices(entries) {
  return {
    chart: {
      result: [{
        meta: { gmtoffset: 0 },
        timestamp: entries.map(([date]) => Date.parse(`${date}T00:00:00Z`) / 1000),
        indicators: {
          quote: [{ close: entries.map(([, close]) => close) }],
        },
      }],
    },
  };
}

test("portfolio history combines holdings, public prices, and cash", () => {
  const model = buildPortfolioModel({
    accountText: accountCsv,
    transactionText: transactionsCsv,
    marketPayloads: {
      "IWDA.AS": yahooPrices([
        ["2024-01-02", 100],
        ["2024-01-31", 110],
      ]),
    },
    snapshotDate: new Date("2024-01-31T12:00:00Z"),
  });

  assert.equal(model.summary.currentValue, 1050);
  assert.equal(model.summary.contributions, 1000);
  assert.equal(model.summary.gain, 50);
  assert.equal(model.summary.cash, 500);
  assert.equal(model.summary.positions, 1);
  assert.equal(
    model.summary.currentValue,
    model.history.at(-1).investments + model.summary.cash,
  );
  assert.equal(
    model.summary.gain,
    model.summary.currentValue - model.summary.contributions,
  );
  assert.equal(model.allocation[0].short, "IWDA");
  assert.equal(model.allocation[0].value, 550);
  assert.equal(
    model.metadata.priceThrough.toISOString(),
    "2024-01-31T00:00:00.000Z",
  );
  assert.deepEqual(model.warnings, []);
});

test("a complete sale removes the holding without losing realized profit", () => {
  const soldAccount = [
    "Datum,Tijd,Valutadatum,Product,ISIN,Omschrijving,FX,Unused,Mutatie,Valuta,Saldo",
    "01-01-2024,09:00,,,,flatex deposit,,,1000,EUR,1000",
    "02-01-2024,10:00,,IWDA,IE00B4L5Y983,Koop,,,-500,EUR,500",
    "31-01-2024,10:00,,IWDA,IE00B4L5Y983,Verkoop,,,550,EUR,1050",
  ].join("\n");
  const soldTransactions = [
    transactionsCsv,
    "31-01-2024,10:00,IWDA,IE00B4L5Y983,Euronext Amsterdam,EUR,-5,110,EUR,-550,EUR,-550,1,,2,548",
  ].join("\n");
  const model = buildPortfolioModel({
    accountText: soldAccount,
    transactionText: soldTransactions,
    marketPayloads: {
      "IWDA.AS": yahooPrices([
        ["2024-01-02", 100],
        ["2024-01-31", 110],
      ]),
    },
    snapshotDate: new Date("2024-01-31T12:00:00Z"),
  });

  assert.equal(model.summary.positions, 0);
  assert.equal(model.summary.cash, 1050);
  assert.equal(model.summary.currentValue, 1050);
  assert.equal(model.summary.gain, 50);
});

test("USD holdings are converted with the historical EUR/USD close", () => {
  const usdAccount = [
    "Date,Time,Value date,Product,ISIN,Description,FX,Change,Currency,Balance",
    "01/01/2024,09:00,,,,Deposit,,1000,EUR,1000",
    "02/01/2024,10:00,,AMC,US00165C1045,Buy,,-100,EUR,900",
  ].join("\n");
  const usdTransactions = [
    "Date,Time,Product,ISIN,Exchange,Execution venue,Quantity,Price,Currency,Value in EUR,Transaction fees EUR,Total EUR",
    "02/01/2024,10:00,AMC,US00165C1045,NYSE,XNYS,10,12,USD,100,0,-100",
  ].join("\n");
  const model = buildPortfolioModel({
    accountText: usdAccount,
    transactionText: usdTransactions,
    marketPayloads: {
      AMC: { points: [{ date: "2024-01-31", close: 12 }] },
      "EURUSD=X": { points: [{ date: "2024-01-31", close: 1.2 }] },
    },
    snapshotDate: new Date("2024-01-31T12:00:00Z"),
  });

  assert.equal(model.allocation[0].value, 100);
  assert.equal(model.summary.currentValue, 1000);
});

test("unknown instruments and duplicates produce structured warnings", () => {
  const unknownTransactions = [
    "Date,Time,Product,ISIN,Exchange,Execution venue,Quantity,Price,Currency,Value in EUR,Transaction fees EUR,Total EUR,Order ID",
    "02/01/2024,10:00,Unknown,XX0000000001,Test,XTEST,1,100,EUR,100,0,-100,A1",
    "02/01/2024,10:00,Unknown,XX0000000001,Test,XTEST,1,100,EUR,100,0,-100,A1",
  ].join("\n");
  const model = buildPortfolioModel({
    accountText: accountCsv,
    transactionText: unknownTransactions,
    marketPayloads: {},
    snapshotDate: new Date("2024-01-31T12:00:00Z"),
  });

  assert(model.warnings.some((warning) =>
    warning.code === "warning.unknownInstrument"));
  assert(model.warnings.some((warning) =>
    warning.code === "warning.duplicateTransaction"));
});

test("empty exports fail with a stable error code", () => {
  assert.throws(
    () =>
      buildPortfolioModel({
        accountText: "Datum,Tijd,Omschrijving,Mutatie,Saldo",
        transactionText:
          "Datum,Tijd,Product,ISIN,Uitvoeringsplaats,Aantal,Koers,Totaal EUR",
        marketPayloads: {},
      }),
    (error) => error.code === "error.emptyExports",
  );
});
