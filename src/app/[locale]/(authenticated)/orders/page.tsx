import { Metadata } from "next";
import { OrdersDashboard } from "@/features/orders/components/orders-dashboard";
import { createServerClient } from "@/lib/supabase-server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { userProfileService } from "@/features/user/services/user-profile-service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders");

  return {
    title: t("page.title"),
    description: t("page.description"),
    openGraph: {
      title: t("page.title"),
      description: t("page.description"),
      type: "website",
    },
  };
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function OrdersPage({ params }: PageProps) {
  const { locale } = await params;

  // Authentication is handled by the (authenticated) layout
  // We can safely assume the user is authenticated here
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // This should never happen due to layout protection, but keeping for safety
  if (!user) {
    redirect("/login");
  }

  // Get user profile for currency and preferences
  const profile = await userProfileService.getProfile(user.id);

  // Get profile statistics for analytics
  const stats = await userProfileService.getProfileStats(user.id);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <OrdersDashboard
          userId={user.id}
          userProfile={profile}
          stats={stats}
          locale={locale}
        />
      </div>
    </div>
  );
}
