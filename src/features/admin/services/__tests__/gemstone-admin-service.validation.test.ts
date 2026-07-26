import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  supabase: {},
}));

import { GemstoneAdminService } from "../gemstone-admin-service";

const baseValidForm = {
  serial_number: "TEST-001",
  name: "sapphire" as const,
  color: "blue" as const,
  cut_id: "cut-id",
  cut_code: "round",
  clarity: "VS1" as const,
  weight_carats: 1.5,
  length_mm: 5,
  width_mm: 5,
  depth_mm: 3,
  price_amount: 100000,
  price_currency: "USD" as const,
  in_stock: true,
};

describe("GemstoneAdminService.validateGemstoneData", () => {
  it("requires positive weight for per-carat pricing", () => {
    const result = GemstoneAdminService.validateGemstoneData({
      ...baseValidForm,
      pricing_basis: "per_carat",
      weight_carats: 0,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Weight must be greater than 0");
  });

  it("allows zero weight for per-piece pricing", () => {
    const result = GemstoneAdminService.validateGemstoneData({
      ...baseValidForm,
      pricing_basis: "per_piece",
      weight_carats: 0,
      quantity: 5,
      price_per_piece: 5000,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).not.toContain("Weight must be greater than 0");
  });

  it("allows zero weight for lot-fixed pricing", () => {
    const result = GemstoneAdminService.validateGemstoneData({
      ...baseValidForm,
      pricing_basis: "lot_fixed",
      weight_carats: 0,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).not.toContain("Weight must be greater than 0");
  });
});
