"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Use the new server-side login API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Login failed");
      }

      // Successful login - redirect
      const redirectTo = searchParams.get("redirectTo") || "/";

      // Force a page reload to ensure middleware picks up the new session
      window.location.href = redirectTo;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("errors.invalidCredentials")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          {t("login.email")}
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
