import { describe, expect, it } from "vitest";
import {
  computeBillingWindow,
  computeClosingDate,
  computeDueDate,
  daysUntilDue,
  formatDayMonth,
  formatReferenceLong,
  formatReferenceShort,
  shiftReference,
} from "@/application/services/invoice";

describe("computeBillingWindow", () => {
  it("returns first and last day of a calendar month as UTC", () => {
    const window = computeBillingWindow(2026, 5);
    expect(window.start.toISOString()).toBe("2026-05-01T00:00:00.000Z");
    expect(window.end.toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });

  it("rolls into next year for December", () => {
    const window = computeBillingWindow(2026, 12);
    expect(window.start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(window.end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("rejects invalid months", () => {
    expect(() => computeBillingWindow(2026, 0)).toThrow();
    expect(() => computeBillingWindow(2026, 13)).toThrow();
  });
});

describe("computeDueDate", () => {
  it("places the due day in the next calendar month", () => {
    const due = computeDueDate(2026, 5, 10);
    expect(due.toISOString()).toBe("2026-06-10T00:00:00.000Z");
  });

  it("rolls into next year when invoice month is December", () => {
    const due = computeDueDate(2026, 12, 5);
    expect(due.toISOString()).toBe("2027-01-05T00:00:00.000Z");
  });

  it("clamps day to the last day of the target month", () => {
    // Due day 31 in February → must clamp.
    const due = computeDueDate(2026, 1, 31);
    expect(due.getUTCMonth()).toBe(1); // February
    expect(due.getUTCDate()).toBe(28); // 2026 not leap
  });
});

describe("computeClosingDate", () => {
  it("places the closing day in the reference month", () => {
    const closing = computeClosingDate(2026, 5, 20);
    expect(closing.toISOString()).toBe("2026-05-20T00:00:00.000Z");
  });

  it("clamps the closing day to month length", () => {
    const closing = computeClosingDate(2026, 2, 31);
    expect(closing.getUTCDate()).toBe(28);
  });
});

describe("daysUntilDue", () => {
  it("returns positive integer when due date is in the future", () => {
    const due = new Date(Date.UTC(2026, 4, 25));
    const now = new Date(Date.UTC(2026, 4, 20));
    expect(daysUntilDue(due, now)).toBe(5);
  });

  it("returns 0 when due date is today (UTC day)", () => {
    const due = new Date(Date.UTC(2026, 4, 20));
    const now = new Date(Date.UTC(2026, 4, 20, 14, 30));
    expect(daysUntilDue(due, now)).toBe(0);
  });

  it("returns negative when overdue", () => {
    const due = new Date(Date.UTC(2026, 4, 18));
    const now = new Date(Date.UTC(2026, 4, 20));
    expect(daysUntilDue(due, now)).toBe(-2);
  });
});

describe("shiftReference", () => {
  it("walks forward across years", () => {
    expect(shiftReference(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("walks backward across years", () => {
    expect(shiftReference(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
});

describe("formatters", () => {
  it("formatReferenceLong returns capitalized pt-BR month + year", () => {
    expect(formatReferenceLong(2026, 5)).toMatch(/^Maio de 2026$/);
  });

  it("formatReferenceShort returns short month label", () => {
    expect(formatReferenceShort(2026, 5).toLowerCase()).toContain("mai");
  });

  it("formatDayMonth returns DD short-month", () => {
    expect(formatDayMonth(new Date(Date.UTC(2026, 4, 5))).toLowerCase()).toContain("mai");
  });
});
