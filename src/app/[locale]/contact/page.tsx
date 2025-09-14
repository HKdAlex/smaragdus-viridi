import { Button } from "@/shared/components/ui/button";
import { Link as I18nLink } from "@/i18n/navigation";
import { Logo } from "@/shared/components/ui/logo";
import { getTranslations } from "next-intl/server";

export default async function ContactPage() {
  const t = await getTranslations("common");
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-24">
        <div className="text-center mb-12 sm:mb-16">
          {/* Logo Element */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <Logo
              variant="block"
              size="xl"
              showText={false}
              className="sm:w-auto w-24"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4 sm:mb-6">
            {t("contact.title")}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto px-2">
            {t("contact.subtitle")}
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid gap-6 sm:gap-8 lg:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg shadow-sm p-6">
              <div className="text-primary text-3xl mb-4">📧</div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t("contact.email.title")}
              </h3>
              <div className="space-y-1 text-muted-foreground">
                <p>info@crystallique.com</p>
                <p>sales@crystallique.com</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-sm p-6">
              <div className="text-primary text-3xl mb-4">📱</div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t("contact.phone.title")}
              </h3>
              <div className="space-y-1 text-muted-foreground">
                <p>+1 (555) 123-4567</p>
                <p className="text-sm">Monday - Friday, 9AM - 6PM EST</p>
              </div>
            </div>
          </div>

          {/* Contact Form Placeholder */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-6">
              {t("contact.form.title")}
            </h3>
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded animate-pulse"></div>
              <div className="h-10 bg-muted rounded animate-pulse"></div>
              <div className="h-32 bg-muted rounded animate-pulse"></div>
              <div className="text-center pt-4">
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                  {t("contact.form.placeholder")}
                </p>
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3 min-h-[48px]"
                >
                  <I18nLink href="/">{t("contact.backToHome")}</I18nLink>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
