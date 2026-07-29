import assert from "node:assert/strict";
import test from "node:test";

import {
  parseCsv,
  parseDegiroDate,
  parseEuropeanNumber,
} from "../public/js/core/csv.js";

test("parseCsv handles commas, quotes, and line endings", () => {
  const rows = parseCsv('Name,Note\r\n"World ETF","Said ""hello"", once"\r\n');

  assert.deepEqual(rows, [
    ["Name", "Note"],
    ["World ETF", 'Said "hello", once'],
  ]);
});

test("DEGIRO values use European number and date formats", () => {
  assert.equal(parseEuropeanNumber("12.345,67"), 12345.67);
  assert.equal(parseEuropeanNumber("-42,10"), -42.1);
  assert.equal(parseEuropeanNumber(""), null);
  assert.equal(parseDegiroDate("29-07-2026").toISOString(), "2026-07-29T00:00:00.000Z");
  assert.equal(parseDegiroDate("2026-07-29").toISOString(), "2026-07-29T00:00:00.000Z");
});
