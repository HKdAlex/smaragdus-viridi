import "./globals.css";

import { Geist, Geist_Mono } from "next/font/google";

import { AuthProvider } from "@/features/auth/context/auth-context";
import { Footer } from "@/shared/components/layout/footer";
import { MainNav } from "@/shared/components/navigation/main-nav";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/shared/context/theme-context";
import { getMessages } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smaragdus Viridi - Premium Gemstone Marketplace",
  description:
    "Professional gemstone trading platform for jewelry industry professionals",
  keywords:
    "gemstones, diamonds, emeralds, rubies, sapphires, jewelry, wholesale",
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
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <AuthProvider>
              <div className="flex flex-col min-h-screen">
                <MainNav />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
