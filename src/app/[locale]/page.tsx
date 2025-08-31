import { Button } from "@/shared/components/ui/button";
import { Logo } from "@/shared/components/ui/logo";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

export default async function HomePage() {
  const t = await getTranslations("home");
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl text-center">
          {/* Subtle Logo Element */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <Logo
              variant="block"
              size="xxxl"
              showText={false}
              className="sm:w-auto w-32"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-foreground mb-4 sm:mb-6 transition-colors duration-300 leading-tight">
            <span className="block sm:inline">{t("hero.title")}</span>
            <span className="text-primary block sm:inline sm:ml-2">
              {t("hero.titleHighlight")}
            </span>
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground max-w-3xl mx-auto transition-colors duration-300 px-2">
            {t("hero.subtitle")}
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 px-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3 text-base sm:text-lg min-h-[48px]"
            >
              <Link href="/catalog">{t("hero.browseCollection")}</Link>
            </Button>
            <Button
              variant="outline"
              asChild
              size="lg"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 text-base sm:text-lg border-border text-foreground hover:bg-accent hover:text-accent-foreground min-h-[48px]"
            >
              <Link href="/about">{t("hero.learnMore")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="pb-12 sm:pb-16 bg-card transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-4 transition-colors duration-300">
              {t("featured.title")}
            </h2>
            <p className="mt-2 sm:mt-4 text-base sm:text-lg text-muted-foreground transition-colors duration-300 px-2">
              {t("featured.subtitle")}
            </p>
          </div>

          <div className="mx-auto mt-8 sm:mt-12 lg:mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 px-2">
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
      <section className="py-12 sm:py-16 bg-muted/50 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-8 sm:mb-12 transition-colors duration-300">
              {t("valueProps.title")}
            </h2>
          </div>

          <div className="mx-auto mt-8 sm:mt-12 lg:mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 px-2">
            <div className="text-center bg-card p-6 rounded-lg border border-border shadow-sm">
              <div className="mx-auto h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t("valueProps.authenticity.title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("valueProps.authenticity.description")}
              </p>
            </div>

            <div className="text-center bg-card p-6 rounded-lg border border-border shadow-sm">
              <div className="mx-auto h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t("valueProps.quality.title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("valueProps.quality.description")}
              </p>
            </div>

            <div className="text-center bg-card p-6 rounded-lg border border-border shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="mx-auto h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t("valueProps.delivery.title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("valueProps.delivery.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary-foreground mb-4">
            {t("cta.title")}
          </h2>
          <p className="mt-2 sm:mt-4 text-base sm:text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto px-2">
            {t("cta.subtitle")}
          </p>
          <div className="mt-6 sm:mt-8">
            <Button
              asChild
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-6 sm:px-8 py-3 text-base sm:text-lg min-h-[48px] font-semibold shadow-lg"
            >
              <Link href="/login">{t("cta.getStarted")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
