const defaultFreshnessMs = 12 * 60 * 60 * 1000;
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
  now = () => Date.now(),
}) {
  async function pricesForSymbol(symbol, period1, period2, force) {
    const cached = await cache.read(symbol);
    const coversStart =
      cached &&
      cached.coveredFrom <= period1 + marketOpenToleranceSeconds;
    const isFresh =
      coversStart &&
      now() - Date.parse(cached.fetchedAt) < freshnessMs;

    if (!force && isFresh) {
      return { ...cached, stale: false };
    }

    const fetchFrom =
      coversStart && cached.points.length
        ? Math.max(period1, unixDate(cached.points.at(-1).date) - overlapSeconds)
        : period1;

    try {
      const newPoints = await provider.fetchDailyCloses(
        symbol,
        fetchFrom,
        period2,
      );
      const entry = {
        version: 1,
        symbol,
        source: provider.name,
        fetchedAt: new Date(now()).toISOString(),
        coveredFrom: coversStart
          ? Math.min(cached.coveredFrom, period1)
          : period1,
        points: mergePoints(coversStart ? cached.points : [], newPoints),
      };
      await cache.write(symbol, entry);
      return { ...entry, stale: false };
    } catch (error) {
      if (coversStart && cached.points.length) {
        return {
          ...cached,
          stale: true,
          refreshError: error.message,
        };
      }
      throw error;
    }
  }

  return {
    async getPrices({ symbols, period1, period2, force = false }) {
      const entries = await Promise.all(
        symbols.map(async (symbol) => [
          symbol,
          await pricesForSymbol(symbol, period1, period2, force),
        ]),
      );
      return Object.fromEntries(entries);
    },
  };
}
