"use client";

import type {
    ChangePasswordRequest,
    ChangePasswordResponse,
    UpdateProfileRequest,
    UpdateProfileResponse,
    UseUserProfileReturn,
    UserPreferences,
    UserProfile,
} from '../types/user-profile.types';
import { useCallback, useEffect, useState } from 'react';

import { userProfileService } from '../services/user-profile-service';

export function useUserProfile(userId?: string): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user profile
  const loadProfile = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const userProfile = await userProfileService.getProfile(userId)
      if (userProfile) {
        setProfile(userProfile)

        // Set preferences from profile data
        setPreferences({
          currency: userProfile.preferred_currency,
          language: userProfile.language_preference,
          notifications: {
            email_notifications: userProfile.email_notifications,
            order_updates: userProfile.order_updates,
            marketing_emails: userProfile.marketing_emails,
            chat_messages: true, // Default to true
          },
          display: {
            items_per_page: 10,
            default_sort: 'newest',
            theme: 'light',
          },
        })
      } else {
        setError('Profile not found')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Update profile
  const updateProfile = useCallback(async (updates: UpdateProfileRequest): Promise<void> => {
    if (!profile) throw new Error('No profile loaded')

    const response: UpdateProfileResponse = await userProfileService.updateProfile(
      profile.user_id,
      updates
    )

    if (response.success && response.profile) {
      setProfile(response.profile)

      // Update preferences if currency or language changed
      if (updates.preferred_currency || updates.language_preference) {
        setPreferences(prev => prev ? {
          ...prev,
          currency: updates.preferred_currency || prev.currency,
          language: updates.language_preference || prev.language,
        } : null)
      }
    } else {
      throw new Error(response.error || 'Failed to update profile')
    }
  }, [profile])

  // Update preferences (local state only for now)
  const updatePreferences = useCallback(async (newPreferences: Partial<UserPreferences>): Promise<void> => {
    if (!preferences) return

    setPreferences(prev => prev ? { ...prev, ...newPreferences } : null)

    // TODO: Save to backend when preferences table is implemented
  }, [preferences])

  // Change password
  const changePassword = useCallback(async (request: ChangePasswordRequest): Promise<void> => {
    if (!profile) throw new Error('No profile loaded')

    const response: ChangePasswordResponse = await userProfileService.changePassword(
      profile.user_id,
      request
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to change password')
    }
  }, [profile])

  // Refresh data
  const refresh = useCallback(() => {
    loadProfile()
  }, [loadProfile])

  // Load profile on mount or when userId changes
  useEffect(() => {
    if (userId) {
      loadProfile()
    } else {
      setProfile(null)
      setPreferences(null)
      setError(null)
    }
  }, [userId, loadProfile])

  return {
    profile,
    preferences,
    loading,
    error,
    updateProfile,
    updatePreferences,
    changePassword,
    refresh,
  }
}




