import { Metadata } from "next";
import { UserProfilePage } from "@/features/user/components/user-profile-page";
import { createServerClient } from "@/lib/supabase-server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { userProfileService } from "@/features/user/services/user-profile-service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("user");

  return {
    title: t("profile.title"),
    description: t("profile.description"),
  };
}

export default async function ProfilePage() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get user profile
  let profile = await userProfileService.getProfile(user.id);

  if (!profile) {
    // Create default profile if it doesn't exist
    const defaultProfile = {
      name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
      phone: "",
      preferred_currency: "USD" as const,
      language_preference: "en" as const,
      email_notifications: true,
      order_updates: true,
      marketing_emails: false,
    };

    const result = await userProfileService.updateProfile(
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
        email_notifications: true,
        order_updates: true,
        marketing_emails: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  // Get profile statistics
  const stats = await userProfileService.getProfileStats(user.id);

  return (
    <UserProfilePage
      user={profile}
      stats={stats}
      onUpdateProfile={async (updates) => {
        "use server";
        await userProfileService.updateProfile(user.id, updates);
      }}
      onUpdatePreferences={async (preferences) => {
        "use server";
        // TODO: Implement preferences update
      }}
      onChangePassword={async (request) => {
        "use server";
        await userProfileService.changePassword(user.id, request);
      }}
    />
  );
}
