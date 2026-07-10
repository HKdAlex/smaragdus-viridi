export type PricingBasis = "per_carat" | "per_piece" | "lot_fixed";

export interface PricingCalculationInput {
  pricePerCarat?: number | null;
  pricePerPiece?: number | null;
  weightCarats?: number | null;
  quantity?: number | null;
}

export interface SecondaryPriceDisplay {
  amount: number;
  unit: "carat" | "piece";
  quantity?: number;
}

export interface PricingDisplayGemstone {
  pricing_basis?: PricingBasis | string | null;
  price_amount: number;
  price_per_carat?: number | null;
  price_per_piece?: number | null;
  weight_carats?: number | string | null;
  quantity?: number | null;
}

export function effectiveQuantity(quantity: number | null | undefined): number {
  if (quantity === null || quantity === undefined || quantity < 1) {
    return 1;
  }
  return quantity;
}

export function derivePricePerCarat(
  totalCents: number,
  weightCarats: number | null | undefined
): number | null {
  const weight = Number(weightCarats);
  if (!Number.isFinite(weight) || weight <= 0 || totalCents <= 0) {
    return null;
  }
  return Math.round(totalCents / weight);
}

export function derivePricePerPiece(
  totalCents: number,
  quantity: number | null | undefined
): number | null {
  const qty = effectiveQuantity(quantity);
  if (totalCents <= 0) {
    return null;
  }
  return Math.round(totalCents / qty);
}

export function calculateTotalPrice(
  basis: PricingBasis,
  input: PricingCalculationInput
): number | null {
  switch (basis) {
    case "per_carat": {
      const weight = Number(input.weightCarats);
      const pricePerCarat = input.pricePerCarat;
      if (
        pricePerCarat === null ||
        pricePerCarat === undefined ||
        pricePerCarat < 0 ||
        !Number.isFinite(weight) ||
        weight <= 0
      ) {
        return null;
      }
      return Math.round(pricePerCarat * weight);
    }
    case "per_piece": {
      const pricePerPiece = input.pricePerPiece;
      if (
        pricePerPiece === null ||
        pricePerPiece === undefined ||
        pricePerPiece < 0
      ) {
        return null;
      }
      return Math.round(pricePerPiece * effectiveQuantity(input.quantity));
    }
    case "lot_fixed":
      return null;
    default: {
      const _exhaustive: never = basis;
      return _exhaustive;
    }
  }
}

export function suggestPricingBasis(
  quantity: number | null | undefined
): PricingBasis {
  if (quantity !== null && quantity !== undefined && quantity > 1) {
    return "per_piece";
  }
  return "per_carat";
}

export function normalizePricingBasis(
  value: string | null | undefined
): PricingBasis {
  if (value === "per_piece" || value === "lot_fixed" || value === "per_carat") {
    return value;
  }
  return "per_carat";
}

export function getSecondaryPriceDisplay(
  gemstone: PricingDisplayGemstone
): SecondaryPriceDisplay | null {
  const basis = normalizePricingBasis(gemstone.pricing_basis ?? "per_carat");

  if (basis === "lot_fixed") {
    return null;
  }

  if (basis === "per_piece") {
    const fromDb =
      typeof gemstone.price_per_piece === "number" &&
      gemstone.price_per_piece > 0
        ? gemstone.price_per_piece
        : null;
    const amount =
      fromDb ??
      derivePricePerPiece(gemstone.price_amount, gemstone.quantity);
    if (amount === null) {
      return null;
    }
    const qty = gemstone.quantity ?? undefined;
    return {
      amount,
      unit: "piece",
      quantity: qty !== null && qty !== undefined && qty > 1 ? qty : undefined,
    };
  }

  const fromDb =
    typeof gemstone.price_per_carat === "number" &&
    gemstone.price_per_carat > 0
      ? gemstone.price_per_carat
      : null;
  const amount =
    fromDb ??
    derivePricePerCarat(gemstone.price_amount, Number(gemstone.weight_carats));
  if (amount === null) {
    return null;
  }
  return { amount, unit: "carat" };
}

export function clearedPricingFieldsForBasis(
  basis: PricingBasis
): Partial<{
  price_per_carat: null;
  price_per_piece: null;
}> {
  switch (basis) {
    case "per_carat":
      return { price_per_piece: null };
    case "per_piece":
      return { price_per_carat: null };
    case "lot_fixed":
      return { price_per_carat: null, price_per_piece: null };
    default: {
      const _exhaustive: never = basis;
      return _exhaustive;
    }
  }
}
