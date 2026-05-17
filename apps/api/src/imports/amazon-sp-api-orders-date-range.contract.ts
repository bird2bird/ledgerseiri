export type AmazonSpApiOrdersDateRangeMode =
  | 'explicit-start-end'
  | 'explicit-created-window'
  | 'days-fallback';

export type AmazonSpApiOrdersDateRangeViolationReason =
  | 'partial_start_end'
  | 'invalid_start_date'
  | 'invalid_end_date'
  | 'invalid_created_after'
  | 'invalid_created_before'
  | 'invalid_days'
  | 'range_order_invalid'
  | 'range_too_long';

export type AmazonSpApiOrdersDateRangeRequest = {
  days?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  createdAfter?: unknown;
  createdBefore?: unknown;
  now?: Date;
  maxDays?: number;
  defaultDays?: number;
};

export type AmazonSpApiOrdersResolvedDateRange = {
  ok: true;
  rangeMode: AmazonSpApiOrdersDateRangeMode;
  requestedStartDate: string;
  requestedEndDate: string;
  actualCreatedAfter: string;
  actualCreatedBefore: string;
  createdAfter: string;
  createdBefore: string;
  daysFallback: number | null;
  rangeDays: number;
  maxDays: number;
};

export type AmazonSpApiOrdersDateRangeViolation = {
  ok: false;
  reason: AmazonSpApiOrdersDateRangeViolationReason;
  message: string;
  maxDays: number;
};

export type AmazonSpApiOrdersDateRangeResult =
  | AmazonSpApiOrdersResolvedDateRange
  | AmazonSpApiOrdersDateRangeViolation;

const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseDateOnlyStart(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null;
  const parsed = new Date(`${value.trim()}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function parseDateOnlyEnd(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null;
  const parsed = new Date(`${value.trim()}T23:59:59.999Z`);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function parseIsoDateTime(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 0, 0, 0, 0));
}

function endOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 23, 59, 59, 999));
}

function normalizeDays(value: unknown, fallback: number): number | null {
  if (value === undefined || value === null || value === '') return fallback;
  const numeric = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(numeric)) return null;
  return numeric;
}

function countInclusiveDays(start: Date, end: Date): number {
  const startDay = startOfUtcDay(start).getTime();
  const endDay = startOfUtcDay(end).getTime();
  return Math.floor((endDay - startDay) / DAY_MS) + 1;
}

function violation(
  reason: AmazonSpApiOrdersDateRangeViolationReason,
  message: string,
  maxDays: number,
): AmazonSpApiOrdersDateRangeViolation {
  return { ok: false, reason, message, maxDays };
}

export function resolveAmazonSpApiOrdersDateRangeForRequest(
  request: AmazonSpApiOrdersDateRangeRequest,
): AmazonSpApiOrdersDateRangeResult {
  const maxDays = normalizeDays(request.maxDays, 31);
  const defaultDays = normalizeDays(request.defaultDays, 14);

  if (!maxDays || maxDays < 1) {
    return violation('invalid_days', 'Amazon注文の取得期間上限設定が不正です。', 31);
  }

  if (!defaultDays || defaultDays < 1 || defaultDays > maxDays) {
    return violation('invalid_days', 'Amazon注文のデフォルト取得期間設定が不正です。', maxDays);
  }

  const startDate = normalizeOptionalString(request.startDate);
  const endDate = normalizeOptionalString(request.endDate);
  const createdAfter = normalizeOptionalString(request.createdAfter);
  const createdBefore = normalizeOptionalString(request.createdBefore);
  const now = request.now && Number.isFinite(request.now.getTime()) ? request.now : new Date();

  if ((startDate && !endDate) || (!startDate && endDate)) {
    return violation('partial_start_end', '取得開始日と取得終了日は両方指定してください。', maxDays);
  }

  if (startDate && endDate) {
    const start = parseDateOnlyStart(startDate);
    if (!start) {
      return violation('invalid_start_date', '取得開始日は YYYY-MM-DD 形式で指定してください。', maxDays);
    }

    const end = parseDateOnlyEnd(endDate);
    if (!end) {
      return violation('invalid_end_date', '取得終了日は YYYY-MM-DD 形式で指定してください。', maxDays);
    }

    if (start.getTime() >= end.getTime()) {
      return violation('range_order_invalid', '取得開始日は取得終了日より前にしてください。', maxDays);
    }

    const rangeDays = countInclusiveDays(start, end);
    if (rangeDays > maxDays) {
      return violation(
        'range_too_long',
        `取得期間が長すぎます。${maxDays}日以内を指定してください。`,
        maxDays,
      );
    }

    return {
      ok: true,
      rangeMode: 'explicit-start-end',
      requestedStartDate: toDateOnly(start),
      requestedEndDate: toDateOnly(end),
      actualCreatedAfter: start.toISOString(),
      actualCreatedBefore: end.toISOString(),
      createdAfter: start.toISOString(),
      createdBefore: end.toISOString(),
      daysFallback: null,
      rangeDays,
      maxDays,
    };
  }

  if (createdAfter) {
    const start = parseIsoDateTime(createdAfter);
    if (!start) {
      return violation('invalid_created_after', 'CreatedAfter is not a valid ISO date.', maxDays);
    }

    const end = createdBefore ? parseIsoDateTime(createdBefore) : endOfUtcDay(now);
    if (!end) {
      return violation('invalid_created_before', 'CreatedBefore is not a valid ISO date.', maxDays);
    }

    if (start.getTime() >= end.getTime()) {
      return violation('range_order_invalid', 'CreatedAfter must be before CreatedBefore.', maxDays);
    }

    const rangeDays = countInclusiveDays(start, end);
    if (rangeDays > maxDays) {
      return violation(
        'range_too_long',
        `取得期間が長すぎます。${maxDays}日以内を指定してください。`,
        maxDays,
      );
    }

    return {
      ok: true,
      rangeMode: 'explicit-created-window',
      requestedStartDate: toDateOnly(start),
      requestedEndDate: toDateOnly(end),
      actualCreatedAfter: start.toISOString(),
      actualCreatedBefore: end.toISOString(),
      createdAfter: start.toISOString(),
      createdBefore: end.toISOString(),
      daysFallback: null,
      rangeDays,
      maxDays,
    };
  }

  const days = normalizeDays(request.days, defaultDays);
  if (!days || days < 1 || days > maxDays) {
    return violation(
      'invalid_days',
      `取得期間は1日以上${maxDays}日以内で指定してください。`,
      maxDays,
    );
  }

  const end = endOfUtcDay(now);
  const start = startOfUtcDay(new Date(end.getTime() - (days - 1) * DAY_MS));

  return {
    ok: true,
    rangeMode: 'days-fallback',
    requestedStartDate: toDateOnly(start),
    requestedEndDate: toDateOnly(end),
    actualCreatedAfter: start.toISOString(),
    actualCreatedBefore: end.toISOString(),
    createdAfter: start.toISOString(),
    createdBefore: end.toISOString(),
    daysFallback: days,
    rangeDays: days,
    maxDays,
  };
}
