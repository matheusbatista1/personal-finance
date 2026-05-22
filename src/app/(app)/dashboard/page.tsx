import { makeComputeMonthlyDashboard } from "@/infrastructure/container";
import { MonthSelector } from "@/components/layout/MonthSelector";
import { MonthlyHeroCard } from "@/components/finance/MonthlyHeroCard";
import { BalanceCards } from "@/components/finance/BalanceCards";
import { SplitResumesPanel } from "@/components/finance/SplitResumesPanel";
import { RecentTransactionsList } from "@/components/finance/RecentTransactionsList";
import { DashboardFilters } from "@/components/finance/DashboardFilters";
import { Fab } from "@/components/finance/Fab";
import { currentCompetence, parseCompetence } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/infrastructure/database/supabase/server";
import { materializeRecurring } from "@/infrastructure/services/recurring";

interface DashboardPageProps {
  searchParams: Promise<{ m?: string; view?: string; people?: string }>;
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

function normalizeView(value?: string): "overview" | "mine" {
  return value === "overview" ? "overview" : "mine";
}

function parsePeople(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const { year, month, raw } = resolveCompetence(params.m);
  const view = normalizeView(params.view);
  const peopleIds = parsePeople(params.people);

  const user = await requireUser();
  const supabase = await createClient();
  await materializeRecurring(supabase, user.id, year, month);

  const useCase = await makeComputeMonthlyDashboard();
  const dashboard = await useCase.execute({ year, month, view, peopleIds });

  return (
    <>
      <MonthSelector competence={raw} label={dashboard.competenceLabel} />
      <DashboardFilters
        view={view}
        selectedPeopleIds={peopleIds}
        contacts={dashboard.allContacts}
      />
      <MonthlyHeroCard totalCents={dashboard.user.totalCents} view={view} />
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
