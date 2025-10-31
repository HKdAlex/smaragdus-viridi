"use client";

import { useLocale, useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useState } from "react";
import { useAuth } from "../context/auth-context";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const t = useTranslations("auth");
  const locale = useLocale();

  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError(t("errors.weakPassword"));
      setIsLoading(false);
      return;
    }

    try {
      await signUp(email, password, name, locale);
      // Redirect to check-email page after successful signup
      router.push("/check-email" as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("signup.signUpError"));
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md px-4">
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-foreground"
        >
          {t("signup.name")}
        </label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
          placeholder={t("signup.namePlaceholder")}
          autoComplete="name"
          className="min-h-[48px] text-base"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          {t("signup.email")}
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          placeholder={t("signup.emailPlaceholder")}
          autoComplete="email"
          className="min-h-[48px] text-base"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground"
        >
          {t("signup.password")}
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          placeholder={t("signup.passwordPlaceholder")}
          autoComplete="new-password"
          className="min-h-[48px] text-base"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-foreground"
        >
          {t("signup.confirmPassword")}
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading}
          placeholder={t("signup.confirmPasswordPlaceholder")}
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
        {isLoading ? t("signup.creatingAccount") : t("signup.signUp")}
      </Button>
    </form>
  );
}
