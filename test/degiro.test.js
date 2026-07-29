import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyDegiroExport,
  contributionsAt,
  duplicateTransactionCount,
  externalCashFlows,
  marketSymbolsFor,
  parseAccountExport,
  parseTransactionsExport,
  transactionDateRange,
} from "../public/js/core/degiro.js";

const accountCsv = [
  "Datum,Tijd,Valutadatum,Product,ISIN,Omschrijving,FX,Unused,Mutatie,Valuta,Saldo",
  "01-01-2024,09:00,,,,flatex deposit,,,1000,EUR,1000",
  "02-01-2024,10:00,,IWDA,IE00B4L5Y983,Koop,,,-500,EUR,500",
].join("\n");

const transactionsCsv = [
  "Datum,Tijd,Product,ISIN,Uitvoeringsplaats,Valuta,Aantal,Koers,Koersvaluta,Lokale waarde,Lokale valuta,Waarde in EUR,Wisselkoers,AutoFX,Transactiekosten,Totaal",
  "02-01-2024,10:00,IWDA,IE00B4L5Y983,Euronext Amsterdam,EUR,5,100,EUR,500,EUR,500,1,,2,-502",
].join("\n");

test("DEGIRO exports are identified by their headers, not filenames", () => {
  assert.equal(classifyDegiroExport(accountCsv), "account");
  assert.equal(classifyDegiroExport(transactionsCsv), "transactions");
  assert.equal(classifyDegiroExport("Name,Value\nA,1"), null);
});

test("account and transaction exports are normalized into typed rows", () => {
  const accountRows = parseAccountExport(accountCsv);
  const transactions = parseTransactionsExport(transactionsCsv);

  assert.equal(accountRows.length, 2);
  assert.equal(accountRows[0].amount, 1000);
  assert.equal(accountRows.at(-1).balance, 500);
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].quantity, 5);
  assert.equal(transactions[0].feesEur, 2);
});

test("market requirements come from the instruments in Transactions.csv", () => {
  assert.deepEqual(marketSymbolsFor(transactionsCsv), ["IWDA.AS"]);
  assert.deepEqual(transactionDateRange(transactionsCsv), {
    start: new Date("2024-01-02T00:00:00.000Z"),
    end: new Date("2024-01-02T00:00:00.000Z"),
  });
});

test("deposits and withdrawals are treated as external cash flows", () => {
  const rows = parseAccountExport([
    "Datum,Tijd,Valutadatum,Product,ISIN,Omschrijving,FX,Unused,Mutatie,Valuta,Saldo",
    "01-01-2024,09:00,,,,flatex deposit,,,1000,EUR,1000",
    "01-02-2024,09:00,,,,flatex withdrawal,,,-200,EUR,800",
  ].join("\n"));
  const date = new Date("2024-02-01T00:00:00.000Z");

  assert.equal(contributionsAt(rows, date), 800);
  assert.deepEqual(externalCashFlows(rows), [
    { date: new Date("2024-01-01T00:00:00.000Z"), amount: -1000 },
    { date, amount: 200 },
  ]);
});

test("localized headers and descriptions are recognized", () => {
  const localizedAccounts = [
    [
      "Date,Time,Value date,Product,ISIN,Description,FX,Change,Currency,Balance",
      "01/01/2024,09:00,,,,Deposit,,1000,EUR,1000",
    ],
    [
      "Datum,Uhrzeit,Wertstellungsdatum,Produkt,ISIN,Beschreibung,FX,Änderung,Währung,Kontostand",
      "01.01.2024,09:00,,,,Einzahlung,,1000,EUR,1000",
    ],
    [
      "Date,Heure,Date de valeur,Produit,ISIN,Description,FX,Variation,Devise,Solde",
      "01/01/2024,09:00,,,,Dépôt,,1000,EUR,1000",
    ],
  ];
  const localizedTransactions = [
    [
      "Date,Time,Product,ISIN,Exchange,Execution venue,Quantity,Price,Currency,Value in EUR,Transaction fees EUR,Total EUR",
      "02/01/2024,10:00,IWDA,IE00B4L5Y983,Amsterdam,XAMS,5,100,EUR,500,2,-502",
    ],
    [
      "Datum,Uhrzeit,Produkt,ISIN,Börse,Ausführungsplatz,Menge,Preis,Währung,Wert EUR,Transaktionskosten EUR,Gesamt EUR",
      "02.01.2024,10:00,IWDA,IE00B4L5Y983,Amsterdam,XAMS,5,100,EUR,500,2,-502",
    ],
    [
      "Date,Heure,Produit,ISIN,Bourse,Lieu d'exécution,Quantité,Prix,Devise,Valeur EUR,Frais de transaction EUR,Total EUR",
      "02/01/2024,10:00,IWDA,IE00B4L5Y983,Amsterdam,XAMS,5,100,EUR,500,2,-502",
    ],
  ];

  for (const rows of localizedAccounts) {
    const csv = rows.join("\n");
    assert.equal(classifyDegiroExport(csv), "account");
    assert.equal(parseAccountExport(csv)[0].amount, 1000);
    assert.equal(contributionsAt(parseAccountExport(csv), new Date("2024-01-02")), 1000);
  }

  for (const rows of localizedTransactions) {
    const csv = rows.join("\n");
    assert.equal(classifyDegiroExport(csv), "transactions");
    assert.equal(parseTransactionsExport(csv)[0].quantity, 5);
  }
});

test("exact duplicate transaction rows are reported but retained", () => {
  const duplicateCsv = `${transactionsCsv}\n${transactionsCsv.split("\n")[1]}`;
  const transactions = parseTransactionsExport(duplicateCsv);

  assert.equal(transactions.length, 2);
  assert.equal(duplicateTransactionCount(transactions), 1);
});
