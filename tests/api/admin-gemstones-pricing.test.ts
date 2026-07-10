import { describe, expect, it } from "vitest";

import { gemstonePricingSchema } from "@/lib/validators/gemstone-pricing.validator";

describe("admin gemstone pricing payload", () => {
  it("accepts create payload with per-piece pricing", () => {
    const payload = {
      pricing_basis: "per_piece" as const,
      price_amount: 500000,
      price_per_piece: 50000,
      quantity: 10,
    };

    expect(gemstonePricingSchema.safeParse(payload).success).toBe(true);
  });

  it("accepts create payload with per-carat pricing", () => {
    const payload = {
      pricing_basis: "per_carat" as const,
      price_amount: 500000,
      price_per_carat: 250000,
      weight_carats: 2,
    };

    expect(gemstonePricingSchema.safeParse(payload).success).toBe(true);
  });
});
