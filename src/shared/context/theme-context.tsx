"use client";

import { useTheme, type Theme } from "@/shared/hooks/use-theme";
import { createContext, useContext, type ReactNode } from "react";
import { useTranslations } from "next-intl";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeState = useTheme();

  return (
    <ThemeContext.Provider value={themeState}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    const t = useTranslations("errors.theme");
    throw new Error(t("contextError"));
  }
  return context;
}
