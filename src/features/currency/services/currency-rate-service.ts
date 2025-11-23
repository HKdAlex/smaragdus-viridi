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
      // More specific regex to avoid matching wrong numbers
      const rates: MigKzRate[] = [];

      // Extract USD rates - mig.kz shows buy/sell rates in KZT
      // Pattern: USD followed by numbers (typically 400-600 range for KZT)
      const usdPattern = /USD[^0-9]*?(\d{3,4}(?:\.\d{1,2})?)[^0-9]*?(\d{3,4}(?:\.\d{1,2})?)/i;
      const usdMatch = html.match(usdPattern);
      if (usdMatch) {
        const buy = parseFloat(usdMatch[1]);
        const sell = parseFloat(usdMatch[2]);
        // Validate USD rates are in reasonable range (400-600 KZT per USD)
        if (!isNaN(buy) && !isNaN(sell) && buy > 300 && buy < 700 && sell > 300 && sell < 700) {
          rates.push({
            currency: "USD",
            buy,
            sell,
          });
          this.logger.info("Parsed USD rate", { buy, sell });
        } else {
          this.logger.warn("USD rate out of expected range", { buy, sell });
        }
      } else {
        this.logger.warn("Could not parse USD rate from mig.kz HTML");
      }

      // Extract EUR rates - should be similar or higher than USD (500-700 KZT per EUR)
      const eurPattern = /EUR[^0-9]*?(\d{3,4}(?:\.\d{1,2})?)[^0-9]*?(\d{3,4}(?:\.\d{1,2})?)/i;
      const eurMatch = html.match(eurPattern);
      if (eurMatch) {
        const buy = parseFloat(eurMatch[1]);
        const sell = parseFloat(eurMatch[2]);
        // Validate EUR rates are in reasonable range (400-800 KZT per EUR)
        if (!isNaN(buy) && !isNaN(sell) && buy > 300 && buy < 900 && sell > 300 && sell < 900) {
          rates.push({
            currency: "EUR",
            buy,
            sell,
          });
          this.logger.info("Parsed EUR rate", { buy, sell });
        } else {
          this.logger.warn("EUR rate out of expected range", { buy, sell });
        }
      } else {
        this.logger.warn("Could not parse EUR rate from mig.kz HTML");
      }

      // Extract RUB rates - should be much lower (5-8 KZT per RUB)
      const rubPattern = /RUB[^0-9]*?(\d{1,2}(?:\.\d{1,2})?)[^0-9]*?(\d{1,2}(?:\.\d{1,2})?)/i;
      const rubMatch = html.match(rubPattern);
      if (rubMatch) {
        const buy = parseFloat(rubMatch[1]);
        const sell = parseFloat(rubMatch[2]);
        // Validate RUB rates are in reasonable range (4-10 KZT per RUB)
        if (!isNaN(buy) && !isNaN(sell) && buy > 3 && buy < 12 && sell > 3 && sell < 12) {
          rates.push({
            currency: "RUB",
            buy,
            sell,
          });
          this.logger.info("Parsed RUB rate", { buy, sell });
        } else {
          this.logger.warn("RUB rate out of expected range", { buy, sell });
        }
      } else {
        this.logger.warn("Could not parse RUB rate from mig.kz HTML");
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

      // Log parsed values for debugging
      this.logger.info("Parsed rates from mig.kz", {
        usdRate,
        eurRate,
        rubRate,
        usdToKzt,
        eurToKzt,
        rubToKzt,
      });

      // Validate rates are reasonable
      // USD to KZT should be around 450-550
      // EUR to KZT should be around 500-700 (EUR is stronger than USD)
      // RUB to KZT should be around 5-8
      if (
        usdToKzt < 400 ||
        usdToKzt > 600 ||
        (eurRate && (eurToKzt < 400 || eurToKzt > 800)) ||
        (rubRate && (rubToKzt < 4 || rubToKzt > 10))
      ) {
        this.logger.warn("Parsed rates seem invalid, using fallback", {
          usdToKzt,
          eurToKzt,
          rubToKzt,
        });
        return this.getFallbackRates();
      }

      // Convert to USD-based rates
      // USD to EUR: if 1 USD = 520 KZT and 1 EUR = 602 KZT, then 1 USD = 520/602 EUR
      const usdToEur = usdToKzt / eurToKzt;
      // USD to RUB: if 1 USD = 520 KZT and 1 RUB = 6.5 KZT, then 1 USD = 520/6.5 RUB
      const usdToRub = usdToKzt / rubToKzt;

      // Validate converted rates are reasonable
      // USD to EUR should be around 0.85-1.0 (EUR is usually stronger)
      // USD to RUB should be around 80-100
      if (
        usdToEur < 0.7 ||
        usdToEur > 1.1 ||
        usdToRub < 50 ||
        usdToRub > 150
      ) {
        this.logger.warn("Converted rates seem invalid, using fallback", {
          usdToEur,
          usdToRub,
        });
        return this.getFallbackRates();
      }

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
        rawRates: {
          usdToEur,
          usdToRub,
          usdToKzt,
        },
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

