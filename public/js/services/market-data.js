import {
  instrumentRequirements,
  transactionDateRange,
} from "../core/degiro.js";

export async function fetchMarketPrices(transactionText, { refresh = false } = {}) {
  const dateRange = transactionDateRange(transactionText);
  if (!dateRange) {
    const error = new Error("Transactions.csv contains no dated transactions.");
    error.code = "error.noTransactions";
    throw error;
  }

  const instruments = instrumentRequirements(transactionText);
  const firstDayOfStartMonth = Date.UTC(
    dateRange.start.getUTCFullYear(),
    dateRange.start.getUTCMonth(),
    1,
  );
  const request = {
    instruments,
    period1: Math.floor(firstDayOfStartMonth / 1000),
    period2: Math.floor(Date.now() / 1000) + 86_400,
    refresh,
  };
  const response = await fetch("/api/market-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
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
  const series = Object.values(body.prices);
  const refreshError = series.find((entry) => entry.refreshError)?.refreshError;

  return {
    instruments: body.instruments,
    prices: body.prices,
    warnings,
    usedStaleCache: warnings.length > 0,
    refreshError,
    refreshSkipped:
      refresh && series.length > 0 && series.every((entry) => entry.refreshSkipped),
  };
}
