const loadingOverlay = document.querySelector("#loadingOverlay");
const loadingText = document.querySelector("#loadingText");
const toast = document.querySelector("#toast");

let toastTimer = null;

export function showLoading(message = t("loading.reading")) {
  loadingText.textContent = message;
  loadingOverlay.hidden = false;
}

export function hideLoading() {
  loadingOverlay.hidden = true;
}

export function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;

  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}
import { t } from "../i18n.js";
