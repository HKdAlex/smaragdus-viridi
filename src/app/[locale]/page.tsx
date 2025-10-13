import { Button } from "@/shared/components/ui/button";
import { Logo } from "@/shared/components/ui/logo";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-sapphire-50 dark:from-slate-950 dark:via-emerald-950 dark:to-sapphire-950 transition-colors duration-500">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32">
        {/* Gemstone-Inspired Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/40 via-amber-100/20 to-sapphire-100/30 dark:from-emerald-900/20 dark:via-amber-900/10 dark:to-sapphire-900/15" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.15),transparent_60%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.12),transparent_60%)] dark:bg-[radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.08),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.04),transparent_70%)]" />

        {/* Floating Gemstone Particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-1/4 left-1/4 w-3 h-3 bg-emerald-400/30 rounded-full animate-pulse"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="absolute top-1/3 right-1/3 w-2 h-2 bg-sapphire-400/40 rounded-full animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-1/3 left-1/3 w-2.5 h-2.5 bg-amber-400/25 rounded-full animate-pulse"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-emerald-300/35 rounded-full animate-pulse"
            style={{ animationDelay: "0.5s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-1 h-1 bg-sapphire-300/30 rounded-full animate-pulse"
            style={{ animationDelay: "1.5s" }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            {/* Luxurious Gemstone-Inspired Logo */}
            <div className="flex justify-center mb-8 sm:mb-12">
              <div className="relative group">
                <div className="absolute -inset-8 bg-gradient-to-r from-emerald-400/20 via-amber-400/20 to-sapphire-400/20 rounded-full blur-3xl group-hover:blur-[40px] transition-all duration-1000" />
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-200/30 to-sapphire-200/30 rounded-full blur-xl" />
                <div className="relative bg-gradient-to-br from-emerald-50/95 via-amber-50/95 to-sapphire-50/95 dark:from-emerald-900/90 dark:via-amber-900/90 dark:to-sapphire-900/90 backdrop-blur-sm rounded-full p-10 shadow-2xl border border-emerald-200/40 dark:border-emerald-700/40">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-sapphire-100/20 rounded-full" />
                  <Logo
                    variant="block"
                    size="xxxl"
                    showText={false}
                    className="w-24 sm:w-32 lg:w-40 relative z-10"
                    enhancedContrast={false}
                  />
                </div>
              </div>
            </div>

            {/* Gemstone-Inspired Typography */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6 sm:mb-8 leading-[0.9]">
              <span className="block text-emerald-900 dark:text-emerald-100 transition-colors duration-500 font-serif">
                {t("hero.title")}
              </span>
              <span className="block bg-gradient-to-r from-emerald-600 via-amber-600 to-sapphire-600 bg-clip-text text-transparent animate-gradient-x font-serif">
                {t("hero.titleHighlight")}
              </span>
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl leading-relaxed text-emerald-800 dark:text-emerald-200 max-w-4xl mx-auto mb-12 sm:mb-16 font-light">
              {t("hero.subtitle")}
            </p>

            {/* Luxurious Gemstone-Inspired CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
              <Button
                asChild
                size="lg"
                className="group relative w-full sm:w-auto bg-gradient-to-r from-emerald-600 via-amber-600 to-sapphire-600 hover:from-emerald-700 hover:via-amber-700 hover:to-sapphire-700 text-white px-8 sm:px-12 py-4 sm:py-5 text-lg sm:text-xl font-semibold rounded-full shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 min-h-[56px] border border-emerald-500/20"
              >
                <Link href="/catalog" className="flex items-center gap-3">
                  <span>{t("hero.browseCollection")}</span>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              </Button>

              <Button
                variant="outline"
                asChild
                size="lg"
                className="group w-full sm:w-auto border-2 border-emerald-300 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-400 dark:hover:border-emerald-500 px-8 sm:px-12 py-4 sm:py-5 text-lg sm:text-xl font-semibold rounded-full transition-all duration-300 transform hover:scale-105 min-h-[56px] backdrop-blur-sm bg-emerald-50/50 dark:bg-emerald-900/20"
              >
                <Link href="/about" className="flex items-center gap-3">
                  <span>{t("hero.learnMore")}</span>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="relative py-20 sm:py-24 lg:py-32 bg-gradient-to-b from-white via-emerald-50/30 to-white dark:from-slate-900 dark:via-emerald-900/20 dark:to-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100 mb-6 font-serif">
              {t("featured.title")}
            </h2>
            <p className="text-lg sm:text-xl text-emerald-700 dark:text-emerald-300 leading-relaxed font-light">
              {t("featured.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Emeralds */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 aspect-square shadow-2xl hover:shadow-emerald-500/20 transition-all duration-700 transform hover:-translate-y-3 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
              <Image
                src="https://ik.imagekit.io/gemsonline/wp-content/uploads/2025/01/Emrald_gemstone-1.jpg"
                alt={t("featured.emeralds.alt")}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-900/20 to-transparent" />

              {/* Gemstone-Inspired Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="space-y-4">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-serif">
                    {t("featured.emeralds.title")}
                  </h3>
                  <p className="text-emerald-100 text-sm sm:text-base font-medium">
                    {t("featured.emeralds.subtitle")}
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                    <span className="text-emerald-200 text-sm font-medium">
                      Premium Colombian Quality
                    </span>
                  </div>
                </div>
              </div>

              {/* Gemstone Sparkle Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-ping" />
            </div>

            {/* Diamonds */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-blue-100 dark:from-slate-900/30 dark:to-blue-900/30 aspect-square shadow-2xl hover:shadow-blue-500/20 transition-all duration-700 transform hover:-translate-y-3 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
              <Image
                src="https://labgrowndiamondscalgary.com/sitefiles/wp-content/uploads/2024/02/lab-grown-diamonds.png"
                alt={t("featured.diamonds.alt")}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

              {/* Gemstone-Inspired Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="space-y-4">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-serif">
                    {t("featured.diamonds.title")}
                  </h3>
                  <p className="text-blue-100 text-sm sm:text-base font-medium">
                    {t("featured.diamonds.subtitle")}
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50" />
                    <span className="text-blue-200 text-sm font-medium">
                      GIA Certified Excellence
                    </span>
                  </div>
                </div>
              </div>

              {/* Gemstone Sparkle Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-4 right-4 w-2 h-2 bg-blue-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-ping" />
            </div>

            {/* Sapphires */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-sapphire-50 to-indigo-100 dark:from-sapphire-900/30 dark:to-indigo-900/30 aspect-square shadow-2xl hover:shadow-sapphire-500/20 transition-all duration-700 transform hover:-translate-y-3 hover:scale-105 md:col-span-2 lg:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-br from-sapphire-500/10 to-transparent" />
              <Image
                src="https://images.unsplash.com/photo-1735480165389-cb621e7d6756?w=800&auto=format&fit=crop&q=80"
                alt={t("featured.sapphires.alt")}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sapphire-900/90 via-sapphire-900/20 to-transparent" />

              {/* Gemstone-Inspired Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="space-y-4">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-serif">
                    {t("featured.sapphires.title")}
                  </h3>
                  <p className="text-sapphire-100 text-sm sm:text-base font-medium">
                    {t("featured.sapphires.subtitle")}
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-3 h-3 bg-sapphire-400 rounded-full animate-pulse shadow-lg shadow-sapphire-400/50" />
                    <span className="text-sapphire-200 text-sm font-medium">
                      Rare Kashmir Origins
                    </span>
                  </div>
                </div>
              </div>

              {/* Gemstone Sparkle Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-sapphire-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-4 right-4 w-2 h-2 bg-sapphire-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-ping" />
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="relative py-20 sm:py-24 lg:py-32 bg-gradient-to-b from-emerald-50/50 via-amber-50/30 to-sapphire-50/50 dark:from-slate-800 dark:via-emerald-900/20 dark:to-slate-800">
        {/* Gemstone-Inspired Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,0.02),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.02),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100 mb-6 font-serif">
              {t("valueProps.title")}
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-emerald-600 via-amber-600 to-sapphire-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Authenticity */}
            <div className="group relative bg-gradient-to-br from-emerald-50/90 to-emerald-100/90 dark:from-emerald-900/80 dark:to-emerald-800/80 backdrop-blur-sm rounded-3xl p-8 lg:p-10 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 transform hover:-translate-y-2 border border-emerald-200/30 dark:border-emerald-700/30">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-transparent dark:from-emerald-800/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl mb-6 shadow-xl shadow-emerald-500/25">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                <h3 className="text-xl lg:text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-4 font-serif">
                  {t("valueProps.authenticity.title")}
                </h3>
                <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed text-base lg:text-lg">
                  {t("valueProps.authenticity.description")}
                </p>

                <div className="mt-6 flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse" />
                  <span>Professional Certification</span>
                </div>
              </div>
            </div>

            {/* Quality */}
            <div className="group relative bg-gradient-to-br from-amber-50/90 to-amber-100/90 dark:from-amber-900/80 dark:to-amber-800/80 backdrop-blur-sm rounded-3xl p-8 lg:p-10 shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 transform hover:-translate-y-2 border border-amber-200/30 dark:border-amber-700/30">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-transparent dark:from-amber-800/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl mb-6 shadow-xl shadow-amber-500/25">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </div>

                <h3 className="text-xl lg:text-2xl font-bold text-amber-900 dark:text-amber-100 mb-4 font-serif">
                  {t("valueProps.quality.title")}
                </h3>
                <p className="text-amber-700 dark:text-amber-300 leading-relaxed text-base lg:text-lg">
                  {t("valueProps.quality.description")}
                </p>

                <div className="mt-6 flex items-center text-amber-600 dark:text-amber-400 text-sm font-medium">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-3 animate-pulse" />
                  <span>Hand-Selected Excellence</span>
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="group relative bg-gradient-to-br from-sapphire-50/90 to-sapphire-100/90 dark:from-sapphire-900/80 dark:to-sapphire-800/80 backdrop-blur-sm rounded-3xl p-8 lg:p-10 shadow-2xl hover:shadow-sapphire-500/20 transition-all duration-500 transform hover:-translate-y-2 border border-sapphire-200/30 dark:border-sapphire-700/30 md:col-span-2 lg:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-br from-sapphire-100/50 to-transparent dark:from-sapphire-800/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sapphire-500 to-sapphire-600 rounded-3xl mb-6 shadow-xl shadow-sapphire-500/25">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>

                <h3 className="text-xl lg:text-2xl font-bold text-sapphire-900 dark:text-sapphire-100 mb-4 font-serif">
                  {t("valueProps.delivery.title")}
                </h3>
                <p className="text-sapphire-700 dark:text-sapphire-300 leading-relaxed text-base lg:text-lg">
                  {t("valueProps.delivery.description")}
                </p>

                <div className="mt-6 flex items-center text-sapphire-600 dark:text-sapphire-400 text-sm font-medium">
                  <div className="w-2 h-2 bg-sapphire-500 rounded-full mr-3 animate-pulse" />
                  <span>Worldwide Shipping</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-emerald-900 via-slate-900 to-sapphire-900 dark:from-slate-950 dark:via-emerald-950 dark:to-slate-950 overflow-hidden">
        {/* Gemstone-Inspired Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Gemstone Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIi8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight font-serif">
              {t("cta.title")}
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-emerald-200 mb-12 sm:mb-16 leading-relaxed font-light max-w-3xl mx-auto">
              {t("cta.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
              <Button
                asChild
                size="lg"
                className="group relative w-full sm:w-auto bg-gradient-to-r from-emerald-500 via-amber-500 to-sapphire-500 hover:from-emerald-600 hover:via-amber-600 hover:to-sapphire-600 text-white px-10 sm:px-12 py-5 sm:py-6 text-lg sm:text-xl font-bold rounded-full shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 min-h-[64px] border border-emerald-400/20"
              >
                <Link href="/login" className="flex items-center gap-3">
                  <span>{t("cta.getStarted")}</span>
                  <svg
                    className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              </Button>

              <Button
                variant="outline"
                asChild
                size="lg"
                className="group w-full sm:w-auto border-2 border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/10 hover:border-emerald-400/50 px-10 sm:px-12 py-5 sm:py-6 text-lg sm:text-xl font-semibold rounded-full transition-all duration-300 transform hover:scale-105 min-h-[64px] backdrop-blur-sm"
              >
                <Link href="/catalog" className="flex items-center gap-3">
                  <span>Browse Collection</span>
                  <svg
                    className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 sm:mt-20 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 text-emerald-300">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                <span className="text-sm font-medium">
                  1000+ Professional Clients
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50" />
                <span className="text-sm font-medium">
                  GIA Certified Stones
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-sapphire-400 rounded-full animate-pulse shadow-lg shadow-sapphire-400/50" />
                <span className="text-sm font-medium">Worldwide Shipping</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
