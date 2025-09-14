import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "ru"],

  // Used when no locale matches
  defaultLocale: "ru",

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
    '/orders/[id]': '/orders/[id]',
    '/login': '/login',
    '/signup': '/signup',
    '/admin': '/admin',
    '/admin/dashboard': '/admin/dashboard',
    '/admin/login': '/admin/login',
    // Add any other dynamic routes your app uses
    '/gemstones/[id]': '/gemstones/[id]',
    '/products/[id]': '/products/[id]'
  }
});
