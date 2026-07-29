import { t } from "../i18n.js";
import {
  escapeHtml,
  formatCompactEuro,
  formatEuro,
  formatMonthYear,
} from "./format.js";

const desktopQuery = "(min-width: 1051px)";
const defaultSeries = ["value", "contributions"];

function pathThrough(points) {
  return points
    .map(
      (point, index) =>
        `${index ? "L" : "M"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");
}

function historyForRange(history, range) {
  if (range === "all") return history;

  const cutoff = new Date(history.at(-1).date);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - Number(range));
  return history.filter((row) => row.date >= cutoff);
}

export function createPerformanceChart() {
  const chart = document.querySelector("#performanceChart");
  const frame = document.querySelector("#chartFrame");
  const tooltip = document.querySelector("#chartTooltip");
  const rangeControls = document.querySelector("#rangeControls");
  const seriesControls = document.querySelector(".series-controls");
  const startLabel = document.querySelector("#chartStart");
  const endLabel = document.querySelector("#chartEnd");

  let model = null;
  let selectedRange = "all";
  let visibleSeries = new Set(defaultSeries);

  function render() {
    if (!model) return;

    const data = historyForRange(model.history, selectedRange);
    const compactDesktop = window.matchMedia(desktopQuery).matches;
    const width = compactDesktop ? 1200 : 700;
    const height = compactDesktop ? 220 : 360;
    const margin = compactDesktop
      ? { top: 12, right: 26, bottom: 28, left: 70 }
      : { top: 20, right: 18, bottom: 36, left: 64 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const visibleValues = data.flatMap((row) => [
      visibleSeries.has("value") ? row.value : 0,
      visibleSeries.has("contributions") ? row.contributions : 0,
    ]);
    const maximumValue = Math.max(...visibleValues, 1);
    const yMaximum = Math.ceil((maximumValue * 1.08) / 1000) * 1000;
    const x = (index) =>
      margin.left +
      (data.length === 1 ? 0 : (index / (data.length - 1)) * plotWidth);
    const y = (value) => margin.top + plotHeight - (value / yMaximum) * plotHeight;
    const yTickCount = compactDesktop ? 5 : 4;
    const yTicks = Array.from(
      { length: yTickCount },
      (_, index) => (index / (yTickCount - 1)) * yMaximum,
    );
    const xTickCount = Math.min(compactDesktop ? 8 : 5, data.length);
    const xTickIndexes = [
      ...new Set(
        Array.from({ length: xTickCount }, (_, index) =>
          Math.round(
            (index / Math.max(xTickCount - 1, 1)) * (data.length - 1),
          ),
        ),
      ),
    ];
    const valuePoints = data.map((row, index) => ({
      x: x(index),
      y: y(row.value),
    }));
    const contributionPoints = data.map((row, index) => ({
      x: x(index),
      y: y(row.contributions),
    }));
    const valuePath = pathThrough(valuePoints);
    const areaPath =
      `${valuePath} L ${x(data.length - 1)} ${margin.top + plotHeight} ` +
      `L ${x(0)} ${margin.top + plotHeight} Z`;

    chart.setAttribute("viewBox", `0 0 ${width} ${height}`);
    chart.innerHTML = `
      <defs>
        <linearGradient id="valueFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0a8f68" stop-opacity=".17"/>
          <stop offset="100%" stop-color="#0a8f68" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${yTicks.map((tick) => `
        <line class="chart-grid" x1="${margin.left}" x2="${width - margin.right}" y1="${y(tick)}" y2="${y(tick)}"/>
        <text class="chart-axis-label" x="${margin.left - 12}" y="${y(tick) + 4}" text-anchor="end">${formatCompactEuro(tick)}</text>
      `).join("")}
      ${xTickIndexes.map((index) => `
        <text class="chart-axis-label" x="${x(index)}" y="${height - 10}" text-anchor="middle">${escapeHtml(formatMonthYear(data[index].date))}</text>
      `).join("")}
      ${visibleSeries.has("value") ? `
        <path class="chart-area" d="${areaPath}"></path>
        <path class="chart-line value" d="${valuePath}"></path>
      ` : ""}
      ${visibleSeries.has("contributions") ? `
        <path class="chart-line contributions" d="${pathThrough(contributionPoints)}"></path>
      ` : ""}
      <g id="chartHover" hidden>
        <line class="chart-crosshair" x1="0" x2="0" y1="${margin.top}" y2="${margin.top + plotHeight}"></line>
        <circle class="chart-dot value" cx="0" cy="0" r="5"></circle>
        <circle class="chart-dot contributions" cx="0" cy="0" r="4"></circle>
      </g>
      <rect id="chartHitArea" x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}" fill="transparent"></rect>
    `;

    startLabel.textContent = formatMonthYear(data[0].date);
    endLabel.textContent = formatMonthYear(data.at(-1).date);

    const hitArea = chart.querySelector("#chartHitArea");
    const hover = chart.querySelector("#chartHover");
    const crosshair = hover.querySelector("line");
    const dots = hover.querySelectorAll("circle");

    hitArea.addEventListener("pointermove", (event) => {
      const bounds = chart.getBoundingClientRect();
      const svgX = ((event.clientX - bounds.left) / bounds.width) * width;
      const approximateIndex =
        ((svgX - margin.left) / plotWidth) * (data.length - 1);
      const index = Math.max(
        0,
        Math.min(data.length - 1, Math.round(approximateIndex)),
      );
      const row = data[index];
      const pointX = x(index);

      hover.hidden = false;
      crosshair.setAttribute("x1", pointX);
      crosshair.setAttribute("x2", pointX);
      dots[0].setAttribute("cx", pointX);
      dots[0].setAttribute("cy", y(row.value));
      dots[0].toggleAttribute("hidden", !visibleSeries.has("value"));
      dots[1].setAttribute("cx", pointX);
      dots[1].setAttribute("cy", y(row.contributions));
      dots[1].toggleAttribute("hidden", !visibleSeries.has("contributions"));

      tooltip.hidden = false;
      tooltip.innerHTML = `
        <strong>${escapeHtml(formatMonthYear(row.date))}</strong>
        <div class="tooltip-row"><span>${t("chart.portfolio")}</span><span>${formatEuro(row.value)}</span></div>
        <div class="tooltip-row"><span>${t("chart.moneyAdded")}</span><span>${formatEuro(row.contributions)}</span></div>
        <div class="tooltip-row gain"><span>${t("chart.profit")}</span><span>${formatEuro(row.gain)}</span></div>
      `;
      tooltip.style.left = `${(pointX / width) * frame.clientWidth}px`;
      const tooltipY =
        (y(Math.max(row.value, row.contributions)) / height) * frame.clientHeight;
      tooltip.style.top = `${Math.max(tooltipY, 100)}px`;
    });

    hitArea.addEventListener("pointerleave", () => {
      hover.hidden = true;
      tooltip.hidden = true;
    });
  }

  rangeControls.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-range]");
    if (!button) return;

    selectedRange = button.dataset.range;
    rangeControls.querySelectorAll("button").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    render();
  });

  seriesControls.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-series]");
    if (!button) return;

    const series = button.dataset.series;
    if (visibleSeries.has(series) && visibleSeries.size > 1) {
      visibleSeries.delete(series);
    } else {
      visibleSeries.add(series);
    }

    seriesControls.querySelectorAll(".series-toggle").forEach((item) => {
      const selected = visibleSeries.has(item.dataset.series);
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    render();
  });

  return {
    render(nextModel) {
      model = nextModel;
      render();
    },
    reset() {
      model = null;
      selectedRange = "all";
      visibleSeries = new Set(defaultSeries);
      tooltip.hidden = true;
    },
  };
}
