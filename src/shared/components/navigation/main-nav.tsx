"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/shared/components/ui/logo";
import { SearchInput } from "@/features/search/components/search-input";
import { ThemeToggle } from "@/shared/components/ui/theme-toggle";
import { useAuth } from "@/features/auth/context/auth-context";
import { useCartContext } from "@/features/cart/context/cart-context";
import { useTranslations } from "next-intl";

// Safe admin status hook that doesn't throw if AdminProvider is not available
function useSafeAdminStatus() {
  // @ts-ignore
  const { useAdminStatus } = require("@/features/admin/context/admin-context");

  try {
    return useAdminStatus();
  } catch {
    // AdminProvider not available, return safe defaults
    return { isAdmin: false, isLoading: false };
  }
}

interface NavItem {
  name: string;
  href: string;
  current?: boolean;
}

export function MainNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const { isAdmin } = useSafeAdminStatus();
  const t = useTranslations("navigation");
  const tAccessibility = useTranslations("common.accessibility");

  // Debug logging for navbar auth state (only log when state actually changes)
  const authStateRef = useRef({
    hasUser: false,
    userEmail: undefined as string | undefined,
    isLoading: true,
  });
  const currentAuthState = {
    hasUser: !!user,
    userEmail: user?.email,
    isLoading: loading,
  };

  if (
    authStateRef.current.hasUser !== currentAuthState.hasUser ||
    authStateRef.current.userEmail !== currentAuthState.userEmail ||
    authStateRef.current.isLoading !== currentAuthState.isLoading
  ) {
    console.log("[NAVBAR] Auth state changed:", {
      ...currentAuthState,
      timestamp: new Date().toISOString(),
    });
    authStateRef.current = currentAuthState;
  }

  // Get cart count from context
  const { getItemCount } = useCartContext();

  // Memoize navigation arrays to prevent unnecessary re-renders
  const navigation: NavItem[] = useMemo(() => {
    const baseNavigation = [
      { name: t("home"), href: "/" },
      { name: t("catalog"), href: "/catalog" },
    ];

    // Hide "About" and "Contact" for admin users
    if (!isAdmin) {
      baseNavigation.push(
        { name: t("about"), href: "/about" },
        { name: t("contact"), href: "/contact" }
      );
    }

    return baseNavigation;
  }, [t, isAdmin]);

  // User navigation (shown when logged in, hidden for admin users)
  const userNavigation: NavItem[] = useMemo(() => {
    // Hide all user navigation for admin users
    if (isAdmin) {
      return [];
    }

    const baseUserNavigation = [{ name: t("profile"), href: "/profile" }];
    baseUserNavigation.unshift({ name: t("orders"), href: "/orders" });

    return baseUserNavigation;
  }, [t, isAdmin]);

  // Admin navigation (conditionally shown)
  const adminNavigation: NavItem[] = useMemo(
    () => [{ name: t("admin"), href: "/admin" }],
    [t]
  );

  const isCurrentPage = useMemo(
    () => (href: string) => {
      if (href === "/") {
        return pathname === "/";
      }
      return pathname.startsWith(href);
    },
    [pathname]
  );

  // Memoize sign-out handler to prevent unnecessary re-renders
  const handleSignOut = useMemo(
    () => async () => {
      try {
        await signOut();
        // Redirect to home page after sign out
        router.push("/");
      } catch (error) {
        console.error(t("signOutFailed"), error);
      }
    },
    [signOut, router, t]
  );

  // Memoize mobile sign-out handler
  const handleMobileSignOut = useMemo(
    () => async () => {
      try {
        await signOut();
        setMobileMenuOpen(false);
        // Redirect to home page after sign out
        router.push("/");
      } catch (error) {
        console.error(t("signOutFailed"), error);
      }
    },
    [signOut, router, t, setMobileMenuOpen]
  );

  return (
    <header className="bg-background border-b border-border transition-colors duration-300 sticky top-0 z-[60] backdrop-blur-sm bg-background/95">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Logo variant="block" size="lg" href="/" showText={false} />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href as any}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isCurrentPage(item.href)
                      ? "text-primary border-b-2 border-primary pb-1"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* User Navigation - only show when logged in */}
              {user &&
                userNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href as any}
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
                    href={item.href as any}
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
            {/* Search button/input */}
            <div className="relative">
              {!searchOpen ? (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
              ) : (
                <div
                  className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                  onClick={() => setSearchOpen(false)}
                >
                  <div
                    className="fixed left-1/2 top-1/4 -translate-x-1/2 w-full max-w-2xl px-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative">
                      <SearchInput
                        autoFocus
                        className="w-full shadow-2xl"
                        onSearch={(query) => {
                          setSearchOpen(false);
                          router.push(
                            `/search?q=${encodeURIComponent(query)}` as any
                          );
                        }}
                      />
                      {/* Close button for mobile */}
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 md:hidden p-1 text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => setSearchOpen(false)}
                        aria-label={tAccessibility("close")}
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cart button - hidden for admin users */}
            {user && !isAdmin && (
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

            {/* Theme toggle - hidden on mobile, shown in mobile menu */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {/* Language switcher - hidden on mobile, shown in mobile menu */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Auth buttons */}
            <div className="hidden sm:flex items-center space-x-3">
              {loading ? (
                // Show loading state while auth is initializing
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : user ? (
                // User is signed in - show user menu
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground">
                    {t("welcome", {
                      email: user.email || tAccessibility("user"),
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
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
              className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                  href={item.href as any}
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

              {/* Mobile User Navigation - only show when logged in */}
              {user &&
                userNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href as any}
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
                    href={item.href as any}
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

              {/* Mobile controls section */}
              <div className="px-3 py-2 space-y-3 border-t border-border">
                {/* Theme toggle and language switcher */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("settings")}
                  </span>
                  <div className="flex items-center space-x-2">
                    <ThemeToggle />
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>

              {/* Mobile auth buttons */}
              <div className="px-3 py-2 space-y-2">
                {loading ? (
                  // Show loading state while auth is initializing
                  <div className="flex items-center justify-center space-x-2 py-4">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Loading...
                    </span>
                  </div>
                ) : user ? (
                  // User is signed in - show user info and sign out
                  <>
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {t("welcome", {
                        email: user.email || tAccessibility("user"),
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMobileSignOut}
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
