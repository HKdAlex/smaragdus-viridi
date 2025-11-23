/**
 * User Preferences Service (SRP: Preferences Access)
 * 
 * SSOT for accessing user notification preferences.
 * No business logic - only data access.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { createContextLogger } from '@/shared/utils/logger';

export interface UserPreferences {
  email_notifications: boolean;
  order_updates: boolean;
  marketing_emails: boolean;
  chat_messages: boolean;
}

export class UserPreferencesService {
  private logger = createContextLogger('user-preferences-service');

  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      if (!supabaseAdmin) {
        this.logger.error('Supabase admin client not available');
        return null;
      }

      // Try to get from user_preferences table first
      const { data: preferences, error: prefError } = await supabaseAdmin
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
   * Check if user should receive chat notifications
   */
  async shouldSendChatNotification(userId: string): Promise<boolean> {
    const preferences = await this.getUserNotificationPreferences(userId);
    return preferences?.chat_messages ?? true; // Default to true
  }
}

