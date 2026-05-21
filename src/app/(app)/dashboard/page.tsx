import { makeComputeMonthlyDashboard } from "@/infrastructure/container";
import { MonthSelector } from "@/components/layout/MonthSelector";
import { MonthlyHeroCard } from "@/components/finance/MonthlyHeroCard";
import { BalanceCards } from "@/components/finance/BalanceCards";
import { SplitResumesPanel } from "@/components/finance/SplitResumesPanel";
import { RecentTransactionsList } from "@/components/finance/RecentTransactionsList";
import { Fab } from "@/components/finance/Fab";
import { currentCompetence, parseCompetence } from "@/lib/format";

interface DashboardPageProps {
  searchParams: Promise<{ m?: string }>;
}

function resolveCompetence(input?: string): { year: number; month: number; raw: string } {
  if (!input) {
    const raw = currentCompetence();
    const { year, month } = parseCompetence(raw);
    return { year, month, raw };
  }
  try {
    const { year, month } = parseCompetence(input);
    return { year, month, raw: input };
  } catch {
    const raw = currentCompetence();
    const { year, month } = parseCompetence(raw);
    return { year, month, raw };
  }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const { year, month, raw } = resolveCompetence(params.m);

  const useCase = await makeComputeMonthlyDashboard();
  const dashboard = await useCase.execute({ year, month });

  return (
    <>
      <MonthSelector competence={raw} label={dashboard.competenceLabel} />
      <MonthlyHeroCard totalCents={dashboard.user.totalCents} />
      <BalanceCards
        available={{
          cents: dashboard.balance.availableCents,
          deltaPct: dashboard.balance.deltaPct,
        }}
        receivable={{
          cents: dashboard.receivable.amountCents,
          progress: dashboard.receivable.progress,
        }}
      />
      <SplitResumesPanel
        rows={dashboard.contactsBreakdown}
        globalTotalCents={dashboard.totalsAll.totalCents}
      />
      <RecentTransactionsList rows={dashboard.recentTransactions} />
      <Fab />
    </>
  );
}
