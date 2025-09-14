"use client";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { loginAction } from "@/features/auth/actions/auth-actions";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("auth");

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
      // Success redirect happens in server action
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("errors.invalidCredentials")
      );
    } finally {
      setIsLoading(false);
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
        <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? t("login.signingIn") : t("login.signIn")}
      </Button>
    </form>
  );
}
