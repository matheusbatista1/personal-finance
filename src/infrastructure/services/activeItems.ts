import type { SupabaseClient } from "@supabase/supabase-js";

export interface ActiveCategoryRow {
  id: string;
  name: string;
  icon_name: string | null;
  color: string | null;
  user_id: string | null;
  is_active: boolean;
  effectiveActive: boolean;
}

/**
 * Fetches all categories visible to the current user (own + system) and resolves
 * the effective `is_active` flag by joining with `user_category_overrides` for
 * system rows. Returns the full list — callers filter by `effectiveActive` when
 * they want only enabled categories.
 */
export async function fetchCategoriesForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<ActiveCategoryRow[]> {
  const [catRes, overridesRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, icon_name, color, user_id, is_active")
      .order("name", { ascending: true }),
    supabase.from("user_category_overrides").select("category_id, is_active"),
  ]);

  const overrides = new Map<string, boolean>();
  for (const row of overridesRes.data ?? []) {
    overrides.set(row.category_id as string, row.is_active as boolean);
  }

  const rows = (catRes.data ?? []) as Array<{
    id: string;
    name: string;
    icon_name: string | null;
    color: string | null;
    user_id: string | null;
    is_active: boolean;
  }>;

  return rows.map((row) => {
    const isSystem = row.user_id === null;
    const overrideActive = overrides.get(row.id);
    const effectiveActive = isSystem
      ? (overrideActive ?? row.is_active)
      : row.user_id === userId
        ? row.is_active
        : false;
    return { ...row, effectiveActive };
  });
}
