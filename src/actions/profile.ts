"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/database/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  updatePasswordSchema,
  updateProfileSchema,
  type UpdatePasswordInput,
  type UpdateProfileInput,
} from "@/application/validation/profile";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse(input);
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
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: "Não foi possível salvar o perfil." };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
  return { ok: true };
}

export type AvatarResult = { ok: true; avatarUrl: string | null } | { ok: false; error: string };

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function uploadAvatar(formData: FormData): Promise<AvatarResult> {
  const user = await requireUser();
  const file = formData.get("avatar");
  if (!(file instanceof File)) return { ok: false, error: "Arquivo inválido." };
  if (file.size === 0) return { ok: false, error: "Arquivo vazio." };
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "Imagem maior que 4 MB." };
  }
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return { ok: false, error: "Use PNG, JPG, WEBP ou GIF." };
  }

  const supabase = await createClient();
  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (uploadError) return { ok: false, error: "Não foi possível enviar a imagem." };

  const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = publicData.publicUrl;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);
  if (updateError) return { ok: false, error: "Não foi possível salvar o perfil." };

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { ok: true, avatarUrl: publicUrl };
}

export async function removeAvatar(): Promise<AvatarResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) return { ok: false, error: "Não foi possível remover." };
  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { ok: true, avatarUrl: null };
}

export async function updatePassword(input: UpdatePasswordInput): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    return { ok: false, error: "Não foi possível alterar a senha." };
  }

  return { ok: true };
}
