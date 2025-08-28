"use client";

import { supabase } from "@/lib/supabase";

// Simple logger for now
const logger = {
  info: (message: string, data?: any) => console.log(`[ADMIN-PRICE] ${message}`, data),
  error: (message: string, error?: any) => console.error(`[ADMIN-PRICE ERROR] ${message}`, error),
  warn: (message: string, data?: any) => console.warn(`[ADMIN-PRICE WARN] ${message}`, data),
};

export interface PriceUpdateData {
  gemstoneId: string;
  regularPrice?: number;
  premiumPrice?: number;
  currency: string;
  reason?: string;
}

export interface BulkPriceUpdate {
  gemstoneIds: string[];
  priceIncrease?: number; // percentage
  fixedPrice?: number;
  currency: string;
  reason: string;
}

export interface PriceHistoryEntry {
  id: string;
  gemstone_id: string;
  old_price: number;
  new_price: number;
  currency: string;
  change_type: 'manual' | 'bulk' | 'system';
  reason?: string;
  created_at: string;
  created_by?: string;
}

export interface PriceAnalytics {
  averagePrice: number;
  priceRange: { min: number; max: number };
  priceDistribution: { range: string; count: number }[];
  recentChanges: PriceHistoryEntry[];
  currencyBreakdown: { currency: string; count: number; avgPrice: number }[];
}

export class PriceManagementService {
  /**
   * Update pricing for a single gemstone
   */
  static async updateGemstonePrice(
    gemstoneId: string,
    updateData: PriceUpdateData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Updating gemstone price', {
        gemstoneId,
        updateData: { ...updateData, reason: updateData.reason || 'Manual update' }
      });

      // Get current pricing for audit trail
      const { data: currentGemstone } = await supabase
        .from('gemstones')
        .select('price_amount, price_currency, premium_price_amount, premium_price_currency')
        .eq('id', gemstoneId)
        .single();

      if (!currentGemstone) {
        return { success: false, error: 'Gemstone not found' };
      }

      // Prepare update data
      const updatePayload: any = {};

      if (updateData.regularPrice !== undefined) {
        updatePayload.price_amount = updateData.regularPrice;
        updatePayload.price_currency = updateData.currency;
      }

      if (updateData.premiumPrice !== undefined) {
        updatePayload.premium_price_amount = updateData.premiumPrice;
        updatePayload.premium_price_currency = updateData.currency;
      }

      updatePayload.updated_at = new Date().toISOString();

      // Update the gemstone
      const { error } = await supabase
        .from('gemstones')
        .update(updatePayload)
        .eq('id', gemstoneId);

      if (error) {
        logger.error('Failed to update gemstone price', error);
        return { success: false, error: error.message };
      }

      // Log price change in audit trail
      if (updateData.regularPrice !== undefined && updateData.regularPrice !== currentGemstone.price_amount) {
        await this.logPriceChange({
          gemstoneId,
          oldPrice: currentGemstone.price_amount,
          newPrice: updateData.regularPrice,
          currency: updateData.currency,
          changeType: 'manual',
          reason: updateData.reason || 'Manual price update'
        });
      }

      if (updateData.premiumPrice !== undefined && updateData.premiumPrice !== currentGemstone.premium_price_amount) {
        await this.logPriceChange({
          gemstoneId,
          oldPrice: currentGemstone.premium_price_amount || 0,
          newPrice: updateData.premiumPrice,
          currency: updateData.currency,
          changeType: 'manual',
          reason: updateData.reason || 'Premium price update'
        });
      }

      logger.info('Gemstone price updated successfully', { gemstoneId });
      return { success: true };
    } catch (error) {
      logger.error('Unexpected error updating price', error as Error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Bulk update prices for multiple gemstones
   */
  static async bulkUpdatePrices(
    updates: BulkPriceUpdate
  ): Promise<{ success: boolean; updated: number; failed: number; error?: string }> {
    try {
      logger.info('Starting bulk price update', {
        count: updates.gemstoneIds.length,
        updates
      });

      let updated = 0;
      let failed = 0;

      for (const gemstoneId of updates.gemstoneIds) {
        try {
          // Get current price
          const { data: gemstone } = await supabase
            .from('gemstones')
            .select('price_amount, price_currency')
            .eq('id', gemstoneId)
            .single();

          if (!gemstone) {
            failed++;
            continue;
          }

          let newPrice: number;
          if (updates.fixedPrice !== undefined) {
            newPrice = updates.fixedPrice;
          } else if (updates.priceIncrease !== undefined) {
            newPrice = gemstone.price_amount * (1 + updates.priceIncrease / 100);
          } else {
            failed++;
            continue;
          }

          // Update the price
          const updateResult = await this.updateGemstonePrice(gemstoneId, {
            gemstoneId,
            regularPrice: Math.round(newPrice),
            currency: updates.currency,
            reason: updates.reason
          });

          if (updateResult.success) {
            updated++;
          } else {
            failed++;
          }
        } catch (error) {
          logger.error('Failed to update gemstone in bulk operation', {
            gemstoneId,
            error: error as Error
          });
          failed++;
        }
      }

      logger.info('Bulk price update completed', {
        total: updates.gemstoneIds.length,
        updated,
        failed
      });

      return { success: true, updated, failed };
    } catch (error) {
      logger.error('Unexpected error in bulk price update', error as Error);
      return {
        success: false,
        updated: 0,
        failed: updates.gemstoneIds.length,
        error: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Get price analytics
   */
  static async getPriceAnalytics(): Promise<{ success: boolean; data?: PriceAnalytics; error?: string }> {
    try {
      logger.info('Fetching price analytics');

      // Get all gemstones with pricing
      const { data: gemstones, error } = await supabase
        .from('gemstones')
        .select('price_amount, price_currency, premium_price_amount, premium_price_currency')
        .not('price_amount', 'is', null);

      if (error) {
        return { success: false, error: error.message };
      }

      if (!gemstones || gemstones.length === 0) {
        return {
          success: true,
          data: {
            averagePrice: 0,
            priceRange: { min: 0, max: 0 },
            priceDistribution: [],
            recentChanges: [],
            currencyBreakdown: []
          }
        };
      }

      // Calculate analytics
      const prices = gemstones.map(g => g.price_amount);
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Price distribution
      const distribution = this.calculatePriceDistribution(prices);

      // Currency breakdown
      const currencyBreakdown = this.calculateCurrencyBreakdown(gemstones);

      // Recent price changes (simplified - would need a proper price_history table)
      const { data: recentChanges } = await supabase
        .from('gemstones')
        .select('id, updated_at')
        .order('updated_at', { ascending: false })
        .limit(10);

      const mockRecentChanges: PriceHistoryEntry[] = recentChanges?.map(g => ({
        id: `change-${g.id}`,
        gemstone_id: g.id,
        old_price: 0, // Would need proper price history tracking
        new_price: 0,
        currency: 'USD',
        change_type: 'manual' as const,
        reason: 'Recent update',
        created_at: g.updated_at || '',
        created_by: 'system'
      })) || [];

      const analytics: PriceAnalytics = {
        averagePrice: Math.round(averagePrice),
        priceRange: { min: minPrice, max: maxPrice },
        priceDistribution: distribution,
        recentChanges: mockRecentChanges,
        currencyBreakdown
      };

      logger.info('Price analytics calculated', {
        gemstoneCount: gemstones.length,
        averagePrice: analytics.averagePrice
      });

      return { success: true, data: analytics };
    } catch (error) {
      logger.error('Unexpected error fetching price analytics', error as Error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get price history for a gemstone
   */
  static async getGemstonePriceHistory(
    gemstoneId: string
  ): Promise<{ success: boolean; data?: PriceHistoryEntry[]; error?: string }> {
    try {
      logger.info('Fetching price history', { gemstoneId });

      // For now, return mock data - would need a proper price_history table
      const mockHistory: PriceHistoryEntry[] = [
        {
          id: '1',
          gemstone_id: gemstoneId,
          old_price: 1000,
          new_price: 1200,
          currency: 'USD',
          change_type: 'manual',
          reason: 'Market adjustment',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'admin'
        },
        {
          id: '2',
          gemstone_id: gemstoneId,
          old_price: 1200,
          new_price: 1100,
          currency: 'USD',
          change_type: 'bulk',
          reason: 'Seasonal discount',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'admin'
        }
      ];

      return { success: true, data: mockHistory };
    } catch (error) {
      logger.error('Unexpected error fetching price history', error as Error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Log price change to audit trail
   */
  private static async logPriceChange(params: {
    gemstoneId: string;
    oldPrice: number;
    newPrice: number;
    currency: string;
    changeType: 'manual' | 'bulk' | 'system';
    reason?: string;
  }): Promise<void> {
    try {
      // For now, just log to console - would need a price_history table
      logger.info('Price change logged', params);
    } catch (error) {
      logger.error('Failed to log price change', error as Error);
    }
  }

  /**
   * Calculate price distribution
   */
  private static calculatePriceDistribution(prices: number[]): { range: string; count: number }[] {
    const ranges = [
      { min: 0, max: 500, label: '$0 - $500' },
      { min: 500, max: 1000, label: '$500 - $1,000' },
      { min: 1000, max: 2500, label: '$1,000 - $2,500' },
      { min: 2500, max: 5000, label: '$2,500 - $5,000' },
      { min: 5000, max: 10000, label: '$5,000 - $10,000' },
      { min: 10000, max: Infinity, label: '$10,000+' }
    ];

    return ranges.map(range => ({
      range: range.label,
      count: prices.filter(price => price >= range.min && price < range.max).length
    }));
  }

  /**
   * Calculate currency breakdown
   */
  private static calculateCurrencyBreakdown(gemstones: any[]): { currency: string; count: number; avgPrice: number }[] {
    const currencyGroups = gemstones.reduce((acc, gem) => {
      const currency = gem.price_currency;
      if (!acc[currency]) {
        acc[currency] = { prices: [], count: 0 };
      }
      acc[currency].prices.push(gem.price_amount);
      acc[currency].count++;
      return acc;
    }, {} as Record<string, { prices: number[]; count: number }>);

    return (Object.entries(currencyGroups) as [string, { prices: number[]; count: number }][]).map(([currency, data]) => ({
      currency,
      count: data.count,
      avgPrice: Math.round(data.prices.reduce((sum: number, price: number) => sum + price, 0) / data.prices.length)
    }));
  }
}
