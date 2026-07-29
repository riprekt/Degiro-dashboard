function dateKey(timestamp, offsetSeconds) {
  return new Date((timestamp + offsetSeconds) * 1000)
    .toISOString()
    .slice(0, 10);
}

const hosts = [
  "https://query2.finance.yahoo.com",
  "https://query1.finance.yahoo.com",
];
const retryableStatuses = new Set([429, 500, 502, 503, 504]);

function retryDelay(response, attempt) {
  const retryAfter = response.headers?.get?.("retry-after");
  const seconds = Number(retryAfter);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1000, 10_000);
  }

  return 750 * 2 ** attempt;
}

function sourceError(symbol, status) {
  if (status === 429) {
    return new Error(
      `${symbol}: the market source is temporarily rate-limiting requests. ` +
        "Wait a minute and try again.",
    );
  }

  return new Error(`${symbol}: market source returned HTTP ${status}`);
}

export function createYahooProvider({
  fetchImpl = fetch,
  wait = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
  maxAttempts = 3,
} = {}) {
  return {
    name: "Yahoo Finance",

    async fetchDailyCloses(symbol, period1, period2) {
      let response;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const host = hosts[attempt % hosts.length];
        const endpoint =
          `${host}/v8/finance/chart/${encodeURIComponent(symbol)}` +
          `?period1=${period1}&period2=${period2}&interval=1d&events=history`;
        response = await fetchImpl(endpoint, {
          headers: {
            Accept: "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 Firefox/141.0",
          },
        });

        if (response.ok) break;
        if (!retryableStatuses.has(response.status) || attempt === maxAttempts - 1) {
          throw sourceError(symbol, response.status);
        }

        await wait(retryDelay(response, attempt));
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
