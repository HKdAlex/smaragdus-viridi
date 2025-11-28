/**
 * User Activity Service (SRP: User Activity Tracking)
 * 
 * Handles logging and retrieving user activities.
 * Uses the user_activities table for persistence.
 */

import { createContextLogger } from '@/shared/utils/logger';
import { supabaseAdmin } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database';

export type ActivityType = 
  | 'order_placed'
  | 'order_status_changed'
  | 'profile_updated'
  | 'password_changed'
  | 'favorite_added'
  | 'favorite_removed'
  | 'cart_updated'
  | 'login'
  | 'logout';

export interface UserActivity {
  id: string;
  user_id: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface GetActivitiesOptions {
  page?: number;
  limit?: number;
  type?: ActivityType[];
}

export interface GetActivitiesResult {
  activities: UserActivity[];
  total: number;
  hasMore: boolean;
}

export class UserActivityService {
  private logger = createContextLogger('user-activity-service');
  private supabase: SupabaseClient<Database> | null;

  constructor(supabaseClient?: SupabaseClient<Database>) {
    // Use provided client or fall back to admin client
    this.supabase = supabaseClient || supabaseAdmin;
  }

  /**
   * Log a user activity
   */
  async logActivity(
    userId: string,
    type: ActivityType,
    description: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.supabase) {
        this.logger.warn('Supabase client not available');
        return { success: false, error: 'Database client not available' };
      }

      const { error } = await this.supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          type,
          description,
          metadata: metadata || null,
        });

      if (error) {
        this.logger.error('Failed to log activity', error, { userId, type });
        return { success: false, error: error.message };
      }

      this.logger.info('Activity logged', { userId, type, description });
      return { success: true };
    } catch (error) {
      this.logger.error('Exception logging activity', error as Error, { userId, type });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get activities for a user with pagination
   */
  async getActivities(
    userId: string,
    options: GetActivitiesOptions = {}
  ): Promise<GetActivitiesResult> {
    const { page = 1, limit = 20, type } = options;

    try {
      if (!this.supabase) {
        this.logger.warn('Supabase client not available');
        return { activities: [], total: 0, hasMore: false };
      }

      const offset = (page - 1) * limit;

      // Build query
      let query = this.supabase
        .from('user_activities')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filter by type if specified
      if (type && type.length > 0) {
        query = query.in('type', type);
      }

      const { data, error, count } = await query;

      if (error) {
        this.logger.error('Failed to fetch activities', error, { userId });
        return { activities: [], total: 0, hasMore: false };
      }

      const activities: UserActivity[] = (data || []).map(row => ({
        id: row.id,
        user_id: row.user_id,
        type: row.type as ActivityType,
        description: row.description,
        metadata: row.metadata as Record<string, any> | undefined,
        created_at: row.created_at || new Date().toISOString(),
      }));

      const total = count || 0;
      const hasMore = offset + activities.length < total;

      return { activities, total, hasMore };
    } catch (error) {
      this.logger.error('Exception fetching activities', error as Error, { userId });
      return { activities: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get recent activities for a user (convenience method)
   */
  async getRecentActivities(
    userId: string,
    limit: number = 10
  ): Promise<UserActivity[]> {
    const result = await this.getActivities(userId, { page: 1, limit });
    return result.activities;
  }

  /**
   * Delete activities older than a certain date (for cleanup)
   */
  async deleteOldActivities(
    olderThanDays: number = 90
  ): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      if (!this.supabase) {
        return { success: false, error: 'Database client not available' };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await this.supabase
        .from('user_activities')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        this.logger.error('Failed to delete old activities', error);
        return { success: false, error: error.message };
      }

      const deletedCount = data?.length || 0;
      this.logger.info('Deleted old activities', { deletedCount, olderThanDays });
      return { success: true, deletedCount };
    } catch (error) {
      this.logger.error('Exception deleting old activities', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton with admin client
export const userActivityService = new UserActivityService();

