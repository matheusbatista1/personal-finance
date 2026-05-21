import type { MonthlyDashboardDTO } from "@/application/dto/MonthlyDashboardDTO";
import type { IDashboardRepository } from "@/application/repositories/IDashboardRepository";

export interface ComputeMonthlyDashboardInput {
  year: number;
  month: number;
}

export class ComputeMonthlyDashboard {
  constructor(private readonly repository: IDashboardRepository) {}

  async execute(input: ComputeMonthlyDashboardInput): Promise<MonthlyDashboardDTO> {
    if (input.month < 1 || input.month > 12) {
      throw new Error(`Invalid month ${input.month} for competence.`);
    }
    return this.repository.findByCompetence(input);
  }
}
