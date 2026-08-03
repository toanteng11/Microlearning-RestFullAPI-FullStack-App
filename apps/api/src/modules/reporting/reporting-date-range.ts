import { AppError } from '../../shared/errors/app-error.js';

const DAY_MS = 86_400_000;
const DEFAULT_DATE_RANGE_DAYS = 30;

export interface NormalizedReportingDateRange {
  from: Date;
  to: Date;
  timezone: string;
  rangeDays: number;
}

function zonedDateStart(value: string, timezone: string): Date {
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const target = Date.UTC(year, month - 1, day);
  let candidate = target;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    calendar: 'iso8601',
    numberingSystem: 'latn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(candidate))
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, Number(part.value)]),
    );
    const represented = Date.UTC(
      parts.year!,
      parts.month! - 1,
      parts.day!,
      parts.hour!,
      parts.minute!,
      parts.second!,
    );
    const correction = target - represented;
    candidate += correction;
    if (correction === 0) break;
  }
  return new Date(candidate);
}

function parseBound(value: string, timezone: string): Date {
  const result = /^\d{4}-\d{2}-\d{2}$/u.test(value)
    ? zonedDateStart(value, timezone)
    : new Date(value);
  if (Number.isNaN(result.getTime())) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid reporting date range');
  }
  return result;
}

export function normalizeReportingDateRange(
  input: { from?: string; to?: string; timezone?: string },
  options: { timezone: string; maxDateRangeDays: number; now: Date },
): NormalizedReportingDateRange {
  const timezone = input.timezone ?? options.timezone;
  const to = input.to ? parseBound(input.to, timezone) : options.now;
  const from = input.from
    ? parseBound(input.from, timezone)
    : new Date(to.getTime() - DEFAULT_DATE_RANGE_DAYS * DAY_MS);
  if (from >= to) throw new AppError(400, 'VALIDATION_ERROR', 'to must be after from');
  const rangeDays = (to.getTime() - from.getTime()) / DAY_MS;
  if (rangeDays > options.maxDateRangeDays) {
    throw new AppError(
      422,
      'REPORT_LIMIT_EXCEEDED',
      `Reporting date range must not exceed ${options.maxDateRangeDays} days`,
    );
  }
  return { from, to, timezone, rangeDays };
}
