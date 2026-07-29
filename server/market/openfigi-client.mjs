const endpoint = "https://api.openfigi.com/v3";
const jobsPerRequest = 5;

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

async function readResponse(response) {
  if (!response.ok) {
    throw new Error(`OpenFIGI returned HTTP ${response.status}`);
  }
  return response.json();
}

export function createOpenFigiClient({ fetchImpl = fetch } = {}) {
  return {
    async map(jobs) {
      const results = [];

      for (const batch of chunks(jobs, jobsPerRequest)) {
        const response = await fetchImpl(`${endpoint}/mapping`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
        });
        results.push(...(await readResponse(response)));
      }

      return results;
    },

    async search(query, currency) {
      const response = await fetchImpl(`${endpoint}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          currency,
          marketSecDes: "Equity",
        }),
      });
      return readResponse(response);
    },
  };
}
