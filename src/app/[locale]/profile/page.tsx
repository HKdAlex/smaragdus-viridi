import { UserProfilePage } from "@/features/user/components/user-profile-page";
import { UserProfileService } from "@/features/user/services/user-profile-service";
import { createServerSupabaseClient } from "@/lib/supabase";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("user");

  return {
    title: t("profile.title"),
    description: t("profile.description"),
  };
}

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Create server-side UserProfileService instance
  const serverUserProfileService = new UserProfileService(supabase as any);

  // Get user profile
  let profile = await serverUserProfileService.getProfile(user.id);

  if (!profile) {
    // Create default profile if it doesn't exist
    const defaultProfile = {
      name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
      phone: "",
      preferred_currency: "USD" as const,
      language_preference: "en" as const,
      email: user.email || "",
    };

    const result = await serverUserProfileService.createProfile(
      user.id,
      defaultProfile
    );
    if (result.success && result.profile) {
      profile = result.profile;
    } else {
      // Fallback to basic profile data
      profile = {
        id: user.id,
        user_id: user.id,
        name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        phone: "",
        avatar_url: user.user_metadata?.avatar_url,
        role: "regular_customer" as const,
        discount_percentage: 0,
        preferred_currency: "USD" as const,
        language_preference: "en" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  // Get profile statistics
  const stats = await serverUserProfileService.getProfileStats(user.id);

  return (
    <UserProfilePage
      user={profile}
      stats={stats}
      onUpdateProfile={async (updates) => {
        "use server";
        const supabase = await createServerSupabaseClient();
        const service = new UserProfileService(supabase as any);
        await service.updateProfile(user.id, updates);
      }}
      onUpdatePreferences={async (preferences) => {
        "use server";
        // TODO: Implement preferences update
      }}
      onChangePassword={async (request) => {
        "use server";
        const supabase = await createServerSupabaseClient();
        const service = new UserProfileService(supabase as any);
        await service.changePassword(user.id, request);
      }}
    />
  );
}
