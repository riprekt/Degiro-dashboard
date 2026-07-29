const symbols = {
  "IWDA.AS": "IWDA.AMS",
  "EMIM.AS": "IS3N.DEX",
  "SWRD.AS": "SPPW.DEX",
  "VWCE.DE": "VWCE.DEX",
  AMC: "AMC",
};

const weekSeconds = 7 * 24 * 60 * 60;

function unixDate(date) {
  return Date.parse(`${date}T00:00:00Z`) / 1000;
}

function apiError(symbol, payload) {
  const detail =
    payload?.["Error Message"] ??
    payload?.Information ??
    payload?.Note ??
    "the market source returned no price history";

  return new Error(`${symbol}: ${detail}`);
}

function equityRequest(symbol, apiKey) {
  return {
    params: {
      function: "TIME_SERIES_WEEKLY_ADJUSTED",
      symbol: symbols[symbol],
      apikey: apiKey,
    },
    seriesName: "Weekly Adjusted Time Series",
    closeName: "5. adjusted close",
  };
}

function forexRequest(apiKey) {
  return {
    params: {
      function: "FX_WEEKLY",
      from_symbol: "EUR",
      to_symbol: "USD",
      apikey: apiKey,
    },
    seriesName: "Time Series FX (Weekly)",
    closeName: "4. close",
  };
}

export function createAlphaVantageProvider({ apiKey, fetchImpl = fetch } = {}) {
  if (!apiKey) {
    throw new Error(
      "Missing ALPHA_VANTAGE_API_KEY. Copy .env.example to .env and add your key.",
    );
  }

  return {
    name: "Alpha Vantage",

    async fetchDailyCloses(symbol, period1, period2) {
      const request =
        symbol === "EURUSD=X"
          ? forexRequest(apiKey)
          : equityRequest(symbol, apiKey);

      if (!request.params.symbol && symbol !== "EURUSD=X") {
        throw new Error(`${symbol}: no Alpha Vantage symbol mapping`);
      }

      const query = new URLSearchParams(request.params);
      const response = await fetchImpl(
        `https://www.alphavantage.co/query?${query}`,
      );

      if (!response.ok) {
        throw new Error(`${symbol}: market source returned HTTP ${response.status}`);
      }

      const payload = await response.json();
      const series = payload?.[request.seriesName];
      if (!series) throw apiError(symbol, payload);

      const earliest = period1 - weekSeconds;
      const points = Object.entries(series)
        .map(([date, values]) => ({
          date,
          close: Number(values?.[request.closeName]),
        }))
        .filter(
          (point) =>
            Number.isFinite(point.close) &&
            unixDate(point.date) >= earliest &&
            unixDate(point.date) < period2,
        )
        .sort((left, right) => left.date.localeCompare(right.date));

      if (!points.length) throw apiError(symbol, payload);
      return points;
    },
  };
}
