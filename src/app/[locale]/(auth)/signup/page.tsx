import Link from "next/link";
import { SignupForm } from "@/features/auth/components/signup-form";
import { getTranslations } from "next-intl/server";
import { Link as I18nLink } from "@/i18n/navigation";

export default async function SignupPage() {
  const t = await getTranslations("auth");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {t("signup.title")}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t("signup.subtitle")}
          </p>
        </div>

        <SignupForm />

        <div className="text-center">
          <I18nLink href="/login" className="text-primary hover:text-primary/80">
            {t("signup.hasAccount")}
          </I18nLink>
        </div>
      </div>
    </div>
  );
}
