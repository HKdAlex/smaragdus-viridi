/**
 * Admin Service (SRP: Admin Data Access)
 * 
 * SSOT for accessing admin data.
 * No business logic - only data access.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { createContextLogger } from '@/shared/utils/logger';
import type { DatabaseUserProfile } from '@/shared/types';

export interface Admin {
  user_id: string;
  email: string | null;
  name: string;
  role: 'admin';
}

export interface AdminPreferences {
  chat_notifications_enabled: boolean;
  notification_frequency: 'immediate' | 'digest' | 'off';
}

export class AdminService {
  private logger = createContextLogger('admin-service');

  /**
   * Get all active admins with their email addresses
   */
  async getActiveAdmins(): Promise<Admin[]> {
    try {
      if (!supabaseAdmin) {
        this.logger.error('Supabase admin client not available');
        return [];
      }

      const { data: admins, error } = await supabaseAdmin
        .from('user_profiles')
        .select('user_id, email, name, role')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error('Failed to fetch admins', error);
        return [];
      }

      return (admins || []).map((admin) => ({
        user_id: admin.user_id,
        email: admin.email,
        name: admin.name,
        role: 'admin' as const,
      }));
    } catch (error) {
      this.logger.error('Exception while fetching admins', error as Error);
      return [];
    }
  }

  /**
   * Get admin notification preferences
   * For now, defaults to enabled. Can be extended later with admin_preferences table.
   */
  async getAdminNotificationPreferences(adminId: string): Promise<AdminPreferences> {
    // Default preferences - can be extended with admin_preferences table later
    return {
      chat_notifications_enabled: true,
      notification_frequency: 'immediate',
    };
  }

  /**
   * Get admin emails for notifications
   */
  async getAdminEmails(): Promise<string[]> {
    const admins = await this.getActiveAdmins();
    return admins
      .map((admin) => admin.email)
      .filter((email): email is string => email !== null && email !== '');
  }
}

