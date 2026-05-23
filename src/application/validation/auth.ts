import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  displayName: z
    .string()
    .min(2, "Nome muito curto.")
    .max(80, "Nome muito longo.")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Informe um e-mail válido."),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .max(72, "A senha precisa ter no máximo 72 caracteres."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres.")
      .max(72, "A senha precisa ter no máximo 72 caracteres."),
    passwordConfirm: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "As senhas não conferem.",
    path: ["passwordConfirm"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
