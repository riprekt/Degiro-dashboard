import fs from "node:fs/promises";
import path from "node:path";

function filenameFor(isin) {
  return `${isin.toLowerCase()}.json`;
}

export function createInstrumentCache(directory) {
  return {
    async read(isin) {
      try {
        const text = await fs.readFile(
          path.join(directory, filenameFor(isin)),
          "utf8",
        );
        const entry = JSON.parse(text);
        return entry?.version === 1 ? entry : null;
      } catch (error) {
        if (error?.code === "ENOENT" || error instanceof SyntaxError) return null;
        throw error;
      }
    },

    async write(isin, entry) {
      await fs.mkdir(directory, { recursive: true });
      const destination = path.join(directory, filenameFor(isin));
      const temporary = `${destination}.${Date.now()}.tmp`;
      await fs.writeFile(temporary, JSON.stringify(entry), "utf8");
      await fs.rename(temporary, destination);
    },
  };
}
