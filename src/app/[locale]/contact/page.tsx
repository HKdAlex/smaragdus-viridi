import { ContactFAQ, ContactForm, ContactMethods, ContactSupportOverview } from "@/features/contact";

import { Logo } from "@/shared/components/ui/logo";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-24">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex justify-center mb-6 sm:mb-8">
            <Logo
              variant="block"
              size="xxxl"
              showText={false}
              className="sm:w-auto w-24"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4 sm:mb-6">
            {t("title")}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-3xl mx-auto px-2">
            {t("subtitle")}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Contact Form and Info Section */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ContactForm />
            </div>

            <div className="lg:col-span-1">
              <ContactMethods />
            </div>
          </div>

          <ContactSupportOverview />

          {/* FAQ Section */}
          <ContactFAQ />
        </div>
      </div>
    </div>
  );
}
