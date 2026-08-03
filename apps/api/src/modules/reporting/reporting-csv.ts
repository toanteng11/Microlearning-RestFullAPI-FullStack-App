export type CsvValue = string | number | boolean | null | undefined;
export type CsvRow = Record<string, CsvValue>;

export function neutralizeSpreadsheetFormula(value: string) {
  return /^(?:[\t\r]|\s*[=+\-@])/u.test(value) ? `'${value}` : value;
}

export function encodeCsvCell(value: CsvValue) {
  const text =
    value === null || value === undefined
      ? ''
      : typeof value === 'string'
        ? neutralizeSpreadsheetFormula(value)
        : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function* serializeCsv(headers: readonly string[], rows: readonly CsvRow[]) {
  yield `${headers.map(encodeCsvCell).join(',')}\r\n`;
  for (const row of rows) {
    yield `${headers.map((header) => encodeCsvCell(row[header])).join(',')}\r\n`;
  }
}

export function safeCsvFilename(reportId: string, scope: string, generatedAt: Date) {
  const safeReport = reportId
    .toLowerCase()
    .replace(/[^a-z0-9-]/gu, '-')
    .slice(0, 50);
  const safeScope = scope
    .toLowerCase()
    .replace(/[^a-z0-9-]/gu, '-')
    .slice(0, 50);
  const stamp = generatedAt
    .toISOString()
    .replace(/[-:]/gu, '')
    .replace(/\.\d{3}Z$/u, 'Z');
  return `microlearning-${safeReport}-${safeScope}-${stamp}.csv`;
}
