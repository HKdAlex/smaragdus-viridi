import { Link as I18nLink } from "@/i18n/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { getTranslations } from "next-intl/server";

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {t("login.title")}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{t("login.subtitle")}</p>
        </div>

        <LoginForm />

        <div className="text-center">
          <I18nLink
            href="/signup"
            className="text-primary hover:text-primary/80"
          >
            {t("login.noAccount")}
          </I18nLink>
        </div>
      </div>
    </div>
  );
}
