import fs from "node:fs/promises";

export function parseEnv(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        const name = line.slice(0, separator).trim();
        const value = line
          .slice(separator + 1)
          .trim()
          .replace(/^(['"])(.*)\1$/, "$2");
        return [name, value];
      }),
  );
}

export async function loadEnvFile(filename) {
  try {
    const values = parseEnv(await fs.readFile(filename, "utf8"));

    for (const [name, value] of Object.entries(values)) {
      if (process.env[name] === undefined) process.env[name] = value;
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
