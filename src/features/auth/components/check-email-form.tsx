"use client";

import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { Button } from "@/shared/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function CheckEmailForm() {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const router = useRouter();
  const t = useTranslations("auth.checkEmail");

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      // TODO: Implement resend email functionality
      // This would call a server action to resend the confirmation email
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      setResendSuccess(true);
    } catch (error) {
      console.error("Failed to resend email:", error);
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToSignup = () => {
    router.push("/signup");
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle className="text-xl font-semibold">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>{t("instructions")}</p>
          <p className="mt-2 font-medium">{t("checkSpam")}</p>
        </div>

        {resendSuccess && (
          <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
            <p className="text-sm text-green-700 dark:text-green-300">
              {t("resendSuccess")}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {t("resending")}
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                {t("resendButton")}
              </>
            )}
          </Button>

          <Button
            onClick={handleBackToSignup}
            variant="ghost"
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToSignup")}
          </Button>
        </div>

        <div className="text-center text-xs text-gray-500 dark:text-gray-500">
          <p>{t("helpText")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
