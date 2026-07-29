export function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (insideQuotes) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        insideQuotes = false;
      } else {
        value += character;
      }
      continue;
    }

    if (character === '"') {
      insideQuotes = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (value.length || row.length) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows;
}

export function parseEuropeanNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const compact = String(value).trim().replace(/\s/g, "");
  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");
  let normalized = compact;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    normalized = compact
      .replaceAll(thousandsSeparator, "")
      .replace(decimalSeparator, ".");
  } else if (lastComma >= 0) {
    normalized = compact.replaceAll(".", "").replace(",", ".");
  } else if ((compact.match(/\./g) ?? []).length > 1) {
    normalized = compact.replaceAll(".", "");
  }

  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

export function parseDegiroDate(value) {
  const text = String(value ?? "").trim();
  const localDate = text.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/);
  if (localDate) {
    const [, day, month, year] = localDate;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  return null;
}

export function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

export function monthEnd(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0));
}
