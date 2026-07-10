import { z } from "zod";

export const pricingBasisSchema = z.enum([
  "per_carat",
  "per_piece",
  "lot_fixed",
]);

export const gemstonePricingSchema = z
  .object({
    pricing_basis: pricingBasisSchema.default("per_carat"),
    price_amount: z.number().int().positive(),
    price_per_carat: z.number().int().nonnegative().nullable().optional(),
    price_per_piece: z.number().int().nonnegative().nullable().optional(),
    weight_carats: z.number().positive().optional(),
    quantity: z.number().int().nonnegative().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    switch (data.pricing_basis) {
      case "per_carat": {
        if (!data.weight_carats || data.weight_carats <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Weight in carats is required for per-carat pricing",
            path: ["weight_carats"],
          });
        }
        const hasPerCarat =
          data.price_per_carat !== null &&
          data.price_per_carat !== undefined &&
          data.price_per_carat >= 0;
        const derivable =
          data.weight_carats &&
          data.weight_carats > 0 &&
          data.price_amount > 0;
        if (!hasPerCarat && !derivable) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Price per carat or derivable total is required",
            path: ["price_per_carat"],
          });
        }
        break;
      }
      case "per_piece": {
        const qty = data.quantity ?? 0;
        if (qty < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Quantity must be at least 1 for per-piece pricing",
            path: ["quantity"],
          });
        }
        const hasPerPiece =
          data.price_per_piece !== null &&
          data.price_per_piece !== undefined &&
          data.price_per_piece >= 0;
        const derivable = qty >= 1 && data.price_amount > 0;
        if (!hasPerPiece && !derivable) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Price per piece or derivable total is required",
            path: ["price_per_piece"],
          });
        }
        break;
      }
      case "lot_fixed":
        break;
      default: {
        const _exhaustive: never = data.pricing_basis;
        return _exhaustive;
      }
    }
  });

export type GemstonePricingInput = z.infer<typeof gemstonePricingSchema>;
