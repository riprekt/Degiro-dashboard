function dateKey(timestamp, offsetSeconds) {
  return new Date((timestamp + offsetSeconds) * 1000)
    .toISOString()
    .slice(0, 10);
}

export function createYahooProvider({ fetchImpl = fetch } = {}) {
  return {
    name: "Yahoo Finance",

    async fetchDailyCloses(symbol, period1, period2) {
      const endpoint =
        `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
        `?period1=${period1}&period2=${period2}&interval=1d&events=history`;
      const response = await fetchImpl(endpoint, {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 Firefox/141.0",
        },
      });

      if (!response.ok) {
        throw new Error(`${symbol}: market source returned HTTP ${response.status}`);
      }

      const payload = await response.json();
      const result = payload?.chart?.result?.[0];
      if (!result) {
        throw new Error(`${symbol}: market source returned no price history`);
      }

      const offset = result.meta?.gmtoffset ?? 0;
      const timestamps = result.timestamp ?? [];
      const closingPrices = result.indicators?.quote?.[0]?.close ?? [];
      const points = timestamps
        .map((timestamp, index) => {
          const close = closingPrices[index];
          return Number.isFinite(close)
            ? { date: dateKey(timestamp, offset), close }
            : null;
        })
        .filter(Boolean);

      if (!points.length) {
        throw new Error(`${symbol}: market source returned no closing prices`);
      }

      return points;
    },
  };
}
