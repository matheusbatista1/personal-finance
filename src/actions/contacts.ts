"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/database/supabase/server";
import { requireUser } from "@/lib/auth";
import { createContactSchema, type CreateContactInput } from "@/application/validation/contact";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createContact(input: CreateContactInput): Promise<ActionResult> {
  const parsed = createContactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert({
    user_id: user.id,
    name: parsed.data.name,
    email: parsed.data.email || null,
    color: parsed.data.role || null,
  });

  if (error) {
    return { ok: false, error: "Não foi possível adicionar a pessoa." };
  }

  revalidatePath("/pessoas");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateContact(id: string, input: CreateContactInput): Promise<ActionResult> {
  const parsed = createContactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("contacts")
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      color: parsed.data.role || null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Não foi possível atualizar a pessoa." };
  }

  revalidatePath("/pessoas");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteContact(contactId: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("contacts").delete().eq("id", contactId);
  if (error) {
    return {
      ok: false,
      error: "Não foi possível remover. Pode haver transações vinculadas a essa pessoa.",
    };
  }

  revalidatePath("/pessoas");
  revalidatePath("/dashboard");
  return { ok: true };
}
