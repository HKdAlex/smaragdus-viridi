"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useAuth } from "../context/auth-context";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const t = useTranslations("auth");
  const locale = useLocale();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    if (!email) {
      setError(t("forgotPassword.emailRequired"));
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("forgotPassword.error"));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 w-full max-w-md px-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-md">
          <p className="text-sm text-green-800 dark:text-green-200">
            {t("forgotPassword.successMessage")}
          </p>
        </div>

        <Button
          onClick={() => router.push("/login" as any)}
          className="w-full min-h-[48px]"
        >
          {t("forgotPassword.backToLogin")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md px-4">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          {t("forgotPassword.emailLabel")}
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          placeholder={t("forgotPassword.emailPlaceholder")}
          autoComplete="email"
          className="min-h-[48px] text-base"
        />
        <p className="text-xs text-muted-foreground">
          {t("forgotPassword.description")}
        </p>
      </div>

      {error && (
        <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-md">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full min-h-[48px] bg-primary hover:bg-primary/90 text-primary-foreground text-base font-medium"
      >
        {isLoading
          ? t("forgotPassword.sending")
          : t("forgotPassword.sendResetLink")}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => router.push("/login" as any)}
        className="w-full min-h-[48px]"
      >
        {t("forgotPassword.backToLogin")}
      </Button>
    </form>
  );
}
