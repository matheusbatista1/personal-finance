import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto.").max(80, "Nome muito longo."),
  role: z.string().trim().max(40, "Descrição muito longa.").optional().or(z.literal("")),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;

export const updateContactSchema = createContactSchema;
export type UpdateContactInput = CreateContactInput;
