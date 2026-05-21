import type { MonthlyDashboardDTO } from "@/application/dto/MonthlyDashboardDTO";

export interface IDashboardRepository {
  findByCompetence(input: { year: number; month: number }): Promise<MonthlyDashboardDTO>;
}
