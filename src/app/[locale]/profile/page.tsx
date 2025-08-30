import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

import { createServerClient } from '@/lib/supabase'
import { UserProfilePage } from '@/features/user/components/user-profile-page'
import { userProfileService } from '@/features/user/services/user-profile-service'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('user')

  return {
    title: t('profile.title'),
    description: t('profile.description'),
  }
}

export default async function ProfilePage() {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Get user profile
  const profile = await userProfileService.getProfile(user.id)

  if (!profile) {
    // Profile doesn't exist, redirect to complete profile setup
    redirect('/profile/setup')
  }

  // Get profile statistics
  const stats = await userProfileService.getProfileStats(user.id)

  return (
    <UserProfilePage
      user={profile}
      stats={stats}
      onUpdateProfile={async (updates) => {
        'use server'
        await userProfileService.updateProfile(user.id, updates)
      }}
      onUpdatePreferences={async (preferences) => {
        'use server'
        // TODO: Implement preferences update
      }}
      onChangePassword={async (request) => {
        'use server'
        await userProfileService.changePassword(user.id, request)
      }}
    />
  )
}
