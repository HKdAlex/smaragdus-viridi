import { NextRequest, NextResponse } from "next/server";
import { currencyRateService } from "@/features/currency/services/currency-rate-service";
import { Logger } from "@/shared/utils/logger";

const logger = new Logger("CurrencyRatesCron");

/**
 * GET /api/cron/refresh-currency-rates
 * 
 * Scheduled cron job to refresh currency exchange rates from mig.kz
 * This endpoint is called automatically by Vercel Cron Jobs every hour
 * 
 * Security: Should be protected by Vercel Cron secret or similar
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    // Vercel automatically adds a secret header for cron jobs
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // If CRON_SECRET is set, verify the request
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron request attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    logger.info("Starting scheduled currency rates refresh");

    // Fetch fresh rates from mig.kz
    const rates = await currencyRateService.fetchRatesFromMigKz();
    
    // Update rates in database (saves to currency_rates table)
    await currencyRateService.updateRates(rates);

    logger.info("Successfully refreshed currency rates", {
      rates: rates.USD,
      updatedAt: rates.updatedAt,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Currency rates refreshed successfully",
        rates: rates.USD,
        updatedAt: rates.updatedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Failed to refresh currency rates in cron job", error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to refresh rates",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

