/**
 * Invoice helpers — naive calendar-month model.
 *
 * An invoice references a calendar month (YYYY-MM). Its window contains every
 * card transaction with `occurred_at` inside that month. The due date is the
 * card's `due_day` in the following calendar month — clamped to month length
 * (e.g. Feb 30 → Feb 28/29).
 */

export interface BillingWindow {
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
}

export function computeBillingWindow(year: number, month: number): BillingWindow {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month ${month}.`);
  }
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return {
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export function computeDueDate(year: number, month: number, dueDay: number): Date {
  if (dueDay < 1 || dueDay > 31) {
    throw new Error(`Invalid due day ${dueDay}.`);
  }
  // Due day in the NEXT month relative to the invoice reference.
  const targetYear = month === 12 ? year + 1 : year;
  const targetMonth = month === 12 ? 0 : month;
  const lastDay = lastDayOfMonth(targetYear, targetMonth);
  const safeDay = Math.min(dueDay, lastDay);
  return new Date(Date.UTC(targetYear, targetMonth, safeDay));
}

export function computeClosingDate(year: number, month: number, closingDay: number): Date {
  if (closingDay < 1 || closingDay > 31) {
    throw new Error(`Invalid closing day ${closingDay}.`);
  }
  const lastDay = lastDayOfMonth(year, month - 1);
  const safeDay = Math.min(closingDay, lastDay);
  return new Date(Date.UTC(year, month - 1, safeDay));
}

export function daysUntilDue(dueDate: Date, now: Date = new Date()): number {
  const startOfDue = Date.UTC(
    dueDate.getUTCFullYear(),
    dueDate.getUTCMonth(),
    dueDate.getUTCDate(),
  );
  const startOfNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((startOfDue - startOfNow) / 86_400_000);
}

export function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function shiftReference(year: number, month: number, delta: number) {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

const longMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const shortMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  timeZone: "UTC",
});

const dayMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

export function formatReferenceLong(year: number, month: number): string {
  const raw = longMonthFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatReferenceShort(year: number, month: number): string {
  const raw = shortMonthFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(".", "");
}

export function formatDayMonth(date: Date): string {
  return dayMonthFormatter.format(date);
}
