import { z } from "zod";

const optionalPrice = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v > 0), {
    message: "Price must be positive",
  });

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
  price: z
    .string()
    .trim()
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v > 0, { message: "Price must be positive" }),
  salePrice: optionalPrice,
  stock: z
    .string()
    .trim()
    .transform((v) => Number(v || 0))
    .refine((v) => Number.isFinite(v) && v >= 0 && Number.isInteger(v), {
      message: "Stock cannot be negative",
    }),
  sku: z.string().trim().min(1, "SKU is required"),
  categoryId: z.string().min(1, "Category is required"),
  featured: z.boolean(),
  newArrival: z.boolean(),
  active: z.boolean(),
  images: z.array(z.string()),
  optionConfig: z
    .array(
      z.object({
        name: z.string().min(1),
        values: z.array(
          z.object({
            value: z.string().min(1),
            image: z.string().nullable().optional(),
          })
        ),
      })
    )
    .nullable(),
  variants: z.array(
    z.object({
      id: z.string().optional(),
      sku: z.string().trim().min(1, "Variant SKU is required"),
      attributes: z.record(z.string(), z.string()),
      stock: z.number().int().min(0),
      price: z.number().positive().nullable(),
      salePrice: z.number().positive().nullable(),
      active: z.boolean(),
    })
  ),
});

export type ProductFormPayload = z.infer<typeof productFormSchema>;

export function productFormErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message || "Invalid product";
}
