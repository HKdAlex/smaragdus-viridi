import { createServerSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { GemstoneEditPageClient } from "./gemstone-edit-page-client";

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function GemstoneEditPage({ params }: PageProps) {
  const { id, locale } = await params;

  // Check admin status server-side
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?redirectTo=/${locale}/catalog/${id}/edit`);
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect(`/${locale}/catalog/${id}`);
  }

  return <GemstoneEditPageClient gemstoneId={id} locale={locale} />;
}

