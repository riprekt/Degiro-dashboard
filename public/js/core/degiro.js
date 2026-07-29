import { parseCsv, parseDegiroDate, parseEuropeanNumber } from "./csv.js";

export const requiredExportTypes = ["account", "transactions"];

const columnAliases = {
  date: ["datum", "date"],
  time: ["tijd", "time", "uhrzeit", "heure"],
  product: ["product", "produkt", "produit"],
  isin: ["isin"],
  description: ["omschrijving", "description", "beschreibung"],
  mutation: ["mutatie", "change", "anderung", "variation", "mouvement"],
  balance: ["saldo", "balance", "kontostand", "solde"],
  exchange: ["beurs", "exchange", "borse", "bourse"],
  venue: [
    "uitvoeringsplaats",
    "execution venue",
    "trading venue",
    "ausfuhrungsplatz",
    "lieu d execution",
    "place d execution",
  ],
  quantity: ["aantal", "quantity", "menge", "stuckzahl", "quantite"],
  price: ["koers", "price", "preis", "cours", "prix"],
  currency: ["valuta", "currency", "wahrung", "devise"],
  valueEur: [
    "waarde eur",
    "value eur",
    "value in eur",
    "wert eur",
    "valeur eur",
  ],
  feesEur: [
    "transactiekosten en of kosten van derden eur",
    "transactiekosten",
    "transaction and or third party fees eur",
    "transaction fees eur",
    "transaktionskosten eur",
    "frais de transaction eur",
  ],
  totalEur: ["totaal", "totaal eur", "total", "total eur", "gesamt eur"],
  orderId: ["order id", "order-id", "ordernummer", "numero d ordre"],
};

const depositTerms = [
  "flatex deposit",
  "ideal storting",
  "deposit",
  "einzahlung",
  "depot",
  "versement",
];
const withdrawalTerms = [
  "flatex withdrawal",
  "withdrawal",
  "opname",
  "auszahlung",
  "retrait",
];

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function headerIndexes(headerRow) {
  const normalizedHeaders = headerRow.map(normalizeText);
  const indexes = {};

  for (const [field, aliases] of Object.entries(columnAliases)) {
    indexes[field] = normalizedHeaders.findIndex((header) =>
      aliases.includes(header),
    );
  }

  return indexes;
}

function groupedValueIndex(headerRow, labelIndex) {
  if (labelIndex < 0) return -1;
  return headerRow[labelIndex + 1] === "" ? labelIndex + 1 : labelIndex;
}

function valueAt(row, index) {
  return index >= 0 ? row[index] : "";
}

function descriptionMatches(description, terms) {
  const normalized = normalizeText(description);
  return terms.some((term) => normalized === term || normalized.includes(term));
}

function isDeposit(description) {
  return descriptionMatches(description, depositTerms);
}

function isWithdrawal(description) {
  return descriptionMatches(description, withdrawalTerms);
}

export function classifyDegiroExport(text) {
  const header = parseCsv(text)[0] ?? [];
  const indexes = headerIndexes(header);
  const isAccount =
    indexes.date >= 0 &&
    indexes.description >= 0 &&
    indexes.mutation >= 0 &&
    indexes.balance >= 0;
  const isTransactions =
    indexes.date >= 0 &&
    indexes.isin >= 0 &&
    indexes.quantity >= 0 &&
    indexes.price >= 0 &&
    (indexes.venue >= 0 || indexes.exchange >= 0 || indexes.totalEur >= 0);

  if (isAccount) return "account";
  if (isTransactions) return "transactions";
  return null;
}

export function parseAccountExport(text) {
  const [header = [], ...rows] = parseCsv(text);
  const indexes = headerIndexes(header);
  const amountIndex = groupedValueIndex(header, indexes.mutation);
  const balanceIndex = groupedValueIndex(header, indexes.balance);

  return rows
    .map((row, sourceIndex) => ({
      date: parseDegiroDate(valueAt(row, indexes.date)),
      time: valueAt(row, indexes.time),
      product: valueAt(row, indexes.product),
      isin: valueAt(row, indexes.isin),
      description: valueAt(row, indexes.description),
      amount: parseEuropeanNumber(valueAt(row, amountIndex)),
      balance: parseEuropeanNumber(valueAt(row, balanceIndex)),
      sourceIndex,
    }))
    .filter((row) => row.date)
    .sort(
      (left, right) =>
        left.date - right.date ||
        left.time.localeCompare(right.time) ||
        right.sourceIndex - left.sourceIndex,
    );
}

export function parseTransactionsExport(text) {
  const [header = [], ...rows] = parseCsv(text);
  const indexes = headerIndexes(header);
  const adjacentPriceCurrencyIndex =
    indexes.price >= 0 && header[indexes.price + 1] === ""
      ? indexes.price + 1
      : -1;

  return rows
    .map((row, sourceIndex) => ({
      date: parseDegiroDate(valueAt(row, indexes.date)),
      time: valueAt(row, indexes.time),
      product: valueAt(row, indexes.product),
      isin: valueAt(row, indexes.isin),
      exchange: valueAt(row, indexes.exchange),
      venue: valueAt(row, indexes.venue),
      currency:
        valueAt(row, indexes.currency) ||
        valueAt(row, adjacentPriceCurrencyIndex),
      quantity: parseEuropeanNumber(valueAt(row, indexes.quantity)),
      price: parseEuropeanNumber(valueAt(row, indexes.price)),
      valueEur: parseEuropeanNumber(valueAt(row, indexes.valueEur)),
      feesEur: parseEuropeanNumber(valueAt(row, indexes.feesEur)),
      totalEur: parseEuropeanNumber(valueAt(row, indexes.totalEur)),
      orderId: valueAt(row, indexes.orderId),
      sourceIndex,
    }))
    .filter((row) => row.date && row.isin)
    .sort(
      (left, right) =>
        left.date - right.date ||
        left.time.localeCompare(right.time) ||
        left.sourceIndex - right.sourceIndex,
    );
}

export function duplicateTransactionCount(transactions) {
  const seen = new Set();
  let duplicates = 0;

  for (const transaction of transactions) {
    const signature = [
      transaction.date.toISOString(),
      transaction.time,
      transaction.isin,
      transaction.quantity,
      transaction.price,
      transaction.totalEur,
      transaction.orderId,
    ].join("|");

    if (seen.has(signature)) duplicates += 1;
    else seen.add(signature);
  }

  return duplicates;
}

export function instrumentRequirements(transactionText) {
  const requirements = new Map();

  for (const transaction of parseTransactionsExport(transactionText)) {
    const existing = requirements.get(transaction.isin) ?? {
      isin: transaction.isin,
      name: "",
      currency: "",
      venues: [],
    };

    if (!existing.name && transaction.product) {
      existing.name = transaction.product;
    }
    if (!existing.currency && transaction.currency) {
      existing.currency = transaction.currency.toUpperCase();
    }
    const venue = transaction.venue || transaction.exchange;
    if (venue && !existing.venues.includes(venue)) {
      existing.venues.push(venue);
    }
    requirements.set(transaction.isin, existing);
  }

  return [...requirements.values()];
}

export function transactionDateRange(transactionText) {
  const transactions = parseTransactionsExport(transactionText);
  if (!transactions.length) return null;

  return {
    start: transactions[0].date,
    end: transactions.at(-1).date,
  };
}

export function cashAt(accountRows, date) {
  let balance = 0;

  for (const row of accountRows) {
    if (row.date > date) break;
    if (Number.isFinite(row.balance)) balance = row.balance;
  }

  return balance;
}

export function contributionsAt(accountRows, date) {
  return accountRows.reduce((total, row) => {
    if (row.date > date) return total;
    if (isDeposit(row.description) || isWithdrawal(row.description)) {
      return total + (row.amount ?? 0);
    }
    return total;
  }, 0);
}

export function externalCashFlows(accountRows) {
  return accountRows
    .filter((row) => isDeposit(row.description) || isWithdrawal(row.description))
    .map((row) => ({ date: row.date, amount: -(row.amount ?? 0) }));
}

export function quantitiesAt(transactions, date) {
  const quantities = new Map();

  for (const transaction of transactions) {
    if (transaction.date > date) break;
    const currentQuantity = quantities.get(transaction.isin) ?? 0;
    quantities.set(transaction.isin, currentQuantity + (transaction.quantity ?? 0));
  }

  return quantities;
}
