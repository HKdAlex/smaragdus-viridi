import { describe, expect, it } from "vitest";

import { gemstonePricingSchema } from "../gemstone-pricing.validator";

describe("gemstonePricingSchema", () => {
  it("accepts valid per-carat pricing", () => {
    const result = gemstonePricingSchema.safeParse({
      pricing_basis: "per_carat",
      price_amount: 500000,
      price_per_carat: 250000,
      weight_carats: 2,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid per-piece pricing", () => {
    const result = gemstonePricingSchema.safeParse({
      pricing_basis: "per_piece",
      price_amount: 500000,
      price_per_piece: 50000,
      quantity: 10,
    });
    expect(result.success).toBe(true);
  });

  it("accepts lot_fixed with total only", () => {
    const result = gemstonePricingSchema.safeParse({
      pricing_basis: "lot_fixed",
      price_amount: 500000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects per-piece without quantity", () => {
    const result = gemstonePricingSchema.safeParse({
      pricing_basis: "per_piece",
      price_amount: 500000,
      price_per_piece: 50000,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects per-carat without weight", () => {
    const result = gemstonePricingSchema.safeParse({
      pricing_basis: "per_carat",
      price_amount: 500000,
      price_per_carat: 250000,
    });
    expect(result.success).toBe(false);
  });
});
