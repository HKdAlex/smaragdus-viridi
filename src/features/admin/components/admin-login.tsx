"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
// Using basic HTML elements for Label and Alert until shared components are available
import { Logo } from "@/shared/components/ui/logo";
import { useAdmin } from "../context/admin-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn } = useAdmin();
  const router = useRouter();
  const t = useTranslations("admin");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.success) {
        router.push("/admin/dashboard");
      } else {
        setError(result.error || t("login.loginFailed"));
      }
    } catch (err) {
      setError(t("login.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-gradient-to-br from-card via-card to-muted/20">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Logo variant="block" size="xl" showText={false} />
          </div>

          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              {t("login.title")}
            </CardTitle>
            <p className="text-muted-foreground mt-2">{t("login.subtitle")}</p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                {t("login.emailLabel")}
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.emailPlaceholder")}
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                {t("login.passwordLabel")}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.passwordPlaceholder")}
                  required
                  disabled={isLoading}
                  className="h-11 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("login.signingIn")}
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  {t("login.signInButton")}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium text-sm mb-2">
              {t("login.requirements.title")}
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>{t("login.requirements.role")}</li>
              <li>{t("login.requirements.security")}</li>
              <li>{t("login.requirements.session")}</li>
              <li>{t("login.requirements.audit")}</li>
            </ul>
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => router.push("/")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("login.returnToSite")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
