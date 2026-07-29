import { marketSymbolsFor, transactionDateRange } from "../core/degiro.js";

export async function fetchMarketPrices(transactionText, { refresh = false } = {}) {
  const dateRange = transactionDateRange(transactionText);
  if (!dateRange) {
    const error = new Error("Transactions.csv contains no dated transactions.");
    error.code = "error.noTransactions";
    throw error;
  }

  const symbols = marketSymbolsFor(transactionText);
  const firstDayOfStartMonth = Date.UTC(
    dateRange.start.getUTCFullYear(),
    dateRange.start.getUTCMonth(),
    1,
  );
  const query = new URLSearchParams({
    symbols: symbols.join(","),
    period1: String(Math.floor(firstDayOfStartMonth / 1000)),
    period2: String(Math.floor(Date.now() / 1000) + 86_400),
  });

  if (refresh) query.set("refresh", String(Date.now()));

  const response = await fetch(`/api/prices?${query}`);
  const body = await response.json();

  if (!response.ok) {
    const error = new Error(body.error || "Could not retrieve market prices.");
    error.code = body.error ? null : "error.marketPrices";
    throw error;
  }

  const warnings = Object.entries(body.prices)
    .filter(([, series]) => series.stale)
    .map(([symbol]) => ({
      code: "warning.stalePrices",
      values: { symbol },
    }));

  return {
    prices: body.prices,
    warnings,
    usedStaleCache: warnings.length > 0,
  };
}
