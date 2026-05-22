import type { MonthlyDashboardDTO } from "@/application/dto/MonthlyDashboardDTO";

export interface DashboardQuery {
  year: number;
  month: number;
  /** "overview" sums all transactions, "mine" only the user share. */
  view?: "overview" | "mine";
  /** Optional list of contact IDs. When non-empty, only keep transactions whose splits include at least one. */
  peopleIds?: string[];
}

export interface IDashboardRepository {
  findByCompetence(input: DashboardQuery): Promise<MonthlyDashboardDTO>;
}
