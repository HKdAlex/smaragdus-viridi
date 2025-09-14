import "./globals.css";

import { Geist, Geist_Mono } from "next/font/google";

import { AuthProvider } from "@/features/auth/context/auth-context";
import type { Metadata } from "next";
import { ThemeProvider } from "@/shared/context/theme-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crystallique - Premium Gemstones",
  description:
    "Discover and purchase premium gemstones including diamonds, rubies, sapphires, and emeralds. Professional gemstone marketplace with expert certification.",
  keywords:
    "gemstones, diamonds, rubies, sapphires, emeralds, jewelry, precious stones, certified gemstones",
};

// Theme initialization script to prevent flash
// Alternative approaches considered:
// 1. next-themes library (16KB bundle) - has minor flash
// 2. CSS-only approach - can't override system preference
// 3. Server-side detection - complex cookie/middleware setup
// Current approach: Minimal blocking script (1-2ms) for zero-flash UX
const themeScript = `
  (function() {
    try {
      const savedTheme = localStorage.getItem('theme-preference') || 'system';
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const resolvedTheme = savedTheme === 'system' ? systemTheme : savedTheme;
      
      // Remove any existing theme classes
      document.documentElement.classList.remove('dark', 'light');
      
      // Add the appropriate theme class
      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.add('light');
      }
      
      // Set meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff');
      }
    } catch (e) {
      // Fallback to light mode if there's an error
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  })();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
