"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// Safe locale hook that falls back gracefully if next-intl is not available
function useSafeLocale() {
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useLocale } = require("next-intl");
      // We can't use hooks directly in useEffect, so we'll get it from the pathname
      const currentPath = window.location.pathname;
      const pathLocale = currentPath.startsWith('/ru') ? 'ru' : 'en';
      setLocale(pathLocale);
    } catch {
      // next-intl not available, keep default
    }
  }, []);

  return locale;
}

import { Button } from "@/shared/components/ui/button";

export function LanguageSwitcher() {
  const locale = useSafeLocale();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    // Use window.location for reliable navigation without type constraints
    const currentPath = window.location.pathname;
    const localeFreePath = currentPath.replace(/^\/(en|ru)/, '');
    const newPath = `/${newLocale}${localeFreePath}`;
    window.location.href = newPath;
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