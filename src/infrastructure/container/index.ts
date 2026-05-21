import { ComputeMonthlyDashboard } from "@/application/use-cases/dashboard/ComputeMonthlyDashboard";
import { SupabaseDashboardRepository } from "@/infrastructure/repositories/SupabaseDashboardRepository";
import { createClient } from "@/infrastructure/database/supabase/server";

/**
 * Per-request factory. Creates a Supabase server client bound to the current
 * request's cookies, then composes the use case with a fresh repository.
 *
 * Call from Server Components / Server Actions only.
 */
export async function makeComputeMonthlyDashboard() {
  const supabase = await createClient();
  const repository = new SupabaseDashboardRepository(supabase);
  return new ComputeMonthlyDashboard(repository);
}
