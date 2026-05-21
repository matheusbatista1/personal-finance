import { z } from "zod";

const allowedIcons = [
  "Utensils",
  "Car",
  "Home",
  "PawPrint",
  "ShoppingBag",
  "Gift",
  "HeartPulse",
  "Plane",
  "Repeat",
  "Briefcase",
  "GraduationCap",
  "Sparkles",
  "Receipt",
] as const;

export const allowedCategoryIcons = allowedIcons;

export const categoryKinds = ["expense", "income", "both"] as const;
export type CategoryKind = (typeof categoryKinds)[number];

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto.").max(40, "Nome muito longo."),
  iconName: z.enum(allowedIcons),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/i, "Cor inválida.")
    .optional()
    .or(z.literal("")),
  kind: z.enum(categoryKinds),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema;
export type UpdateCategoryInput = CreateCategoryInput;
