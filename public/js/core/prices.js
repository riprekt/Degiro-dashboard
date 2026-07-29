import { dateKey } from "./csv.js";

export function normalizeMarketPrices(payload) {
  if (Array.isArray(payload?.points)) {
    return payload.points
      .filter((point) => point.date && Number.isFinite(point.close))
      .map((point) => ({ key: point.date, close: point.close }))
      .sort((left, right) => left.key.localeCompare(right.key));
  }

  const result = payload?.chart?.result?.[0];
  if (!result) return [];

  const offset = result.meta?.gmtoffset ?? 0;
  const timestamps = result.timestamp ?? [];
  const closingPrices = result.indicators?.quote?.[0]?.close ?? [];

  return timestamps
    .map((timestamp, index) => {
      const close = closingPrices[index];
      if (!Number.isFinite(close)) return null;

      return {
        key: new Date((timestamp + offset) * 1000).toISOString().slice(0, 10),
        close,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.key.localeCompare(right.key));
}

export function priceAt(pricePoints, date) {
  const target = dateKey(date);
  let price = null;

  for (const point of pricePoints) {
    if (point.key > target) break;
    price = point.close;
  }

  return price;
}
