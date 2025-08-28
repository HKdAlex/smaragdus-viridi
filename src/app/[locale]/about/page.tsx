import { Button } from "@/shared/components/ui/button";
import { Link as I18nLink } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("common");
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-6">
            {t("about.title")}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            {t("about.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-emerald-600 dark:text-emerald-400 text-4xl mb-4">
              🌟
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t("about.mission.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {t("about.mission.description")}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-emerald-600 dark:text-emerald-400 text-4xl mb-4">
              💎
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t("about.quality.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {t("about.quality.description")}
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <I18nLink href="/catalog">{t("about.exploreCollection")}</I18nLink>
          </Button>
        </div>
      </div>
    </div>
  );
}
