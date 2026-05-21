import { z } from "zod";

const moneyCentsSchema = z
  .string()
  .trim()
  .transform((raw) => {
    if (!raw) return 0;
    const normalized = raw.replace(/\./g, "").replace(",", ".");
    const value = Number(normalized);
    if (Number.isNaN(value)) return Number.NaN;
    return Math.round(value * 100);
  })
  .refine((cents) => !Number.isNaN(cents), { message: "Valor inválido." })
  .refine((cents) => cents >= 0, { message: "O limite não pode ser negativo." });

const dayOfMonthSchema = z.coerce
  .number()
  .int("Use um número inteiro.")
  .min(1, "Mínimo 1.")
  .max(31, "Máximo 31.");

export const createCardSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto.").max(60, "Nome muito longo."),
  walletId: z.string().uuid("Selecione uma conta."),
  creditLimitCents: moneyCentsSchema,
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use formato #RRGGBB.")
    .default("#8a2be2"),
  closingDay: dayOfMonthSchema,
  dueDay: dayOfMonthSchema,
});

export type CreateCardInput = z.input<typeof createCardSchema>;
export type CreateCardOutput = z.output<typeof createCardSchema>;

export const updateCardSchema = createCardSchema;
export type UpdateCardInput = CreateCardInput;
export type UpdateCardOutput = CreateCardOutput;
