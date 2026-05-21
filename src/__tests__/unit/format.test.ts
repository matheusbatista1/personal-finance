import { describe, expect, it } from "vitest";
import {
  currentCompetence,
  formatBRL,
  formatCompetence,
  parseCompetence,
  shiftCompetence,
} from "@/lib/format";

describe("formatBRL", () => {
  it("formats positive cents as Brazilian Real with grouping", () => {
    expect(formatBRL(910_239)).toMatch(/9\.102,39/);
  });

  it("formats zero", () => {
    expect(formatBRL(0)).toMatch(/0,00/);
  });

  it("formats negative cents preserving sign", () => {
    expect(formatBRL(-45_000)).toMatch(/-/);
    expect(formatBRL(-45_000)).toMatch(/450,00/);
  });

  it("formats sub-1-real values", () => {
    expect(formatBRL(50)).toMatch(/0,50/);
  });

  it("formats million-range values", () => {
    expect(formatBRL(1_000_000_00)).toMatch(/1\.000\.000,00/);
  });
});

describe("formatCompetence", () => {
  it("returns capitalized pt-BR month label", () => {
    expect(formatCompetence(2026, 5)).toMatch(/^Maio de 2026$/);
  });

  it("handles January", () => {
    expect(formatCompetence(2026, 1)).toMatch(/^Janeiro de 2026$/);
  });

  it("handles December", () => {
    expect(formatCompetence(2026, 12)).toMatch(/^Dezembro de 2026$/);
  });
});

describe("parseCompetence", () => {
  it("parses a valid YYYY-MM string", () => {
    expect(parseCompetence("2026-05")).toEqual({ year: 2026, month: 5 });
  });

  it("rejects out-of-range month", () => {
    expect(() => parseCompetence("2026-13")).toThrow();
    expect(() => parseCompetence("2026-00")).toThrow();
  });

  it("rejects malformed input", () => {
    expect(() => parseCompetence("2026/05")).toThrow();
    expect(() => parseCompetence("2026-5")).toThrow();
    expect(() => parseCompetence("")).toThrow();
  });
});

describe("currentCompetence", () => {
  it("returns YYYY-MM for the supplied reference date", () => {
    expect(currentCompetence(new Date(2026, 4, 21))).toBe("2026-05");
    expect(currentCompetence(new Date(2026, 0, 1))).toBe("2026-01");
    expect(currentCompetence(new Date(2026, 11, 31))).toBe("2026-12");
  });
});

describe("shiftCompetence", () => {
  it("walks backward across year boundary", () => {
    expect(shiftCompetence("2026-01", -1)).toBe("2025-12");
  });

  it("walks forward across year boundary", () => {
    expect(shiftCompetence("2026-12", +1)).toBe("2027-01");
  });

  it("handles zero delta", () => {
    expect(shiftCompetence("2026-05", 0)).toBe("2026-05");
  });

  it("handles multi-month delta", () => {
    expect(shiftCompetence("2026-05", +7)).toBe("2026-12");
    expect(shiftCompetence("2026-05", -5)).toBe("2025-12");
  });
});
