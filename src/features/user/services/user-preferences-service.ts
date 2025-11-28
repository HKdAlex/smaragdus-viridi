/**
 * User Preferences Service (SRP: Preferences Access)
 * 
 * SSOT for accessing user notification preferences.
 * No business logic - only data access.
 */

import { supabaseAdmin, supabase } from '@/lib/supabase';
import { createContextLogger } from '@/shared/utils/logger';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database';

export interface UserPreferences {
  email_notifications: boolean;
  order_updates: boolean;
  marketing_emails: boolean;
  chat_messages: boolean;
}

export class UserPreferencesService {
  private logger = createContextLogger('user-preferences-service');
  private supabase: SupabaseClient<Database> | null;

  constructor(supabaseClient?: SupabaseClient<Database>) {
    // Use provided client, or fallback to admin client (server-side) or regular client (client-side)
    this.supabase = supabaseClient || (typeof window === 'undefined' ? supabaseAdmin : supabase);
  }

  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      if (!this.supabase) {
        this.logger.error('Supabase client not available');
        return null;
      }

      // Try to get from user_preferences table first
      const { data: preferences, error: prefError } = await this.supabase
        .from('user_preferences')
        .select('email_notifications, order_updates, marketing_emails')
        .eq('user_id', userId)
        .single();

      if (!prefError && preferences) {
        // Map to our interface (chat_messages defaults to email_notifications)
        return {
          email_notifications: preferences.email_notifications ?? true,
          order_updates: preferences.order_updates ?? true,
          marketing_emails: preferences.marketing_emails ?? false,
          chat_messages: preferences.email_notifications ?? true, // Default to email_notifications
        };
      }

      // Fallback: check user_profiles.email if available
      // Default to true if no preferences found
      this.logger.info('No preferences found, using defaults', { userId });
      return {
        email_notifications: true,
        order_updates: true,
        marketing_emails: false,
        chat_messages: true,
      };
    } catch (error) {
      this.logger.error('Failed to get user preferences', error as Error, { userId });
      // Return defaults on error
      return {
        email_notifications: true,
        order_updates: true,
        marketing_emails: false,
        chat_messages: true,
      };
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.supabase) {
        this.logger.error('Supabase client not available');
        return { success: false, error: 'Database client not available' };
      }

      // Prepare update data
      const updateData: {
        email_notifications?: boolean;
        order_updates?: boolean;
        marketing_emails?: boolean;
        updated_at?: string;
      } = {
        updated_at: new Date().toISOString(),
      };

      if (preferences.email_notifications !== undefined) {
        updateData.email_notifications = preferences.email_notifications;
      }
      if (preferences.order_updates !== undefined) {
        updateData.order_updates = preferences.order_updates;
      }
      if (preferences.marketing_emails !== undefined) {
        updateData.marketing_emails = preferences.marketing_emails;
      }

      // Upsert preferences (insert if doesn't exist, update if exists)
      const { error } = await this.supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            ...updateData,
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) {
        this.logger.error('Failed to update preferences', error, { userId });
        return { success: false, error: error.message };
      }

      this.logger.info('Preferences updated successfully', { userId });
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to update preferences', error as Error, { userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if user should receive chat notifications
   */
  async shouldSendChatNotification(userId: string): Promise<boolean> {
    const preferences = await this.getUserNotificationPreferences(userId);
    return preferences?.chat_messages ?? true; // Default to true
  }
}

