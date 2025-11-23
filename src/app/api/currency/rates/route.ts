import { NextRequest, NextResponse } from "next/server";
import { currencyRateService } from "@/features/currency/services/currency-rate-service";
import { Logger } from "@/shared/utils/logger";

const logger = new Logger("CurrencyRatesAPI");

/**
 * GET /api/currency/rates
 * Fetches current exchange rates from mig.kz and caches them in database
 * Returns rates as JSON: { USD: { RUB: rate, EUR: rate, KZT: rate }, updatedAt: string }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    logger.info("Fetching currency rates", { forceRefresh });

    // Get rates (will fetch fresh if needed or if forceRefresh is true)
    let rates;
    if (forceRefresh) {
      rates = await currencyRateService.fetchRatesFromMigKz();
      await currencyRateService.updateRates(rates);
    } else {
      rates = await currencyRateService.getAllRates();
    }

    return NextResponse.json(
      {
        success: true,
        rates: rates.USD,
        updatedAt: rates.updatedAt,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    logger.error("Failed to fetch currency rates", error as Error);

    // Return fallback rates on error
    const fallbackRates = {
      RUB: 92.7,
      EUR: 0.95,
      KZT: 463.5,
    };

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch rates, using fallback",
        rates: fallbackRates,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 } // Return 200 with fallback data
    );
  }
}

