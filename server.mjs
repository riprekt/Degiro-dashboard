import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvFile } from "./server/env.mjs";
import { createAlphaVantageProvider } from "./server/market/alpha-vantage-provider.mjs";
import { createMarketService } from "./server/market/market-service.mjs";
import { createPriceCache } from "./server/market/price-cache.mjs";
import { createStaticFileHandler } from "./server/static-files.mjs";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
await loadEnvFile(path.join(rootDirectory, ".env"));

const port = Number(process.env.PORT || 4173);
const allowedSymbols = new Set([
  "IWDA.AS",
  "EMIM.AS",
  "SWRD.AS",
  "VWCE.DE",
  "AMC",
  "EURUSD=X",
]);
const marketService = createMarketService({
  cache: createPriceCache(path.join(rootDirectory, ".cache", "prices")),
  provider: createAlphaVantageProvider({
    apiKey: process.env.ALPHA_VANTAGE_API_KEY,
  }),
  requestSpacingMs: 1_100,
});
const serveStatic = createStaticFileHandler(path.join(rootDirectory, "public"));

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

async function handlePrices(requestUrl, response) {
  const symbols = [
    ...new Set(
      (requestUrl.searchParams.get("symbols") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
  const period1 = Number(requestUrl.searchParams.get("period1"));
  const period2 = Number(requestUrl.searchParams.get("period2"));
  const force = requestUrl.searchParams.has("refresh");
  const isInvalid =
    symbols.length === 0 ||
    symbols.length > allowedSymbols.size ||
    symbols.some((symbol) => !allowedSymbols.has(symbol)) ||
    !Number.isInteger(period1) ||
    !Number.isInteger(period2) ||
    period2 <= period1;

  if (isInvalid) {
    sendJson(response, 400, { error: "Invalid market-data request." });
    return;
  }

  try {
    const prices = await marketService.getPrices({
      symbols,
      period1,
      period2,
      force,
    });
    sendJson(response, 200, {
      generatedAt: new Date().toISOString(),
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
  if (request.method !== "GET") {
    response.writeHead(405, { Allow: "GET" });
    response.end("Method not allowed");
    return;
  }

  const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
  if (requestUrl.pathname === "/api/prices") {
    await handlePrices(requestUrl, response);
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
