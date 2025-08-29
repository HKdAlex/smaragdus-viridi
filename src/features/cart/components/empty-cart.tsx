"use client";

import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface EmptyCartProps {
  onClose?: () => void;
}

export function EmptyCart({ onClose }: EmptyCartProps) {
  const t = useTranslations("cart");

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
      {/* Empty Cart Icon */}
      <div className="mb-6">
        <svg
          className="mx-auto h-24 w-24 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13v8a2 2 0 002 2h10a2 2 0 002-2v-3M7 13h10m0 0v8a2 2 0 01-2 2H9a2 2 0 01-2-2v-8z"
          />
        </svg>
      </div>

      {/* Empty Cart Message */}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {t("empty.title")}
      </h3>

      <p className="text-gray-600 mb-8 max-w-sm">{t("empty.subtitle")}</p>

      {/* Action Buttons */}
      <div className="space-y-3 w-full max-w-xs">
        <Button asChild className="w-full" onClick={onClose}>
          <Link href="/catalog">{t("empty.browseGemstones")}</Link>
        </Button>

        <Button variant="outline" asChild className="w-full" onClick={onClose}>
          <Link href="/about">{t("empty.learnAboutGemstones")}</Link>
        </Button>

        {onClose && (
          <Button variant="ghost" onClick={onClose} className="w-full">
            {t("empty.continueShopping")}
          </Button>
        )}
      </div>

      {/* Helpful Tips */}
      <div className="mt-8 text-left w-full max-w-xs">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          {t("empty.shoppingTips")}
        </h4>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>{t("empty.tips.filters")}</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>{t("empty.tips.certificates")}</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>{t("empty.tips.freeShipping")}</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>{t("empty.tips.returns")}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
