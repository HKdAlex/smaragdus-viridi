"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function AdminPage() {
  const router = useRouter();
  const t = useTranslations("admin.login");

  useEffect(() => {
    // Redirect to login page
    router.push("/admin/login" as any);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">{t("redirecting")}</p>
      </div>
    </div>
  );
}
