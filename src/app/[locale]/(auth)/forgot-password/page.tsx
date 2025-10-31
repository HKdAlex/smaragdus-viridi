import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { getTranslations } from "next-intl/server";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              {t("forgotPassword.title")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("forgotPassword.subtitle")}
            </p>
          </div>

          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}

