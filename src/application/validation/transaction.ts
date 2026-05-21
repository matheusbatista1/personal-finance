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
  .refine((cents) => cents >= 0, { message: "O valor não pode ser negativo." });

const optionalMoneyCentsSchema = z
  .string()
  .trim()
  .transform((raw) => {
    if (!raw) return null;
    const normalized = raw.replace(/\./g, "").replace(",", ".");
    const value = Number(normalized);
    if (Number.isNaN(value)) return Number.NaN;
    return Math.round(value * 100);
  })
  .refine((cents) => cents === null || !Number.isNaN(cents), { message: "Valor inválido." })
  .refine((cents) => cents === null || cents >= 0, { message: "Não pode ser negativo." });

export const transactionSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("wallet"), id: z.string().uuid() }),
  z.object({ kind: z.literal("card"), id: z.string().uuid() }),
]);

const splitParticipantSchema = z.object({
  contactId: z.string().uuid(),
  customAmountCents: optionalMoneyCentsSchema,
});

export const createTransactionSchema = z.object({
  type: z.enum(["expense", "income"]),
  amountCents: moneyCentsSchema,
  description: z.string().trim().max(160, "Descrição muito longa.").optional().or(z.literal("")),
  occurredAt: z.string().min(1, "Data obrigatória."),
  categoryId: z.string().uuid("Categoria obrigatória.").optional().or(z.literal("")),
  source: transactionSourceSchema,
  operation: z.enum(["card", "loan", "pix"]).optional().or(z.literal("")),
  userIncludedInSplit: z.boolean(),
  participants: z.array(splitParticipantSchema),
});

export type CreateTransactionInput = z.input<typeof createTransactionSchema>;
export type CreateTransactionOutput = z.output<typeof createTransactionSchema>;
