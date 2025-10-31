"use client";

import { useLocale, useTranslations } from "next-intl";

import { useAuth } from "@/features/auth/context/auth-context";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useState } from "react";

export function VerifyCodeForm() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const t = useTranslations("auth");
  const locale = useLocale();
  const { verifyOtp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!code || code.length !== 6) {
      setError(t("verifyCode.invalidCode"));
      setIsLoading(false);
      return;
    }

    try {
      await verifyOtp(code, email);
      router.push("/profile" as any);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("verifyCode.verifyError")
      );
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label
          htmlFor="email"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t("verifyCode.emailLabel")}
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="mt-1"
          required
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t("verifyCode.emailHint")}
        </p>
      </div>

      <div>
        <Label
          htmlFor="code"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t("verifyCode.codeLabel")}
        </Label>
        <Input
          id="code"
          type="text"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="123456"
          className="mt-1 text-center text-lg tracking-widest"
          maxLength={6}
          required
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t("verifyCode.codeHint")}
        </p>
      </div>

      {error && (
        <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-md text-center">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || code.length !== 6}
        className="w-full min-h-[48px] bg-primary hover:bg-primary/90 text-primary-foreground text-base font-medium"
      >
        {isLoading ? t("verifyCode.verifying") : t("verifyCode.verifyButton")}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => router.push("/signup" as any)}
        className="w-full min-h-[48px]"
      >
        {t("verifyCode.backToSignup")}
      </Button>

      <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
        {t("verifyCode.helpText")}
      </p>
    </form>
  );
}
