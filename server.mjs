import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvFile } from "./server/env.mjs";
import { createAlphaVantageProvider } from "./server/market/alpha-vantage-provider.mjs";
import { createInstrumentCache } from "./server/market/instrument-cache.mjs";
import { createInstrumentResolver } from "./server/market/instrument-resolver.mjs";
import { createMarketService } from "./server/market/market-service.mjs";
import { createOpenFigiClient } from "./server/market/openfigi-client.mjs";
import { createPriceCache } from "./server/market/price-cache.mjs";
import { createStaticFileHandler } from "./server/static-files.mjs";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
await loadEnvFile(path.join(rootDirectory, ".env"));

const port = Number(process.env.PORT || 4173);
const marketService = createMarketService({
  cache: createPriceCache(path.join(rootDirectory, ".cache", "prices")),
  provider: createAlphaVantageProvider({
    apiKey: process.env.ALPHA_VANTAGE_API_KEY,
  }),
  requestSpacingMs: 1_100,
});
const instrumentResolver = createInstrumentResolver({
  cache: createInstrumentCache(
    path.join(rootDirectory, ".cache", "instruments"),
  ),
  client: createOpenFigiClient(),
});
const serveStatic = createStaticFileHandler(path.join(rootDirectory, "public"));

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function validInstrument(value) {
  return (
    value &&
    /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(value.isin) &&
    typeof value.name === "string" &&
    value.name.length <= 250 &&
    /^[A-Z]{3}$/.test(value.currency) &&
    Array.isArray(value.venues) &&
    value.venues.length <= 10 &&
    value.venues.every(
      (venue) => typeof venue === "string" && venue.length <= 20,
    )
  );
}

async function readJson(request) {
  const chunks = [];
  let length = 0;

  for await (const chunk of request) {
    length += chunk.length;
    if (length > 64 * 1024) throw new Error("Request body is too large.");
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handleMarketData(request, response) {
  const body = await readJson(request);
  const instruments = body?.instruments;
  const period1 = Number(body?.period1);
  const period2 = Number(body?.period2);
  const force = body?.refresh === true;
  const isInvalid =
    !Array.isArray(instruments) ||
    instruments.length === 0 ||
    instruments.length > 100 ||
    instruments.some((instrument) => !validInstrument(instrument)) ||
    !Number.isInteger(period1) ||
    !Number.isInteger(period2) ||
    period2 <= period1;

  if (isInvalid) {
    sendJson(response, 400, { error: "Invalid market-data request." });
    return;
  }

  try {
    const resolution = await instrumentResolver.resolveMany(instruments);
    const marketRequestsByKey = new Map(
      Object.values(resolution.instruments).map((instrument) => [
        instrument.ticker,
        {
          key: instrument.ticker,
          symbol: instrument.priceSymbol,
        },
      ]),
    );
    if (
      Object.values(resolution.instruments).some(
        (instrument) => instrument.currency === "USD",
      )
    ) {
      marketRequestsByKey.set("EURUSD=X", {
        key: "EURUSD=X",
        symbol: "EURUSD=X",
      });
    }

    const prices = await marketService.getPrices({
      requests: [...marketRequestsByKey.values()],
      period1,
      period2,
      force,
    });
    sendJson(response, 200, {
      generatedAt: new Date().toISOString(),
      instruments: resolution.instruments,
      unresolved: resolution.unresolved,
      prices,
    });
  } catch (error) {
    sendJson(response, 502, {
      error:
        error instanceof Error ? error.message : "Market-data request failed.",
    });
  }
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
  if (
    requestUrl.pathname === "/api/market-data" &&
    request.method === "POST"
  ) {
    await handleMarketData(request, response);
    return;
  }

  if (request.method !== "GET") {
    response.writeHead(405, { Allow: "GET, POST" });
    response.end("Method not allowed");
    return;
  }

  await serveStatic(decodeURIComponent(requestUrl.pathname), response);
}

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch(() => {
    if (!response.headersSent) response.writeHead(500);
    response.end("Server error");
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`DEGIRO dashboard running at http://127.0.0.1:${port}`);
});
