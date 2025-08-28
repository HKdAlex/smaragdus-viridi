import { Button } from "@/shared/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-6">
            About Smaragdus Viridi
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Your trusted partner in premium gemstone trading for professional
            jewelers worldwide.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-emerald-600 dark:text-emerald-400 text-4xl mb-4">
              🌟
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              To provide jewelry professionals with access to the world's finest
              certified gemstones, backed by transparent grading and exceptional
              service.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-emerald-600 dark:text-emerald-400 text-4xl mb-4">
              💎
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Quality Guarantee
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Every gemstone in our collection is professionally graded with
              full certification and documentation for your peace of mind.
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/catalog">Explore Our Collection</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
