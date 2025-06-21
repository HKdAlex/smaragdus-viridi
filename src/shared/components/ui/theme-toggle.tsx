"use client";

import { Button } from "./button";
import { useThemeContext } from "@/shared/context/theme-context";

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useThemeContext();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="relative w-9 h-9 p-0 bg-background border border-border 
                 hover:bg-accent text-foreground transition-all duration-300"
      aria-label={`Switch to ${
        resolvedTheme === "light" ? "dark" : "light"
      } mode`}
    >
      {/* Sun Icon (Light Mode) */}
      <svg
        className={`absolute inset-0 m-auto h-4 w-4 transition-all duration-300 ${
          resolvedTheme === "light"
            ? "rotate-0 scale-100 opacity-100 text-amber-500"
            : "rotate-90 scale-0 opacity-0"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
        />
      </svg>

      {/* Moon Icon (Dark Mode) */}
      <svg
        className={`absolute inset-0 m-auto h-4 w-4 transition-all duration-300 ${
          resolvedTheme === "dark"
            ? "rotate-0 scale-100 opacity-100 text-blue-400"
            : "-rotate-90 scale-0 opacity-0"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
        />
      </svg>
    </Button>
  );
}

export function ThemeSelector() {
  const { theme, setTheme } = useThemeContext();

  return (
    <div className="flex items-center space-x-1 p-1 bg-muted border border-border rounded-lg">
      {(["light", "dark", "system"] as const).map((themeOption) => (
        <button
          key={themeOption}
          onClick={() => setTheme(themeOption)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 capitalize ${
            theme === themeOption
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          {themeOption}
        </button>
      ))}
    </div>
  );
}
