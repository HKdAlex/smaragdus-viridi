import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import { AuthProvider } from "@/features/auth/context/auth-context";
import { ChatWidget } from "@/features/chat";
import { routing } from "@/i18n/routing";
import { Footer } from "@/shared/components/layout/footer";
import { MainNav } from "@/shared/components/navigation/main-nav";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <MainNav />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatWidget />
        </div>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
