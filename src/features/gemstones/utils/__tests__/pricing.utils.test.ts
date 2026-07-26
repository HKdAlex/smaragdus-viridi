import { describe, expect, it } from "vitest";

import {
  calculateTotalPrice,
  derivePricePerCarat,
  derivePricePerPiece,
  effectiveQuantity,
  getSecondaryPriceDisplay,
  hasDisplayableWeight,
  requiresWeightForPricing,
  suggestPricingBasis,
} from "../pricing.utils";

describe("pricing.utils", () => {
  describe("effectiveQuantity", () => {
    it("defaults null/undefined/zero to 1", () => {
      expect(effectiveQuantity(null)).toBe(1);
      expect(effectiveQuantity(undefined)).toBe(1);
      expect(effectiveQuantity(0)).toBe(1);
    });

    it("returns positive quantity as-is", () => {
      expect(effectiveQuantity(10)).toBe(10);
    });
  });

  describe("calculateTotalPrice", () => {
    it("calculates per-carat total", () => {
      expect(
        calculateTotalPrice("per_carat", {
          pricePerCarat: 250000,
          weightCarats: 2,
        })
      ).toBe(500000);
    });

    it("calculates per-piece total", () => {
      expect(
        calculateTotalPrice("per_piece", {
          pricePerPiece: 50000,
          quantity: 10,
        })
      ).toBe(500000);
    });

    it("uses quantity 1 when quantity is missing for per-piece", () => {
      expect(
        calculateTotalPrice("per_piece", {
          pricePerPiece: 50000,
        })
      ).toBe(50000);
    });

    it("returns null for lot_fixed", () => {
      expect(calculateTotalPrice("lot_fixed", {})).toBeNull();
    });
  });

  describe("derivePricePerCarat", () => {
    it("derives cents per carat from total and weight", () => {
      expect(derivePricePerCarat(500000, 2)).toBe(250000);
    });

    it("returns null for invalid weight", () => {
      expect(derivePricePerCarat(500000, 0)).toBeNull();
    });
  });

  describe("derivePricePerPiece", () => {
    it("derives cents per piece from total and quantity", () => {
      expect(derivePricePerPiece(500000, 10)).toBe(50000);
    });
  });

  describe("suggestPricingBasis", () => {
    it("defaults to per_carat regardless of quantity", () => {
      expect(suggestPricingBasis(10)).toBe("per_carat");
      expect(suggestPricingBasis(1)).toBe("per_carat");
      expect(suggestPricingBasis(null)).toBe("per_carat");
    });
  });

  describe("getSecondaryPriceDisplay", () => {
    it("returns per-carat secondary price", () => {
      expect(
        getSecondaryPriceDisplay({
          pricing_basis: "per_carat",
          price_amount: 500000,
          price_per_carat: 250000,
          weight_carats: 2,
        })
      ).toEqual({ amount: 250000, unit: "carat" });
    });

    it("returns per-piece secondary price with quantity", () => {
      expect(
        getSecondaryPriceDisplay({
          pricing_basis: "per_piece",
          price_amount: 500000,
          price_per_piece: 50000,
          quantity: 10,
        })
      ).toEqual({ amount: 50000, unit: "piece", quantity: 10 });
    });

    it("returns derived per-carat secondary for lot_fixed", () => {
      expect(
        getSecondaryPriceDisplay({
          pricing_basis: "lot_fixed",
          price_amount: 10860,
          price_per_carat: 3000,
          weight_carats: 3.62,
        })
      ).toEqual({ amount: 3000, unit: "carat" });
    });

    it("derives per-carat for lot_fixed when price_per_carat is absent", () => {
      expect(
        getSecondaryPriceDisplay({
          pricing_basis: "lot_fixed",
          price_amount: 500000,
          weight_carats: 2,
        })
      ).toEqual({ amount: 250000, unit: "carat" });
    });

    it("shows per-carat for legacy multi-qty lots after basis correction", () => {
      expect(
        getSecondaryPriceDisplay({
          pricing_basis: "per_carat",
          price_amount: 21958,
          price_per_carat: 11999,
          weight_carats: 1.83,
          quantity: 2,
        })
      ).toEqual({ amount: 11999, unit: "carat" });
    });
  });

  describe("requiresWeightForPricing", () => {
    it("requires weight only for per-carat basis", () => {
      expect(requiresWeightForPricing("per_carat")).toBe(true);
      expect(requiresWeightForPricing("per_piece")).toBe(false);
      expect(requiresWeightForPricing("lot_fixed")).toBe(false);
      expect(requiresWeightForPricing(null)).toBe(true);
    });
  });

  describe("hasDisplayableWeight", () => {
    it("returns true for positive weight", () => {
      expect(hasDisplayableWeight(1.5)).toBe(true);
      expect(hasDisplayableWeight("0.5")).toBe(true);
    });

    it("returns false for zero, negative, or invalid weight", () => {
      expect(hasDisplayableWeight(0)).toBe(false);
      expect(hasDisplayableWeight(-1)).toBe(false);
      expect(hasDisplayableWeight(null)).toBe(false);
      expect(hasDisplayableWeight(undefined)).toBe(false);
    });
  });
});
