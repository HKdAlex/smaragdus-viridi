import type {
  ExchangeRates,
  MigKzRate,
} from "../types/currency.types";
import type { CurrencyCode } from "@/shared/types";
import { Logger } from "@/shared/utils/logger";
import { supabase } from "@/lib/supabase";

const MIG_KZ_URL = "https://mig.kz";
const ADJUSTMENT_FACTOR = 1.03; // 3% adjustment
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export class CurrencyRateService {
  private logger = new Logger("CurrencyRateService");
  private rateCache: Map<string, { rate: number; expiresAt: number }> =
    new Map();

  /**
   * Fetch exchange rates from mig.kz website
   * Parses HTML to extract USD exchange rates
   */
  async fetchRatesFromMigKz(): Promise<ExchangeRates> {
    try {
      this.logger.info("Fetching rates from mig.kz");

      const response = await fetch(MIG_KZ_URL, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch mig.kz: ${response.statusText}`);
      }

      const html = await response.text();

      // Parse rates from HTML
      // mig.kz displays rates in a table format
      // Looking for patterns like: USD | 519.3 | 521.7
      const rates: MigKzRate[] = [];

      // Extract USD rates - mig.kz shows buy/sell rates
      // We'll use the average of buy and sell, then apply 3% adjustment
      const usdMatch = html.match(/USD[\s\S]*?(\d+\.?\d*)[\s\S]*?(\d+\.?\d*)/i);
      if (usdMatch) {
        const buy = parseFloat(usdMatch[1]);
        const sell = parseFloat(usdMatch[2]);
        if (!isNaN(buy) && !isNaN(sell)) {
          rates.push({
            currency: "USD",
            buy,
            sell,
          });
        }
      }

      // Extract EUR rates
      const eurMatch = html.match(/EUR[\s\S]*?(\d+\.?\d*)[\s\S]*?(\d+\.?\d*)/i);
      if (eurMatch) {
        const buy = parseFloat(eurMatch[1]);
        const sell = parseFloat(eurMatch[2]);
        if (!isNaN(buy) && !isNaN(sell)) {
          rates.push({
            currency: "EUR",
            buy,
            sell,
          });
        }
      }

      // Extract RUB rates
      const rubMatch = html.match(/RUB[\s\S]*?(\d+\.?\d*)[\s\S]*?(\d+\.?\d*)/i);
      if (rubMatch) {
        const buy = parseFloat(rubMatch[1]);
        const sell = parseFloat(rubMatch[2]);
        if (!isNaN(buy) && !isNaN(sell)) {
          rates.push({
            currency: "RUB",
            buy,
            sell,
          });
        }
      }

      // mig.kz shows rates in KZT (Kazakhstani Tenge)
      // All rates are shown as how many KZT per unit of currency
      // USD: 519.3 KZT per USD (buy) and 521.7 KZT per USD (sell)
      // EUR: 600.0 KZT per EUR (buy) and 604.0 KZT per EUR (sell)
      // RUB: 6.43 KZT per RUB (buy) and 6.55 KZT per RUB (sell)
      const usdRate = rates.find((r) => r.currency === "USD");
      const eurRate = rates.find((r) => r.currency === "EUR");
      const rubRate = rates.find((r) => r.currency === "RUB");

      if (!usdRate) {
        throw new Error("Could not find USD rate on mig.kz");
      }

      // Calculate rates relative to USD
      // Average buy and sell rates for more stable conversion
      const usdToKzt = (usdRate.buy + usdRate.sell) / 2;
      const eurToKzt = eurRate ? (eurRate.buy + eurRate.sell) / 2 : 602;
      const rubToKzt = rubRate ? (rubRate.buy + rubRate.sell) / 2 : 6.5;

      // Convert to USD-based rates
      // USD to EUR: if 1 USD = 520 KZT and 1 EUR = 602 KZT, then 1 USD = 520/602 EUR
      const usdToEur = usdToKzt / eurToKzt;
      // USD to RUB: if 1 USD = 520 KZT and 1 RUB = 6.5 KZT, then 1 USD = 520/6.5 RUB
      const usdToRub = usdToKzt / rubToKzt;

      // Apply 3% adjustment
      const adjustedRates: ExchangeRates = {
        USD: {
          RUB: usdToRub * ADJUSTMENT_FACTOR,
          EUR: usdToEur * ADJUSTMENT_FACTOR,
          KZT: usdToKzt * ADJUSTMENT_FACTOR,
        },
        updatedAt: new Date().toISOString(),
      };

      this.logger.info("Successfully fetched rates from mig.kz", {
        rates: adjustedRates.USD,
      });

      return adjustedRates;
    } catch (error) {
      this.logger.error("Failed to fetch rates from mig.kz", error as Error);
      // Return fallback rates if mig.kz is unavailable
      return this.getFallbackRates();
    }
  }

  /**
   * Get fallback exchange rates when mig.kz is unavailable
   */
  private getFallbackRates(): ExchangeRates {
    this.logger.warn("Using fallback exchange rates");
    return {
      USD: {
        RUB: 90 * ADJUSTMENT_FACTOR, // ~92.7
        EUR: 0.92 * ADJUSTMENT_FACTOR, // ~0.95
        KZT: 450 * ADJUSTMENT_FACTOR, // ~463.5
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get exchange rate from database or fetch if not available/stale
   */
  async getRate(
    from: CurrencyCode,
    to: CurrencyCode
  ): Promise<number> {
    // Same currency, no conversion needed
    if (from === to) {
      return 1;
    }

    // Base currency is always USD
    if (from !== "USD") {
      throw new Error("Base currency must be USD");
    }

    // Check cache first
    const cacheKey = `${from}-${to}`;
    const cached = this.rateCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.rate;
    }

    try {
      // Try to get from database
      const { data, error } = await supabase
        .from("currency_rates")
        .select("*")
        .eq("base_currency", from)
        .eq("target_currency", to)
        .single();

      if (!error && data) {
        const rate = data.rate as number;
        const updatedAt = new Date(data.updated_at || 0).getTime();
        const age = Date.now() - updatedAt;

        // Use cached rate if less than 1 hour old
        if (age < CACHE_DURATION_MS) {
          this.rateCache.set(cacheKey, {
            rate,
            expiresAt: Date.now() + CACHE_DURATION_MS,
          });
          return rate;
        }
      }

      // Fetch fresh rates and update database
      const rates = await this.fetchRatesFromMigKz();
      await this.updateRates(rates);

      const rate = rates.USD[to as keyof typeof rates.USD] as number;
      this.rateCache.set(cacheKey, {
        rate,
        expiresAt: Date.now() + CACHE_DURATION_MS,
      });

      return rate;
    } catch (error) {
      this.logger.error("Failed to get rate", error as Error, { from, to });
      // Return fallback rate
      const fallbackRates = this.getFallbackRates();
      return fallbackRates.USD[to as keyof typeof fallbackRates.USD] as number;
    }
  }

  /**
   * Update exchange rates in database
   */
  async updateRates(rates: ExchangeRates): Promise<void> {
    try {
      const baseCurrency: CurrencyCode = "USD";
      const updates: Array<{
        base_currency: CurrencyCode;
        target_currency: CurrencyCode;
        rate: number;
        updated_at: string;
      }> = [];

      // Prepare updates for each target currency
      Object.entries(rates.USD).forEach(([target, rate]) => {
        if (target !== "updatedAt") {
          updates.push({
            base_currency: baseCurrency,
            target_currency: target as CurrencyCode,
            rate: rate as number,
            updated_at: rates.updatedAt,
          });
        }
      });

      // Upsert rates (update if exists, insert if not)
      for (const update of updates) {
        const { error } = await supabase
          .from("currency_rates")
          .upsert(
            {
              base_currency: update.base_currency,
              target_currency: update.target_currency,
              rate: update.rate,
              updated_at: update.updated_at,
            },
            {
              onConflict: "base_currency,target_currency",
            }
          );

        if (error) {
          this.logger.error("Failed to update rate", error, {
            base: update.base_currency,
            target: update.target_currency,
          });
        }
      }

      this.logger.info("Successfully updated currency rates in database");
    } catch (error) {
      this.logger.error("Failed to update rates", error as Error);
      throw error;
    }
  }

  /**
   * Get all current exchange rates
   */
  async getAllRates(): Promise<ExchangeRates> {
    try {
      const { data, error } = await supabase
        .from("currency_rates")
        .select("*")
        .eq("base_currency", "USD");

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        // No rates in database, fetch fresh
        return await this.fetchRatesFromMigKz();
      }

      // Build rates object from database
      const rates: ExchangeRates = {
        USD: {
          RUB: 1,
          EUR: 1,
          KZT: 1,
        },
        updatedAt: new Date().toISOString(),
      };

      data.forEach((rate) => {
        const target = rate.target_currency as CurrencyCode;
        if (target in rates.USD) {
          rates.USD[target as keyof typeof rates.USD] = rate.rate as number;
        }
        if (rate.updated_at) {
          rates.updatedAt = rate.updated_at;
        }
      });

      return rates;
    } catch (error) {
      this.logger.error("Failed to get all rates", error as Error);
      return this.getFallbackRates();
    }
  }
}

// Export singleton instance
export const currencyRateService = new CurrencyRateService();

