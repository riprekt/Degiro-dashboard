import { dateKey, monthEnd } from "./csv.js";
import {
  cashAt,
  contributionsAt,
  duplicateTransactionCount,
  externalCashFlows,
  parseAccountExport,
  parseTransactionsExport,
  quantitiesAt,
} from "./degiro.js";
import { normalizeMarketPrices, priceAt } from "./prices.js";

const millisecondsPerYear = 86_400_000 * 365;

function solveAnnualizedReturn(cashFlows) {
  if (cashFlows.length < 2 || !cashFlows.some((flow) => flow.amount < 0)) {
    return null;
  }

  const firstDate = cashFlows[0].date;
  const netPresentValue = (rate) =>
    cashFlows.reduce((total, flow) => {
      const years = (flow.date - firstDate) / millisecondsPerYear;
      return total + flow.amount / Math.pow(1 + rate, years);
    }, 0);

  let lowerBound = -0.999;
  let upperBound = 10;

  for (let iteration = 0; iteration < 200; iteration += 1) {
    const midpoint = (lowerBound + upperBound) / 2;
    if (netPresentValue(midpoint) > 0) lowerBound = midpoint;
    else upperBound = midpoint;
  }

  return (lowerBound + upperBound) / 2;
}

function valuationDates(firstTransactionDate, snapshotDate) {
  const dates = [firstTransactionDate];
  const firstDayOfSnapshotMonth = new Date(
    Date.UTC(snapshotDate.getUTCFullYear(), snapshotDate.getUTCMonth(), 1),
  );

  for (
    let date = monthEnd(
      firstTransactionDate.getUTCFullYear(),
      firstTransactionDate.getUTCMonth(),
    );
    date < firstDayOfSnapshotMonth;
    date = monthEnd(date.getUTCFullYear(), date.getUTCMonth() + 1)
  ) {
    dates.push(date);
  }

  dates.push(snapshotDate);
  return dates;
}

function eurPrice(instrument, date, pricesBySymbol) {
  const marketPrice = priceAt(pricesBySymbol[instrument.ticker] ?? [], date);
  if (!Number.isFinite(marketPrice)) return null;
  if (instrument.currency !== "USD") return marketPrice;

  const exchangeRate = priceAt(pricesBySymbol["EURUSD=X"] ?? [], date);
  return Number.isFinite(exchangeRate) && exchangeRate !== 0
    ? marketPrice / exchangeRate
    : null;
}

function valueInvestments(
  quantities,
  date,
  pricesBySymbol,
  instrumentsByIsin,
  warnings,
) {
  let total = 0;

  for (const [isin, quantity] of quantities) {
    if (Math.abs(quantity) < 1e-9) continue;

    const instrument = instrumentsByIsin[isin];
    if (!instrument) {
      warnings.push({
        code: "warning.unknownInstrument",
        values: { isin },
      });
      continue;
    }

    const price = eurPrice(instrument, date, pricesBySymbol);
    if (!Number.isFinite(price)) {
      warnings.push({
        code: "warning.missingPrice",
        values: { symbol: instrument.shortName, date: dateKey(date) },
      });
      continue;
    }

    total += quantity * price;
  }

  return total;
}

function buildHistory({
  accountRows,
  transactions,
  pricesBySymbol,
  instrumentsByIsin,
  snapshotDate,
  warnings,
}) {
  return valuationDates(transactions[0].date, snapshotDate).map((date) => {
    const quantities = quantitiesAt(transactions, date);
    const investments = valueInvestments(
      quantities,
      date,
      pricesBySymbol,
      instrumentsByIsin,
      warnings,
    );
    const cash = cashAt(accountRows, date);
    const contributions = contributionsAt(accountRows, date);
    const value = investments + cash;
    const gain = value - contributions;

    return {
      date,
      cash,
      investments,
      value,
      contributions,
      gain,
      simpleReturn: contributions ? gain / contributions : 0,
    };
  });
}

function buildAllocation(
  transactions,
  snapshotDate,
  pricesBySymbol,
  instrumentsByIsin,
  portfolioValue,
) {
  return [...quantitiesAt(transactions, snapshotDate)]
    .filter(([, quantity]) => Math.abs(quantity) >= 1e-9)
    .map(([isin, quantity]) => {
      const instrument = instrumentsByIsin[isin];
      if (!instrument) return null;

      const price = eurPrice(instrument, snapshotDate, pricesBySymbol);
      if (!Number.isFinite(price)) return null;

      const value = quantity * price;
      return {
        isin,
        short: instrument.shortName,
        name: instrument.name,
        quantity,
        value,
        weight: portfolioValue ? value / portfolioValue : 0,
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.value - left.value);
}

function oldestPriceDate(allocation, pricesBySymbol, instrumentsByIsin) {
  const priceDates = allocation
    .map((position) => {
      const instrument = instrumentsByIsin[position.isin];
      return pricesBySymbol[instrument.ticker]?.at(-1)?.key ?? null;
    })
    .filter(Boolean);

  const hasDollarHolding = allocation.some(
    (position) => instrumentsByIsin[position.isin].currency === "USD",
  );
  if (hasDollarHolding) {
    const exchangeRateDate = pricesBySymbol["EURUSD=X"]?.at(-1)?.key;
    if (exchangeRateDate) priceDates.push(exchangeRateDate);
  }

  return priceDates.length ? priceDates.sort()[0] : null;
}

export function buildPortfolioModel({
  accountText,
  transactionText,
  instrumentsByIsin = {},
  marketPayloads,
  snapshotDate = new Date(),
}) {
  const accountRows = parseAccountExport(accountText);
  const transactions = parseTransactionsExport(transactionText);

  if (!accountRows.length || !transactions.length) {
    const error = new Error("One or more DEGIRO exports contain no usable rows.");
    error.code = "error.emptyExports";
    throw error;
  }

  const pricesBySymbol = Object.fromEntries(
    Object.entries(marketPayloads).map(([symbol, payload]) => [
      symbol,
      normalizeMarketPrices(payload),
    ]),
  );
  const cleanSnapshotDate = new Date(
    Date.UTC(
      snapshotDate.getUTCFullYear(),
      snapshotDate.getUTCMonth(),
      snapshotDate.getUTCDate(),
    ),
  );
  const warnings = [];
  const duplicateCount = duplicateTransactionCount(transactions);
  if (duplicateCount > 0) {
    warnings.push({
      code:
        duplicateCount === 1
          ? "warning.duplicateTransaction"
          : "warning.duplicateTransactions",
      values: { count: duplicateCount },
    });
  }
  const history = buildHistory({
    accountRows,
    transactions,
    pricesBySymbol,
    instrumentsByIsin,
    snapshotDate: cleanSnapshotDate,
    warnings,
  });
  const latestValue = history.at(-1);
  const allocation = buildAllocation(
    transactions,
    cleanSnapshotDate,
    pricesBySymbol,
    instrumentsByIsin,
    latestValue.value,
  );
  const priceThrough = oldestPriceDate(
    allocation,
    pricesBySymbol,
    instrumentsByIsin,
  );
  const annualizedReturn = solveAnnualizedReturn([
    ...externalCashFlows(accountRows),
    { date: latestValue.date, amount: latestValue.value },
  ]);

  return {
    history,
    allocation,
    summary: {
      currentValue: latestValue.value,
      contributions: latestValue.contributions,
      gain: latestValue.gain,
      simpleReturn: latestValue.simpleReturn,
      xirr: annualizedReturn,
      cash: latestValue.cash,
      positions: allocation.length,
    },
    warnings: [
      ...new Map(warnings.map((warning) => [JSON.stringify(warning), warning])).values(),
    ],
    metadata: {
      firstTransaction: transactions[0].date,
      snapshotDate: cleanSnapshotDate,
      accountThrough: accountRows.at(-1).date,
      latestTransaction: transactions.at(-1).date,
      priceThrough: priceThrough
        ? new Date(`${priceThrough}T00:00:00.000Z`)
        : null,
      transactionCount: transactions.length,
      accountEntryCount: accountRows.length,
    },
  };
}
