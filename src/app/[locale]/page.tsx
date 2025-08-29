import { Button } from "@/shared/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("home");
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl transition-colors duration-300">
            {t("hero.title")}
            <span className="text-emerald-600 dark:text-emerald-400">
              {" "}
              {t("hero.titleHighlight")}
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-colors duration-300">
            {t("hero.subtitle")}
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button
              asChild
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg"
            >
              <Link href="/catalog">{t("hero.browseCollection")}</Link>
            </Button>
            <Button
              variant="outline"
              asChild
              size="lg"
              className="px-8 py-3 text-lg border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <Link href="/about">{t("hero.learnMore")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="pb-16 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl transition-colors duration-300">
              {t("featured.title")}
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 transition-colors duration-300">
              {t("featured.subtitle")}
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Emeralds */}
            <div className="group relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
              <Image
                src="https://ik.imagekit.io/gemsonline/wp-content/uploads/2025/01/Emrald_gemstone-1.jpg"
                alt={t("featured.emeralds.alt")}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <div className="absolute bottom-6 left-6 z-20">
                <h3 className="text-xl font-semibold text-white">
                  {t("featured.emeralds.title")}
                </h3>
                <p className="text-sm text-gray-200">
                  {t("featured.emeralds.subtitle")}
                </p>
              </div>
            </div>

            {/* Diamonds */}
            <div className="group relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
              <Image
                src="https://labgrowndiamondscalgary.com/sitefiles/wp-content/uploads/2024/02/lab-grown-diamonds.png"
                alt={t("featured.diamonds.alt")}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <div className="absolute bottom-6 left-6 z-20">
                <h3 className="text-xl font-semibold text-white">
                  {t("featured.diamonds.title")}
                </h3>
                <p className="text-sm text-gray-200">
                  {t("featured.diamonds.subtitle")}
                </p>
              </div>
            </div>

            {/* Sapphires */}
            <div className="group relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
              <Image
                src="https://images.unsplash.com/photo-1735480165389-cb621e7d6756?w=800&auto=format&fit=crop&q=80"
                alt={t("featured.sapphires.alt")}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <div className="absolute bottom-6 left-6 z-20">
                <h3 className="text-xl font-semibold text-white">
                  {t("featured.sapphires.title")}
                </h3>
                <p className="text-sm text-gray-200">
                  {t("featured.sapphires.subtitle")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl transition-colors duration-300">
              {t("valueProps.title")}
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center transition-colors duration-300">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                {t("valueProps.authenticity.title")}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                {t("valueProps.authenticity.description")}
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center transition-colors duration-300">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                {t("valueProps.quality.title")}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                {t("valueProps.quality.description")}
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center transition-colors duration-300">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                {t("valueProps.delivery.title")}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                {t("valueProps.delivery.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-emerald-600 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t("cta.title")}
          </h2>
          <p className="mt-4 text-lg text-emerald-100">{t("cta.subtitle")}</p>
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="bg-white text-emerald-600 hover:bg-gray-100 px-8 py-3 text-lg"
            >
              <Link href="/login">{t("cta.getStarted")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
