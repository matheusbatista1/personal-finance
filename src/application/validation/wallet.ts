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
  .refine((cents) => cents >= 0, { message: "O saldo não pode ser negativo." });

export const createWalletSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto.").max(80, "Nome muito longo."),
  bankId: z.string().uuid("Selecione um banco.").optional().or(z.literal("")),
  accountType: z.enum(["PF", "PJ"]),
  balanceCents: moneyCentsSchema,
});

export type CreateWalletInput = z.input<typeof createWalletSchema>;
export type CreateWalletOutput = z.output<typeof createWalletSchema>;
