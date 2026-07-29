import { buildPortfolioModel } from "./core/portfolio.js";
import { initializeI18n, t } from "./i18n.js";
import { fetchMarketPrices } from "./services/market-data.js";
import {
  clearSavedExports,
  emptyExportSet,
  loadExports,
  saveExports,
} from "./services/saved-exports.js";
import { createPerformanceChart } from "./ui/chart.js";
import { createDashboardView } from "./ui/dashboard.js";
import { hideLoading, showLoading, showToast } from "./ui/feedback.js";
import {
  enableFileDropzone,
  exportDisplayName,
  missingExportTypes,
  readDegiroExport,
  renderExportFile,
  resetExportFiles,
  setImportStatus,
} from "./ui/file-import.js";

const elements = {
  importStage: document.querySelector("#importStage"),
  dashboard: document.querySelector("#dashboard"),
  importDropzone: document.querySelector("#importDropzone"),
  fileInput: document.querySelector("#combinedFileInput"),
  selectFilesButton: document.querySelector("#selectFilesButton"),
  importStatus: document.querySelector("#importStatus"),
  updateButton: document.querySelector("#updateButton"),
  updateDialog: document.querySelector("#updateDialog"),
  updateDropzone: document.querySelector("#updateDropzone"),
  updateFileInput: document.querySelector("#updateFileInput"),
  selectUpdateFilesButton: document.querySelector("#selectUpdateFilesButton"),
  cancelUpdateButton: document.querySelector("#cancelUpdateButton"),
  updateStatus: document.querySelector("#updateStatus"),
  moreMenu: document.querySelector("#moreMenu"),
  clearButton: document.querySelector("#clearButton"),
  clearDialog: document.querySelector("#clearDialog"),
  cancelClearButton: document.querySelector("#cancelClearButton"),
  confirmClearButton: document.querySelector("#confirmClearButton"),
  exportButton: document.querySelector("#exportButton"),
  refreshButton: document.querySelector("#refreshButton"),
  returnInfoButton: document.querySelector(".info-button"),
};

initializeI18n();

const performanceChart = createPerformanceChart();
const dashboardView = createDashboardView(performanceChart);

const state = {
  files: emptyExportSet(),
  pendingFiles: emptyExportSet(),
  model: null,
  marketPayloads: null,
  savedAt: null,
};

function errorMessage(error) {
  return error?.code ? t(error.code, error.values) : error.message;
}

function showDashboard() {
  elements.importStage.hidden = true;
  elements.dashboard.hidden = false;
  elements.updateButton.hidden = false;
  elements.moreMenu.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showImportScreen() {
  elements.dashboard.hidden = true;
  elements.importStage.hidden = false;
  elements.updateButton.hidden = true;
  elements.moreMenu.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function buildDashboard({ refreshPrices = false } = {}) {
  showLoading(
    refreshPrices
      ? t("loading.refreshing")
      : t("loading.building"),
  );

  try {
    const marketData = await fetchMarketPrices(
      state.files.transactions.text,
      { refresh: refreshPrices },
    );
    state.marketPayloads = marketData.prices;
    state.model = buildPortfolioModel({
      accountText: state.files.account.text,
      transactionText: state.files.transactions.text,
      marketPayloads: state.marketPayloads,
      snapshotDate: new Date(),
    });
    state.model.warnings.push(...marketData.warnings);
    dashboardView.render(state.model, { savedAt: state.savedAt });
    showDashboard();
    return marketData;
  } finally {
    hideLoading();
  }
}

async function completeInitialImport() {
  try {
    await buildDashboard();
    state.savedAt = saveExports(state.files);
  } catch (error) {
    setImportStatus(elements.importStatus, errorMessage(error), "error");
    showImportScreen();
  }
}

async function applyUpdatedFiles() {
  const previousState = {
    files: state.files,
    model: state.model,
    marketPayloads: state.marketPayloads,
  };
  state.files = state.pendingFiles;

  try {
    await buildDashboard();
    state.savedAt = saveExports(state.files);
    state.pendingFiles = emptyExportSet();
    elements.updateFileInput.value = "";
    elements.updateDialog.close();
    showToast(t("toast.updated"));
  } catch (error) {
    state.files = previousState.files;
    state.model = previousState.model;
    state.marketPayloads = previousState.marketPayloads;
    dashboardView.render(state.model, { savedAt: state.savedAt });
    setImportStatus(elements.updateStatus, errorMessage(error), "error");
  }
}

async function processSelectedFiles(fileList, mode) {
  const files = [...fileList];
  if (!files.length) return;

  const destination = mode === "update" ? state.pendingFiles : state.files;
  const status = mode === "update" ? elements.updateStatus : elements.importStatus;
  const errors = [];

  for (const file of files) {
    try {
      const { type, entry } = await readDegiroExport(file);
      destination[type] = entry;
      renderExportFile(type, entry, mode);
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (errors.length) {
    setImportStatus(status, errors.join(" "), "error");
    return;
  }

  const missingTypes = missingExportTypes(destination);
  if (missingTypes.length) {
    const missingName = exportDisplayName(missingTypes[0]);
    setImportStatus(status, t("import.missing", { name: missingName }));
    if (mode === "initial") {
      elements.selectFilesButton.textContent =
        t("import.chooseOne", { name: missingName });
    }
    return;
  }

  setImportStatus(
    status,
    t("import.valid"),
    "success",
  );

  if (mode === "update") await applyUpdatedFiles();
  else await completeInitialImport();
}

function openUpdateDialog() {
  state.pendingFiles = emptyExportSet();
  resetExportFiles("update");
  setImportStatus(elements.updateStatus, t("update.select"));
  elements.moreMenu.open = false;
  elements.updateDialog.showModal();
}

function resetApplication() {
  clearSavedExports();
  state.files = emptyExportSet();
  state.pendingFiles = emptyExportSet();
  state.model = null;
  state.marketPayloads = null;
  state.savedAt = null;
  performanceChart.reset();

  resetExportFiles();
  elements.fileInput.value = "";
  elements.selectFilesButton.textContent = t("import.chooseBoth");
  setImportStatus(elements.importStatus, t("import.selectBoth"));
  elements.clearDialog.close();
  showImportScreen();
}

function downloadDashboardData() {
  elements.moreMenu.open = false;
  if (!state.model) return;

  const serializableModel = {
    ...state.model,
    history: state.model.history.map((row) => ({
      ...row,
      date: row.date.toISOString(),
    })),
    metadata: Object.fromEntries(
      Object.entries(state.model.metadata).map(([key, value]) => [
        key,
        value instanceof Date ? value.toISOString() : value,
      ]),
    ),
  };
  const blob = new Blob([JSON.stringify(serializableModel, null, 2)], {
    type: "application/json",
  });
  const downloadLink = document.createElement("a");

  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download =
    `folio-degiro-${new Date().toISOString().slice(0, 10)}.json`;
  downloadLink.click();
  URL.revokeObjectURL(downloadLink.href);
}

async function restoreSavedDashboard() {
  const saved = loadExports();
  if (!saved) return;

  state.files = saved.exports;
  state.savedAt = saved.savedAt;
  Object.entries(state.files).forEach(([type, entry]) => {
    renderExportFile(type, entry);
  });

  try {
    await buildDashboard();
  } catch (error) {
    resetExportFiles();
    Object.entries(state.files).forEach(([type, entry]) => {
      renderExportFile(type, entry);
    });
    setImportStatus(
      elements.importStatus,
      t("saved.loadFailed", { message: errorMessage(error) }),
      "error",
    );
  }
}

elements.selectFilesButton.addEventListener("click", () => elements.fileInput.click());
elements.fileInput.addEventListener("change", async (event) => {
  await processSelectedFiles(event.target.files, "initial");
  event.target.value = "";
});
enableFileDropzone(elements.importDropzone, (files) => {
  processSelectedFiles(files, "initial");
});

elements.updateButton.addEventListener("click", openUpdateDialog);
elements.cancelUpdateButton.addEventListener("click", () => {
  elements.updateDialog.close();
});
elements.selectUpdateFilesButton.addEventListener("click", () => {
  elements.updateFileInput.click();
});
elements.updateFileInput.addEventListener("change", async (event) => {
  await processSelectedFiles(event.target.files, "update");
  event.target.value = "";
});
enableFileDropzone(elements.updateDropzone, (files) => {
  processSelectedFiles(files, "update");
});

elements.refreshButton.addEventListener("click", async () => {
  try {
    const marketData = await buildDashboard({ refreshPrices: true });
    showToast(
      t(
        marketData.usedStaleCache
          ? "toast.cacheFallback"
          : "toast.refreshed",
      ),
    );
  } catch (error) {
    showToast(t("toast.refreshFailed", { message: errorMessage(error) }));
  }
});
elements.returnInfoButton.addEventListener("click", () => {
  showToast(t("toast.returnHelp"));
});

elements.clearButton.addEventListener("click", () => {
  elements.moreMenu.open = false;
  elements.clearDialog.showModal();
});
elements.cancelClearButton.addEventListener("click", () => {
  elements.clearDialog.close();
});
elements.confirmClearButton.addEventListener("click", resetApplication);
elements.exportButton.addEventListener("click", downloadDashboardData);

window.addEventListener("folio:languagechange", () => {
  if (state.model) {
    dashboardView.render(state.model, { savedAt: state.savedAt });
  }

  resetExportFiles();
  Object.entries(state.files)
    .filter(([, entry]) => entry)
    .forEach(([type, entry]) => renderExportFile(type, entry));
});

restoreSavedDashboard();
