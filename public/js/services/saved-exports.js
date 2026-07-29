import {
  classifyDegiroExport,
  requiredExportTypes,
} from "../core/degiro.js";

const storageKey = "folio.degiro.session.v1";
const currentVersion = 3;
const readableVersions = new Set([1, 2, 3]);

export function emptyExportSet() {
  return Object.fromEntries(requiredExportTypes.map((type) => [type, null]));
}

export function hasAllExports(exports) {
  return requiredExportTypes.every((type) => Boolean(exports[type]));
}

export function saveExports(exports) {
  const savedAt = new Date();
  const files = Object.fromEntries(
    requiredExportTypes.map((type) => {
      const entry = exports[type];
      return [
        type,
        {
          name: entry.file.name,
          size: entry.file.size,
          lastModified: entry.file.lastModified || null,
          text: entry.text,
        },
      ];
    }),
  );

  localStorage.setItem(
    storageKey,
    JSON.stringify({
      version: currentVersion,
      savedAt: savedAt.toISOString(),
      files,
    }),
  );

  return savedAt;
}

export function loadExports() {
  const storedValue = localStorage.getItem(storageKey);
  if (!storedValue) return null;

  try {
    const saved = JSON.parse(storedValue);
    if (!readableVersions.has(saved?.version) || !saved.files) {
      throw new Error("Unsupported saved-data format.");
    }

    const exports = emptyExportSet();
    for (const type of requiredExportTypes) {
      const entry = saved.files[type];
      if (!entry?.text || classifyDegiroExport(entry.text) !== type) {
        throw new Error("Saved exports are incomplete or invalid.");
      }

      exports[type] = {
        file: {
          name: entry.name || `${type}.csv`,
          size: entry.size || new Blob([entry.text]).size,
          lastModified: entry.lastModified,
        },
        text: entry.text,
      };
    }

    return {
      exports,
      savedAt: saved.savedAt ? new Date(saved.savedAt) : new Date(),
    };
  } catch {
    clearSavedExports();
    return null;
  }
}

export function clearSavedExports() {
  localStorage.removeItem(storageKey);
}
