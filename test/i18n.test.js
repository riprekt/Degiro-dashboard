import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import {
  hasTranslation,
  translationCoverage,
} from "../public/js/i18n.js";

test("every supported language contains every English translation key", () => {
  for (const [language, missingKeys] of Object.entries(translationCoverage())) {
    assert.deepEqual(missingKeys, [], `${language} is missing translation keys`);
  }
});

test("every translation key referenced by the HTML exists", async () => {
  const html = await fs.readFile(
    new URL("../public/index.html", import.meta.url),
    "utf8",
  );
  const keys = [
    ...html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g),
  ].map((match) => match[1]);

  assert(keys.length > 0);
  assert.deepEqual(keys.filter((key) => !hasTranslation(key)), []);
});
