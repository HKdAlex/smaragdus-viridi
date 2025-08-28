import type {
    CurrencyCode,
    UserPreferences
} from '@/shared/types'

import { Logger } from '@/shared/utils/logger'
import { supabase } from '@/lib/supabase'

export class PreferencesService {
  private supabase = supabase
  private logger = new Logger('PreferencesService')

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, return defaults
          this.logger.info('No user preferences found, returning defaults', { userId })
          return this.getDefaultPreferences()
        }
        throw error
      }

      this.logger.info('User preferences loaded', { userId, theme: data.theme })
      return data as UserPreferences
    } catch (error) {
      this.logger.error('Failed to get user preferences', error as Error, { userId })
      return this.getDefaultPreferences()
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences | null> {
    try {
      // Check if preferences already exist
      const { data: existing } = await this.supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .single()

      let result: any

      if (existing) {
        // Update existing preferences
        const { data, error } = await this.supabase
          .from('user_preferences')
          .update({
            ...preferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        // Create new preferences
        const defaultPrefs = this.getDefaultPreferences()
        const { data, error } = await this.supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            ...defaultPrefs,
            ...preferences,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error
        result = data
      }

      this.logger.info('User preferences updated', {
        userId,
        updatedFields: Object.keys(preferences)
      })

      return result as UserPreferences
    } catch (error) {
      this.logger.error('Failed to update user preferences', error as Error, {
        userId,
        preferences
      })
      return null
    }
  }

  /**
   * Update theme preference
   */
  async updateTheme(userId: string, theme: 'light' | 'dark' | 'system'): Promise<boolean> {
    try {
      const success = await this.updateUserPreferences(userId, { theme })
      if (success) {
        // Apply theme immediately
        this.applyTheme(theme)
      }
      return !!success
    } catch (error) {
      this.logger.error('Failed to update theme', error as Error, { userId, theme })
      return false
    }
  }

  /**
   * Update currency preference
   */
  async updateCurrency(userId: string, preferred_currency: CurrencyCode): Promise<boolean> {
    try {
      const success = await this.updateUserPreferences(userId, { preferred_currency })
      return !!success
    } catch (error) {
      this.logger.error('Failed to update currency', error as Error, {
        userId,
        preferred_currency
      })
      return false
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotifications(
    userId: string,
    notifications: {
      email_notifications?: boolean
      cart_updates?: boolean
      order_updates?: boolean
      marketing_emails?: boolean
    }
  ): Promise<boolean> {
    try {
      const success = await this.updateUserPreferences(userId, notifications)
      return !!success
    } catch (error) {
      this.logger.error('Failed to update notifications', error as Error, {
        userId,
        notifications
      })
      return false
    }
  }

  /**
   * Update privacy preferences
   */
  async updatePrivacy(
    userId: string,
    privacy: {
      profile_visibility?: 'public' | 'private'
      data_sharing?: boolean
    }
  ): Promise<boolean> {
    try {
      const success = await this.updateUserPreferences(userId, privacy)
      return !!success
    } catch (error) {
      this.logger.error('Failed to update privacy settings', error as Error, {
        userId,
        privacy
      })
      return false
    }
  }

  /**
   * Delete user preferences
   */
  async deleteUserPreferences(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      this.logger.info('User preferences deleted', { userId })
      return true
    } catch (error) {
      this.logger.error('Failed to delete user preferences', error as Error, { userId })
      return false
    }
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'system',
      preferred_currency: 'USD',
      email_notifications: true,
      cart_updates: true,
      order_updates: true,
      marketing_emails: false,
      profile_visibility: 'private',
      data_sharing: false
    }
  }

  /**
   * Apply theme to the document
   */
  private applyTheme(theme: 'light' | 'dark' | 'system'): void {
    const root = document.documentElement

    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      // Use system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // Store in localStorage for immediate access
    localStorage.setItem('theme', theme)
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null

    if (savedTheme) {
      this.applyTheme(savedTheme)
    } else {
      // Use system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      this.applyTheme('system')
    }
  }
}
