const cacheLifetimeMs = 30 * 24 * 60 * 60 * 1000;

const venueAliases = {
  AMSTERDAM: "XAMS",
  "EURONEXT AMSTERDAM": "XAMS",
  NASDAQ: "XNAS",
  NYSE: "XNYS",
  TRADEGATE: "XGAT",
  XETRA: "XETR",
  XETA: "XETR",
  XET: "XETR",
};

const canonicalSuffixes = {
  XAMS: "AS",
  XETR: "DE",
  XLON: "L",
};

const alphaSuffixes = {
  XAMS: "AMS",
  XETR: "DEX",
  XLON: "LON",
};

const micByExchangeCode = {
  NA: "XAMS",
  LN: "XLON",
  GR: "XETR",
  GF: "XETR",
  GD: "XETR",
  GS: "XETR",
  GM: "XETR",
  GH: "XETR",
  GT: "XETR",
  US: "US",
};

function normalizeVenue(value) {
  const venue = String(value ?? "").trim().toUpperCase();
  return venueAliases[venue] ?? venue;
}

function preferredVenue(venues) {
  const normalized = venues.map(normalizeVenue).filter(Boolean);
  return (
    normalized.find((venue) => venue === "XETR") ??
    normalized.find((venue) => venue === "XAMS") ??
    normalized[0] ??
    ""
  );
}

function mappingJob(requirement, micCode) {
  const job = {
    idType: "ID_ISIN",
    idValue: requirement.isin,
    currency: requirement.currency,
  };
  if (/^[A-Z0-9]{4}$/.test(micCode)) job.micCode = micCode;
  return job;
}

function firstMapping(result) {
  return result?.data?.[0] ?? null;
}

function symbolWithSuffix(ticker, micCode, suffixes) {
  const suffix = suffixes[micCode];
  return suffix ? `${ticker}.${suffix}` : ticker;
}

function resultMic(result, requestedMic) {
  return (
    (/^[A-Z0-9]{4}$/.test(requestedMic) ? requestedMic : "") ||
    micByExchangeCode[result?.exchCode] ||
    ""
  );
}

async function fallbackSearch(client, requirement) {
  if (!requirement.name) return null;
  const result = await client.search(requirement.name, requirement.currency);
  return result?.data?.[0] ?? null;
}

export function createInstrumentResolver({
  cache,
  client,
  now = () => Date.now(),
}) {
  async function cachedInstrument(isin) {
    const entry = await cache.read(isin);
    if (!entry) return null;
    const age = now() - Date.parse(entry.resolvedAt);
    return age < cacheLifetimeMs ? entry : null;
  }

  return {
    async resolveMany(requirements) {
      const resolved = {};
      const unresolved = [];

      const pending = [];
      for (const requirement of requirements) {
        const cached = await cachedInstrument(requirement.isin);
        if (cached) resolved[requirement.isin] = cached;
        else pending.push(requirement);
      }

      const descriptors = pending.map((requirement) => {
        const venue = preferredVenue(requirement.venues);
        const priceVenue = requirement.currency === "EUR" ? "XETR" : venue;
        return { requirement, venue, priceVenue };
      });
      const jobs = [];
      for (const descriptor of descriptors) {
        descriptor.preferredIndex = jobs.push(
          mappingJob(descriptor.requirement, descriptor.venue),
        ) - 1;
        descriptor.priceIndex =
          descriptor.priceVenue === descriptor.venue
            ? descriptor.preferredIndex
            : jobs.push(
              mappingJob(descriptor.requirement, descriptor.priceVenue),
            ) - 1;
      }
      const mappings = jobs.length ? await client.map(jobs) : [];

      for (const descriptor of descriptors) {
        const preferred = firstMapping(mappings[descriptor.preferredIndex]);
        const priceListing = firstMapping(mappings[descriptor.priceIndex]);
        const fallback =
          preferred || priceListing
            ? null
            : await fallbackSearch(client, descriptor.requirement);
        const displayListing = preferred ?? priceListing ?? fallback;
        const marketListing = priceListing ?? preferred ?? fallback;

        if (!displayListing || !marketListing) {
          unresolved.push(descriptor.requirement.isin);
          continue;
        }

        const displayMic = resultMic(displayListing, descriptor.venue);
        const marketMic = resultMic(marketListing, descriptor.priceVenue);
        const instrument = {
          version: 1,
          isin: descriptor.requirement.isin,
          shortName: displayListing.ticker,
          name: displayListing.name || descriptor.requirement.name,
          ticker: symbolWithSuffix(
            displayListing.ticker,
            displayMic,
            canonicalSuffixes,
          ),
          priceSymbol: symbolWithSuffix(
            marketListing.ticker,
            marketMic,
            alphaSuffixes,
          ),
          currency: descriptor.requirement.currency,
          resolvedAt: new Date(now()).toISOString(),
          source: "OpenFIGI",
        };

        await cache.write(instrument.isin, instrument);
        resolved[instrument.isin] = instrument;
      }

      return { instruments: resolved, unresolved };
    },
  };
}
