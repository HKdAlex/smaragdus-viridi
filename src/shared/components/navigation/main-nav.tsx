"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/shared/components/ui/theme-toggle";
import { useAuth } from "@/features/auth/context/auth-context";
import { useCart } from "@/features/cart/hooks/use-cart";



// Safe admin status hook that doesn't throw if AdminProvider is not available
function useSafeAdminStatus() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      useAdminStatus,
    } = require("@/features/admin/context/admin-context");
    return useAdminStatus();
  } catch {
    // AdminProvider not available, return safe defaults
    return { isAdmin: false, isLoading: false };
  }
}

interface NavItem {
  name: string;
  href:
    | "/"
    | "/about"
    | "/contact"
    | "/cart"
    | "/catalog"
    | "/login"
    | "/signup"
    | "/admin"
    | "/admin/dashboard"
    | "/admin/login";
  current?: boolean;
}

export function MainNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { isAdmin } = useSafeAdminStatus();
  const t = useTranslations("navigation");
  const tAccessibility = useTranslations("common.accessibility");

  // Memoize userId to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);
  const { getItemCount } = useCart(userId);

  // Create navigation arrays with translations
  const navigation: NavItem[] = [
    { name: t("home"), href: "/" },
    { name: t("catalog"), href: "/catalog" },
    { name: t("about"), href: "/about" },
    { name: t("contact"), href: "/contact" },
  ];

  // Admin navigation (conditionally shown)
  const adminNavigation: NavItem[] = [{ name: t("admin"), href: "/admin" }];

  const isCurrentPage = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-background border-b border-border transition-colors duration-300 sticky top-0 z-50 backdrop-blur-sm bg-background/95">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  S
                </span>
              </div>
              <span className="font-bold text-xl text-foreground transition-colors duration-300">
                Smaragdus Viridi
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isCurrentPage(item.href)
                      ? "text-primary border-b-2 border-primary pb-1"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Admin Navigation - only show for admin users */}
              {isAdmin &&
                adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isCurrentPage(item.href)
                        ? "text-primary border-b-2 border-primary pb-1"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Search button */}
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={tAccessibility("search")}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </button>

            {/* Cart button */}
            {user && (
              <Link
                href="/cart"
                className="p-2 text-muted-foreground hover:text-primary transition-colors relative"
                aria-label={tAccessibility("shoppingCart")}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.119-1.243l1.263-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
                {/* Cart badge - dynamic count */}
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center px-1">
                    {getItemCount() > 99 ? "99+" : getItemCount()}
                  </span>
                )}
              </Link>
            )}

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Language switcher */}
            <LanguageSwitcher />

            {/* Auth buttons */}
            <div className="hidden sm:flex items-center space-x-3">
              {user ? (
                // User is signed in - show user menu
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground">
                    {t("welcome", { email: user.email || tAccessibility("user") })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await signOut();
                      } catch (error) {
                        console.error("Sign out failed:", error);
                      }
                    }}
                    className="border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {t("signOut")}
                  </Button>
                </div>
              ) : (
                // User is not signed in - show auth buttons
                <>
                  <Button
                    variant="outline"
                    asChild
                    size="sm"
                    className="border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Link href="/login">{t("signIn")}</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Link href="/signup">{t("signUp")}</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={tAccessibility("toggleMenu")}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 text-base font-medium transition-colors ${
                    isCurrentPage(item.href)
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Admin Navigation - only show for admin users */}
              {isAdmin &&
                adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-3 py-2 text-base font-medium transition-colors ${
                      isCurrentPage(item.href)
                        ? "text-primary bg-accent"
                        : "text-muted-foreground hover:text-primary hover:bg-accent"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

              {/* Mobile auth buttons */}
              <div className="px-3 py-2 space-y-2">
                {user ? (
                  // User is signed in - show user info and sign out
                  <>
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {t("welcome", { email: user.email || tAccessibility("user") })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await signOut();
                          setMobileMenuOpen(false);
                        } catch (error) {
                          console.error("Sign out failed:", error);
                        }
                      }}
                      className="w-full border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      {t("signOut")}
                    </Button>
                  </>
                ) : (
                  // User is not signed in - show auth buttons
                  <>
                    <Button
                      variant="outline"
                      asChild
                      size="sm"
                      className="w-full border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <Link href="/login">{t("signIn")}</Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Link href="/signup">{t("signUp")}</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
