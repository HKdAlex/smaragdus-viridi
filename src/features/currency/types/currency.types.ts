import type { CurrencyCode } from "@/shared/types";

export interface ExchangeRates {
  USD: {
    RUB: number;
    EUR: number;
    KZT: number;
  };
  updatedAt: string;
}

export interface CurrencyRate {
  base_currency: CurrencyCode;
  target_currency: CurrencyCode;
  rate: number;
  updated_at: string;
}

export interface MigKzRate {
  currency: string;
  buy: number;
  sell: number;
}

export class CurrencyError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "CurrencyError";
  }
}

