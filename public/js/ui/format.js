import { currentLanguage } from "../i18n.js";

const localeByLanguage = {
  en: "en-BE",
  nl: "nl-BE",
  fr: "fr-BE",
  de: "de-BE",
};

function locale() {
  return localeByLanguage[currentLanguage()] ?? localeByLanguage.en;
}

export function formatEuro(value) {
  return new Intl.NumberFormat(locale(), {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactEuro(value) {
  return new Intl.NumberFormat(locale(), {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercentage(value) {
  return new Intl.NumberFormat(locale(), {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(value) {
  return new Intl.DateTimeFormat(locale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function formatMonthYear(value) {
  return new Intl.DateTimeFormat(locale(), {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
