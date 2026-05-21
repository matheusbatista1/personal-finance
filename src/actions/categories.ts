"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/database/supabase/server";
import { requireUser } from "@/lib/auth";
import { createCategorySchema, type CreateCategoryInput } from "@/application/validation/category";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function revalidateAfter() {
  revalidatePath("/configuracoes");
  revalidatePath("/gastos/novo");
  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
}

export async function createCategory(input: CreateCategoryInput): Promise<ActionResult> {
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      icon_name: parsed.data.iconName,
      color: parsed.data.color || null,
      kind: parsed.data.kind,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Já existe uma categoria com esse nome." };
    }
    return { ok: false, error: "Não foi possível criar a categoria." };
  }

  revalidateAfter();
  return { ok: true, id: data?.id };
}

export async function updateCategory(
  id: string,
  input: CreateCategoryInput,
): Promise<ActionResult> {
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      icon_name: parsed.data.iconName,
      color: parsed.data.color || null,
      kind: parsed.data.kind,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Já existe uma categoria com esse nome." };
    }
    return { ok: false, error: "Não foi possível atualizar a categoria." };
  }

  revalidateAfter();
  return { ok: true };
}

export async function setCategoryActive(id: string, isActive: boolean): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  // Check if the category is system-owned (user_id IS NULL) or owned by the user
  const { data: row, error: fetchErr } = await supabase
    .from("categories")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: "Categoria não encontrada." };
  }

  if (row.user_id === user.id) {
    const { error } = await supabase
      .from("categories")
      .update({ is_active: isActive })
      .eq("id", id);
    if (error) return { ok: false, error: "Não foi possível atualizar." };
  } else if (row.user_id === null) {
    const { error } = await supabase
      .from("user_category_overrides")
      .upsert(
        { user_id: user.id, category_id: id, is_active: isActive },
        { onConflict: "user_id,category_id" },
      );
    if (error) return { ok: false, error: "Não foi possível atualizar." };
  } else {
    return { ok: false, error: "Sem permissão." };
  }

  revalidateAfter();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return {
      ok: false,
      error: "Não foi possível excluir a categoria.",
    };
  }

  revalidateAfter();
  return { ok: true };
}
