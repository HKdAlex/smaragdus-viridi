import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "ru"],

  // Used when no locale matches
  defaultLocale: "en",

  // Optional: Enable locale detection
  localeDetection: false,

  // Define pathnames for internationalized routes
  pathnames: {
    '/': '/',
    '/about': '/about',
    '/contact': '/contact',
    '/cart': '/cart',
    '/catalog': '/catalog',
    '/catalog/[id]': '/catalog/[id]',
    '/login': '/login',
    '/signup': '/signup'
  }
});
