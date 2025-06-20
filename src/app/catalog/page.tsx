import { Button } from "@/shared/components/ui/button";
import Link from "next/link";

export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-6">
            Gemstone Catalog
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Our comprehensive gemstone catalog is coming soon. Browse our
            curated collection of certified gemstones.
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <div className="text-emerald-600 dark:text-emerald-400 text-6xl mb-4">
              💎
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Coming in Sprint 3
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Advanced filtering, search, and gemstone details
            </p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
