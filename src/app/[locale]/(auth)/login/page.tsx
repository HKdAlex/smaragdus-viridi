import { Link as I18nLink } from "@/i18n/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { getTranslations } from "next-intl/server";

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Mobile-friendly container with better spacing */}
        <div className="bg-card border border-border rounded-lg shadow-lg p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              {t("login.title")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("login.subtitle")}
            </p>
          </div>

          <LoginForm />

          <div className="text-center mt-6 pt-6 border-t border-border">
            <I18nLink
              href="/signup"
              className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
            >
              {t("login.noAccount")}
            </I18nLink>
          </div>
        </div>
      </div>
    </div>
  );
}
