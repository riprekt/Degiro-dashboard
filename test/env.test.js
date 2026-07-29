import assert from "node:assert/strict";
import test from "node:test";

import { parseEnv } from "../server/env.mjs";

test("environment files support comments, whitespace, and quoted values", () => {
  assert.deepEqual(
    parseEnv(`
      # Local settings
      ALPHA_VANTAGE_API_KEY = "secret"
      PORT=8080
    `),
    {
      ALPHA_VANTAGE_API_KEY: "secret",
      PORT: "8080",
    },
  );
});
