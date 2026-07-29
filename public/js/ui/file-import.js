import {
  classifyDegiroExport,
  requiredExportTypes,
} from "../core/degiro.js";
import { t } from "../i18n.js";

const displayNames = {
  account: "Account.csv",
  transactions: "Transactions.csv",
};

export async function readDegiroExport(file) {
  if (!file?.name.toLowerCase().endsWith(".csv")) {
    throw new Error(
      t("import.notCsv", { name: file?.name || "That file" }),
    );
  }

  const text = await file.text();
  const type = classifyDegiroExport(text);

  if (!requiredExportTypes.includes(type)) {
    throw new Error(t("import.unknownFile", { name: file.name }));
  }

  return { type, entry: { file, text } };
}

export function missingExportTypes(exports) {
  return requiredExportTypes.filter((type) => !exports[type]);
}

export function exportDisplayName(type) {
  return displayNames[type];
}

export function renderExportFile(type, entry, mode = "initial") {
  const selector = mode === "update"
    ? `[data-update-slot="${type}"]`
    : `[data-slot="${type}"]`;
  const row = document.querySelector(selector);
  if (!row) return;

  const stateElement = mode === "update"
    ? row.querySelector("span")
    : row.querySelector(".file-state");
  const kilobytes = entry.file.size / 1024;

  row.classList.add("ready");
  stateElement.textContent = t("import.ready", {
    size: kilobytes.toFixed(entry.file.size > 10_240 ? 0 : 1),
  });
}

export function resetExportFiles(mode = "initial") {
  const selector = mode === "update" ? "[data-update-slot]" : "[data-slot]";

  document.querySelectorAll(selector).forEach((row) => {
    const stateElement = mode === "update"
      ? row.querySelector("span")
      : row.querySelector(".file-state");

    row.classList.remove("ready", "dragging");
    stateElement.textContent = t("import.needed");
  });
}

export function setImportStatus(element, message, kind = "") {
  element.textContent = message;
  element.classList.toggle("error", kind === "error");
  element.classList.toggle("success", kind === "success");
}

export function enableFileDropzone(dropzone, onFiles) {
  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("dragging");
  });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragging"));
  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragging");
    onFiles(event.dataTransfer.files);
  });
}
