import { ComputeMonthlyDashboard } from "@/application/use-cases/dashboard/ComputeMonthlyDashboard";
import { InMemoryDashboardRepository } from "@/infrastructure/repositories/InMemoryDashboardRepository";

const dashboardRepository = new InMemoryDashboardRepository();

export function makeComputeMonthlyDashboard() {
  return new ComputeMonthlyDashboard(dashboardRepository);
}
