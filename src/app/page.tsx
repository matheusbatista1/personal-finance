import { AuthBackground } from "@/components/auth/AuthBackground";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { MfaChallenge } from "@/components/auth/MfaChallenge";
import { AppShell } from "@/components/layout/AppShell";
import { MonthSelector } from "@/components/layout/MonthSelector";
import { MonthlyHeroCard } from "@/components/finance/MonthlyHeroCard";
import { BalanceCards } from "@/components/finance/BalanceCards";
import { SplitResumesPanel } from "@/components/finance/SplitResumesPanel";
import { RecentTransactionsList } from "@/components/finance/RecentTransactionsList";
import { DashboardFilters } from "@/components/finance/DashboardFilters";
import { Fab } from "@/components/finance/Fab";
import { makeComputeMonthlyDashboard } from "@/infrastructure/container";
import { createClient } from "@/infrastructure/database/supabase/server";
import { materializeRecurring } from "@/infrastructure/services/recurring";
import { currentCompetence, parseCompetence } from "@/lib/format";

interface HomePageProps {
  searchParams: Promise<{
    m?: string;
    view?: string;
    people?: string;
    cards?: string;
    wallets?: string;
  }>;
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

function parseCsv(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthBackground>
        <AuthShell mode="signin">
          <LoginForm />
        </AuthShell>
      </AuthBackground>
    );
  }

  // User signed in. If they have MFA enabled but only authenticated at AAL1,
  // force the second-factor challenge before showing any account data.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
    return (
      <AuthBackground>
        <MfaChallenge />
      </AuthBackground>
    );
  }

  const params = await searchParams;
  const { year, month, raw } = resolveCompetence(params.m);
  const view = normalizeView(params.view);
  const peopleIds = parseCsv(params.people);
  const cardIds = parseCsv(params.cards);
  const walletIds = parseCsv(params.wallets);

  await materializeRecurring(supabase, user.id, year, month);

  const useCase = await makeComputeMonthlyDashboard();
  const dashboard = await useCase.execute({
    year,
    month,
    view,
    peopleIds,
    cardIds,
    walletIds,
  });

  return (
    <AppShell>
      <MonthSelector competence={raw} label={dashboard.competenceLabel} />
      <DashboardFilters
        view={view}
        selectedPeopleIds={peopleIds}
        selectedCardIds={cardIds}
        selectedWalletIds={walletIds}
        contacts={dashboard.allContacts}
        cards={dashboard.allCards}
        wallets={dashboard.allWallets}
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
      {view === "overview" ? (
        <SplitResumesPanel
          rows={dashboard.contactsBreakdown}
          globalTotalCents={dashboard.totalsAll.totalCents}
        />
      ) : null}
      <RecentTransactionsList rows={dashboard.recentTransactions} />
      <Fab />
    </AppShell>
  );
}
