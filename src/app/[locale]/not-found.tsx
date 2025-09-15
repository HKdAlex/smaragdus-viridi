import { Button } from "@/shared/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("errors.notFound");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            {t("title")}
          </h2>
          <p className="text-gray-600 mb-8">{t("description")}</p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">{t("goHome")}</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/catalog">{t("browseCatalog")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
