"use client";

import { useAuth } from "@/features/auth/context/auth-context";
import { useRouter } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { mapAuthError, type AuthErrorType } from "../utils/error-mapper";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<AuthErrorType | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const { signIn } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");
  const locale = useLocale();

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError("");
    setErrorType(null);
    setResendSuccess(false);

    try {
      const emailValue = formData.get("email") as string;
      const password = formData.get("password") as string;
      setEmail(emailValue); // Store email for resend functionality

      await signIn(emailValue, password);

      // Redirect to profile after successful login
      router.push("/profile");
    } catch (err) {
      const errorResult = mapAuthError(err, (key) => t(key));
      setError(errorResult.message);
      setErrorType(errorResult.type);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) return;

    setIsResending(true);
    setResendSuccess(false);

    try {
      // Resend confirmation email with locale
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://crystallique.com";
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${baseUrl}/api/auth/callback?locale=${locale}&next=/profile`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setResendSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.resendError"));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          {t("login.email")}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          disabled={isLoading}
          placeholder={t("login.emailPlaceholder")}
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          {t("login.password")}
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          disabled={isLoading}
          placeholder={t("login.passwordPlaceholder")}
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div className="space-y-3">
          <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-md">
            {error}
          </div>

          {/* Email Verification Help */}
          {errorType === "emailNotVerified" && (
            <div className="bg-muted/50 border border-border p-3 rounded-md space-y-3">
              <p className="text-sm font-medium text-foreground mb-2">
                {t("login.emailVerificationHelp.title")}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside mb-3">
                <li>{t("login.emailVerificationHelp.checkInbox")}</li>
                <li>{t("login.emailVerificationHelp.checkSpam")}</li>
                <li>{t("login.emailVerificationHelp.useCode")}</li>
              </ul>
              {email && (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendConfirmation}
                    disabled={isResending}
                    className="w-full"
                  >
                    {isResending
                      ? t("login.emailVerificationHelp.resending")
                      : t("login.emailVerificationHelp.resendEmail")}
                  </Button>
                  {resendSuccess && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {t("login.emailVerificationHelp.resendSuccess")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* General Login Help (for other errors) */}
          {errorType !== "emailNotVerified" && (
            <div className="bg-muted/50 border border-border p-3 rounded-md">
              <p className="text-sm font-medium text-foreground mb-2">
                {t("login.errorHelp.title")}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>{t("login.errorHelp.checkEmail")}</li>
                <li>{t("login.errorHelp.checkPassword")}</li>
                <li>{t("login.errorHelp.forgotPassword")}</li>
                <li>{t("login.errorHelp.noAccount")}</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => router.push("/forgot-password" as any)}
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          {t("login.forgotPassword")}
        </button>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? t("login.signingIn") : t("login.signIn")}
      </Button>
    </form>
  );
}
