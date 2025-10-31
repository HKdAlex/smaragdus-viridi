"use client";

import { useLocale, useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useState } from "react";
import { useAuth } from "../context/auth-context";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const t = useTranslations("auth");
  const locale = useLocale();
  const { updatePassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!password || !confirmPassword) {
      setError(t("resetPassword.allFieldsRequired"));
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t("errors.weakPassword"));
      setIsLoading(false);
      return;
    }

    try {
      await updatePassword(password);
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login" as any);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("resetPassword.error")
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 w-full max-w-md px-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-md">
          <p className="text-sm text-green-800 dark:text-green-200">
            {t("resetPassword.successMessage")}
          </p>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          {t("resetPassword.redirecting")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md px-4">
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground"
        >
          {t("resetPassword.newPassword")}
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          placeholder={t("resetPassword.newPasswordPlaceholder")}
          autoComplete="new-password"
          className="min-h-[48px] text-base"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-foreground"
        >
          {t("resetPassword.confirmPassword")}
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading}
          placeholder={t("resetPassword.confirmPasswordPlaceholder")}
          autoComplete="new-password"
          className="min-h-[48px] text-base"
        />
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
          ? t("resetPassword.updating")
          : t("resetPassword.updatePassword")}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => router.push("/login" as any)}
        className="w-full min-h-[48px]"
      >
        {t("resetPassword.backToLogin")}
      </Button>
    </form>
  );
}

