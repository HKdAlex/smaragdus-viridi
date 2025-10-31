import { Button } from "@/shared/components/ui/button";
import { Link as I18nLink } from "@/i18n/navigation";
import { Logo } from "@/shared/components/ui/logo";
import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("common");
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-24">
        <div className="text-center mb-12 sm:mb-16">
          {/* Logo Element */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <Logo
              variant="block"
              size="xxxxl"
              showText={false}
              className="sm:w-auto w-24"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4 sm:mb-6">
            {t("about.title")}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-3xl mx-auto px-2">
            {t("about.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 max-w-6xl mx-auto lg:grid-cols-2">
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 sm:p-8">
            <div className="text-primary text-3xl sm:text-4xl mb-4">🌟</div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
              {t("about.mission.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("about.mission.description")}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm p-6 sm:p-8">
            <div className="text-primary text-3xl sm:text-4xl mb-4">💎</div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
              {t("about.quality.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("about.quality.description")}
            </p>
          </div>
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3 min-h-[48px]"
          >
            <I18nLink href="/catalog">{t("about.exploreCollection")}</I18nLink>
          </Button>
        </div>
      </div>
    </div>
  );
}
