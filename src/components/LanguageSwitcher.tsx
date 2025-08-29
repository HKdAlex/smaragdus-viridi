"use client";

import { usePathname, useRouter } from "@/i18n/navigation";

import { Button } from "@/shared/components/ui/button";
import { useLocale } from "next-intl";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: string) => {
    // Handle dynamic routes properly
    // For dynamic routes, we need to use the current URL and extract the path
    const currentUrl = window.location.pathname;
    const localeFreePath = currentUrl.replace(/^\/(en|ru)/, "");

    // Map the path to a valid pathname for next-intl
    if (localeFreePath.startsWith("/catalog/")) {
      // For catalog pages, use the static pathname
      router.replace("/catalog", { locale: newLocale });
    } else {
      // For static routes, validate the pathname first
      const validPathnames = [
        "/",
        "/about",
        "/contact",
        "/cart",
        "/catalog",
        "/login",
        "/signup",
        "/admin",
        "/admin/dashboard",
        "/admin/login",
      ];
      const cleanPathname = pathname as any;

      if (validPathnames.includes(cleanPathname)) {
        router.replace(cleanPathname, { locale: newLocale });
      } else {
        // Fallback to home page
        router.replace("/", { locale: newLocale });
      }
    }
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant={locale === "en" ? "default" : "outline"}
        size="sm"
        onClick={() => switchLocale("en")}
        className="text-xs"
      >
        EN
      </Button>
      <Button
        variant={locale === "ru" ? "default" : "outline"}
        size="sm"
        onClick={() => switchLocale("ru")}
        className="text-xs"
      >
        RU
      </Button>
    </div>
  );
}
