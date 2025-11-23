"use client";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { useTranslations } from "next-intl";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              {t("resetPassword.title")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("resetPassword.subtitle")}
            </p>
          </div>

          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}



