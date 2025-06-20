import { Button } from "@/shared/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl transition-colors duration-300">
            Premium Gemstones for
            <span className="text-emerald-600 dark:text-emerald-400">
              {" "}
              Professional Jewelers
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-colors duration-300">
            Discover our curated collection of certified gemstones. From rare
            emeralds to brilliant diamonds, each stone is professionally graded
            with full documentation for serious jewelry artisans.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button
              asChild
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg"
            >
              <Link href="/catalog">Browse Collection</Link>
            </Button>
            <Button
              variant="outline"
              asChild
              size="lg"
              className="px-8 py-3 text-lg border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl transition-colors duration-300">
              Featured Categories
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 transition-colors duration-300">
              Professional-grade gemstones with full certification
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Emeralds */}
            <div className="group relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <div className="absolute bottom-6 left-6 z-20">
                <h3 className="text-xl font-semibold text-white">Emeralds</h3>
                <p className="text-sm text-gray-200">
                  Colombian & Zambian origins
                </p>
              </div>
              <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 group-hover:scale-105 transition-transform duration-300" />
            </div>

            {/* Diamonds */}
            <div className="group relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <div className="absolute bottom-6 left-6 z-20">
                <h3 className="text-xl font-semibold text-white">Diamonds</h3>
                <p className="text-sm text-gray-200">
                  GIA certified, D-J color grades
                </p>
              </div>
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-400 group-hover:scale-105 transition-transform duration-300" />
            </div>

            {/* Sapphires */}
            <div className="group relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <div className="absolute bottom-6 left-6 z-20">
                <h3 className="text-xl font-semibold text-white">Sapphires</h3>
                <p className="text-sm text-gray-200">
                  Kashmir & Ceylon varieties
                </p>
              </div>
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 group-hover:scale-105 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl transition-colors duration-300">
              Why Professionals Choose Us
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center transition-colors duration-300">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                Certified Authenticity
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                Every gemstone comes with professional certification from
                recognized laboratories
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center transition-colors duration-300">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                Premium Quality
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                Hand-selected stones meeting the highest standards for jewelry
                professionals
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center transition-colors duration-300">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                Fast Delivery
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                Secure worldwide shipping with full insurance and tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-emerald-600 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Find Your Perfect Gemstone?
          </h2>
          <p className="mt-4 text-lg text-emerald-100">
            Join thousands of professional jewelers who trust our expertise
          </p>
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="bg-white text-emerald-600 hover:bg-gray-100 px-8 py-3 text-lg"
        >
              <Link href="/login">Get Started Today</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
