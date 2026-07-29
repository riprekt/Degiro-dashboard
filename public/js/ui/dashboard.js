import { t } from "../i18n.js";
import {
  escapeHtml,
  formatDate,
  formatEuro,
  formatPercentage,
} from "./format.js";

const elements = {
  dataThrough: document.querySelector("#dataThrough"),
  priceThrough: document.querySelector("#priceThrough"),
  currentValue: document.querySelector("#currentValue"),
  contributions: document.querySelector("#contributions"),
  gain: document.querySelector("#gain"),
  simpleReturn: document.querySelector("#simpleReturn"),
  annualizedReturn: document.querySelector("#annualizedReturn"),
  positionCount: document.querySelector("#positionCount"),
  firstTransaction: document.querySelector("#firstTransaction"),
  cashValue: document.querySelector("#cashValue"),
  gainMetric: document.querySelector(".metric.gain"),
  allocationList: document.querySelector("#allocationList"),
  dataWarning: document.querySelector("#dataWarning"),
  dataWarningDetails: document.querySelector("#dataWarningDetails"),
};

export function createDashboardView(performanceChart) {
  return {
    render(model, { savedAt }) {
      const { summary, metadata, allocation, warnings } = model;

      elements.dataThrough.textContent = formatDate(savedAt || new Date());
      elements.dataThrough.title =
        `Latest account activity: ${formatDate(metadata.accountThrough)}. ` +
        `Latest transaction: ${formatDate(metadata.latestTransaction)}.`;
      elements.priceThrough.textContent = metadata.priceThrough
        ? formatDate(metadata.priceThrough)
        : t("dashboard.unavailable");
      elements.currentValue.textContent = formatEuro(summary.currentValue);
      elements.contributions.textContent = formatEuro(summary.contributions);
      elements.gain.textContent = formatEuro(summary.gain);
      elements.simpleReturn.textContent =
        t("metric.totalReturn", { value: formatPercentage(summary.simpleReturn) });
      elements.annualizedReturn.textContent =
        summary.xirr === null ? "—" : formatPercentage(summary.xirr);
      elements.positionCount.textContent =
        t("metric.holdingsCash", {
          count: summary.positions,
          cash: formatEuro(summary.cash),
        });
      elements.firstTransaction.textContent =
        t("metric.firstInvestment", { date: formatDate(metadata.firstTransaction) });
      elements.cashValue.textContent =
        t("holdings.cash", { value: formatEuro(summary.cash) });
      elements.gainMetric.classList.toggle("loss", summary.gain < 0);

      elements.allocationList.innerHTML = allocation.map((position) => `
        <div class="allocation-row">
          <span class="allocation-symbol">${escapeHtml(position.short)}</span>
          <span class="allocation-name">${escapeHtml(position.name)}</span>
          <div class="allocation-track" aria-hidden="true">
            <div class="allocation-fill" style="--weight:${Math.max(position.weight * 100, 1)}%"></div>
          </div>
          <span class="allocation-value">${formatEuro(position.value)}</span>
          <span class="allocation-weight">${formatPercentage(position.weight)}</span>
        </div>
      `).join("");

      elements.dataWarning.hidden = warnings.length === 0;
      elements.dataWarningDetails.innerHTML = warnings
        .map((warning) => {
          const message =
            typeof warning === "string" ? warning : t(warning.code, warning.values);
          return `<p>${escapeHtml(message)}</p>`;
        })
        .join("");

      performanceChart.render(model);
    },
  };
}
