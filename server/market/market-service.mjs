const defaultFreshnessMs = 12 * 60 * 60 * 1000;
const defaultMinimumForceAgeMs = 60 * 60 * 1000;
const overlapSeconds = 3 * 24 * 60 * 60;
const marketOpenToleranceSeconds = 24 * 60 * 60;

function mergePoints(existing = [], incoming = []) {
  const byDate = new Map(
    [...existing, ...incoming].map((point) => [point.date, point]),
  );
  return [...byDate.values()].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

function unixDate(date) {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 1000);
}

export function createMarketService({
  cache,
  provider,
  freshnessMs = defaultFreshnessMs,
  minimumForceAgeMs = defaultMinimumForceAgeMs,
  now = () => Date.now(),
  requestSpacingMs = 400,
  wait = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
}) {
  async function pricesForSymbol(key, providerSymbol, period1, period2, force) {
    const cached = await cache.read(key);
    const usesCurrentProvider = cached?.source === provider.name;
    const coversStart =
      cached &&
      cached.coveredFrom <= period1 + marketOpenToleranceSeconds;
    const isFresh =
      usesCurrentProvider &&
      coversStart &&
      now() - Date.parse(cached.fetchedAt) < freshnessMs;
    const cacheAge = cached ? now() - Date.parse(cached.fetchedAt) : Infinity;

    if (isFresh && (!force || cacheAge < minimumForceAgeMs)) {
      return {
        series: {
          ...cached,
          stale: false,
          refreshSkipped: force,
        },
        requested: false,
      };
    }

    const fetchFrom =
      usesCurrentProvider && coversStart && cached.points.length
        ? Math.max(period1, unixDate(cached.points.at(-1).date) - overlapSeconds)
        : period1;

    try {
      const newPoints = await provider.fetchDailyCloses(
        providerSymbol,
        fetchFrom,
        period2,
      );
      const entry = {
        version: 1,
        symbol: key,
        source: provider.name,
        fetchedAt: new Date(now()).toISOString(),
        coveredFrom: usesCurrentProvider && coversStart
          ? Math.min(cached.coveredFrom, period1)
          : period1,
        points: mergePoints(
          usesCurrentProvider && coversStart ? cached.points : [],
          newPoints,
        ),
      };
      await cache.write(key, entry);
      return {
        series: { ...entry, stale: false },
        requested: true,
      };
    } catch (error) {
      if (coversStart && cached.points.length) {
        return {
          series: {
            ...cached,
            stale: !isFresh,
            refreshError: error.message,
          },
          requested: true,
        };
      }
      throw error;
    }
  }

  return {
    async getPrices({ symbols, requests, period1, period2, force = false }) {
      const marketRequests =
        requests ?? (symbols ?? []).map((symbol) => ({ key: symbol, symbol }));
      const entries = [];

      for (const [index, request] of marketRequests.entries()) {
        const result = await pricesForSymbol(
          request.key,
          request.symbol,
          period1,
          period2,
          force,
        );
        entries.push([request.key, result.series]);

        if (
          result.requested &&
          index < marketRequests.length - 1 &&
          requestSpacingMs > 0
        ) {
          await wait(requestSpacingMs);
        }
      }

      return Object.fromEntries(entries);
    },
  };
}
