import assert from "node:assert/strict";
import test from "node:test";

import { getTooltipPosition } from "../public/js/ui/chart.js";

test("keeps the chart tooltip inside the top-right corner", () => {
  assert.deepEqual(
    getTooltipPosition({
      anchorX: 390,
      anchorY: 25,
      frameWidth: 400,
      frameHeight: 300,
      tooltipWidth: 185,
      tooltipHeight: 90,
    }),
    { left: 207, top: 8 },
  );
});

test("centers the chart tooltip above points away from the edges", () => {
  assert.deepEqual(
    getTooltipPosition({
      anchorX: 250,
      anchorY: 200,
      frameWidth: 500,
      frameHeight: 300,
      tooltipWidth: 180,
      tooltipHeight: 80,
    }),
    { left: 160, top: 108 },
  );
});
