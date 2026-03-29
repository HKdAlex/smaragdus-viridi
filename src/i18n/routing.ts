import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "ru"],

  // Used when no locale matches
  // Set to "en" for testing consistency (production default is "ru")
  defaultLocale: "en",

  // Optional: Enable locale detection
  localeDetection: false,

  // Define pathnames for internationalized routes
  pathnames: {
    "/": "/",
    "/about": "/about",
    "/contact": "/contact",
    "/cart": "/cart",
    "/catalog": "/catalog",
    "/catalog/[id]": "/catalog/[id]",
    "/catalog/[id]/edit": "/catalog/[id]/edit",
    "/search": "/search",
    "/orders": "/orders",
    "/orders/[id]": "/orders/[id]",
    "/profile": "/profile",
    "/login": "/login",
    "/signup": "/signup",
    "/forgot-password": "/forgot-password",
    "/reset-password": "/reset-password",
    "/verify-code": "/verify-code",
    "/check-email": "/check-email",
    "/admin": "/admin",
    "/admin/dashboard": "/admin/dashboard",
    "/admin/login": "/admin/login",
    // Add any other dynamic routes your app uses
    "/gemstones/[id]": "/gemstones/[id]",
    "/products/[id]": "/products/[id]",
    // Marketing / footer (pages may be placeholders; paths must be locale-prefixed)
    "/careers": "/careers",
    "/press": "/press",
    "/certification": "/certification",
    "/custom": "/custom",
    "/bulk": "/bulk",
    "/help": "/help",
    "/shipping": "/shipping",
    "/returns": "/returns",
    "/size-guide": "/size-guide",
    "/privacy": "/privacy",
    "/terms": "/terms",
    "/cookies": "/cookies",
  },
});
