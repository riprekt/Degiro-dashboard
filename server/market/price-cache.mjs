import fs from "node:fs/promises";
import path from "node:path";

function filenameFor(symbol) {
  return `${symbol.replaceAll(/[^a-z0-9]+/gi, "_").toLowerCase()}.json`;
}

export function createPriceCache(directory) {
  return {
    async read(symbol) {
      try {
        const text = await fs.readFile(
          path.join(directory, filenameFor(symbol)),
          "utf8",
        );
        const entry = JSON.parse(text);
        return entry?.version === 1 && Array.isArray(entry.points) ? entry : null;
      } catch (error) {
        if (error?.code === "ENOENT" || error instanceof SyntaxError) return null;
        throw error;
      }
    },

    async write(symbol, entry) {
      await fs.mkdir(directory, { recursive: true });
      const destination = path.join(directory, filenameFor(symbol));
      const temporary = `${destination}.${Date.now()}.tmp`;
      await fs.writeFile(temporary, JSON.stringify(entry), "utf8");
      await fs.rename(temporary, destination);
    },
  };
}
