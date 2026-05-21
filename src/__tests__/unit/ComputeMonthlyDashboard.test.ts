import { describe, expect, it } from "vitest";
import { ComputeMonthlyDashboard } from "@/application/use-cases/dashboard/ComputeMonthlyDashboard";
import { InMemoryDashboardRepository } from "@/infrastructure/repositories/InMemoryDashboardRepository";

const buildUseCase = () => new ComputeMonthlyDashboard(new InMemoryDashboardRepository());

describe("ComputeMonthlyDashboard", () => {
  it("returns the fixture dashboard for a valid competence", async () => {
    const useCase = buildUseCase();
    const result = await useCase.execute({ year: 2026, month: 5 });

    expect(result.competence).toBe("2026-05");
    expect(result.competenceLabel).toMatch(/^Maio de 2026$/);
    expect(result.user.totalCents).toBe(910_239);
    expect(result.totalsAll.totalCents).toBe(1_544_412);
    expect(result.balance.availableCents).toBe(1_245_000);
    expect(result.balance.deltaPct).toBeCloseTo(5.2);
    expect(result.receivable.amountCents).toBe(320_050);
    expect(result.receivable.progress).toBeGreaterThan(0);
    expect(result.receivable.progress).toBeLessThanOrEqual(1);
  });

  it("breaks down contacts in the order returned by the repository", async () => {
    const useCase = buildUseCase();
    const { contactsBreakdown } = await useCase.execute({ year: 2026, month: 5 });

    expect(contactsBreakdown).toHaveLength(2);
    expect(contactsBreakdown[0]).toMatchObject({
      contactName: "Arthur",
      initial: "A",
      colorRole: "primary",
      splitCents: 0,
      individualCents: 65_499,
      totalCents: 65_499,
    });
    expect(contactsBreakdown[1]).toMatchObject({
      contactName: "Mãe",
      initial: "M",
      colorRole: "tertiary",
      splitCents: 9_247,
      individualCents: 394_248,
      totalCents: 403_495,
    });
  });

  it("ensures each contact's split + individual equals total", async () => {
    const useCase = buildUseCase();
    const { contactsBreakdown } = await useCase.execute({ year: 2026, month: 5 });

    for (const row of contactsBreakdown) {
      expect(row.splitCents + row.individualCents).toBe(row.totalCents);
    }
  });

  it("returns three recent transactions matching the design", async () => {
    const useCase = buildUseCase();
    const { recentTransactions } = await useCase.execute({ year: 2026, month: 5 });

    expect(recentTransactions).toHaveLength(3);
    expect(recentTransactions.map((t) => t.description)).toEqual([
      "Fogo de Chão",
      "Uber",
      "Condomínio",
    ]);
    expect(recentTransactions[0]?.badge.text).toMatch(/Dividido/);
    expect(recentTransactions[1]?.badge.text).toBe("Individual");
    expect(recentTransactions[2]?.badge.text).toMatch(/Mãe/);
  });

  it("rejects invalid month input", async () => {
    const useCase = buildUseCase();
    await expect(useCase.execute({ year: 2026, month: 0 })).rejects.toThrow();
    await expect(useCase.execute({ year: 2026, month: 13 })).rejects.toThrow();
  });
});
