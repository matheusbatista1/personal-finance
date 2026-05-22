import type { MonthlyDashboardDTO } from "@/application/dto/MonthlyDashboardDTO";

export interface DashboardQuery {
  year: number;
  month: number;
  /** "overview" sums all transactions, "mine" only the user share. */
  view?: "overview" | "mine";
  /** Optional list of contact IDs. When non-empty, only keep transactions whose splits include at least one. */
  peopleIds?: string[];
  /** Optional list of card IDs. When non-empty, only keep transactions on those cards. */
  cardIds?: string[];
  /** Optional list of wallet IDs. When non-empty, only keep transactions on those wallets. */
  walletIds?: string[];
}

export interface IDashboardRepository {
  findByCompetence(input: DashboardQuery): Promise<MonthlyDashboardDTO>;
}
