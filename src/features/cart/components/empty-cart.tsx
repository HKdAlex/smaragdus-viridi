"use client";

import { Button } from "@/shared/components/ui/button";
import Link from "next/link";

interface EmptyCartProps {
  onClose?: () => void;
}

export function EmptyCart({ onClose }: EmptyCartProps) {
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
        Your cart is empty
      </h3>

      <p className="text-gray-600 mb-8 max-w-sm">
        Add some beautiful gemstones to your cart and start building your
        collection.
      </p>

      {/* Action Buttons */}
      <div className="space-y-3 w-full max-w-xs">
        <Button asChild className="w-full" onClick={onClose}>
          <Link href="/catalog">Browse Gemstones</Link>
        </Button>

        <Button variant="outline" asChild className="w-full" onClick={onClose}>
          <Link href="/about">Learn About Gemstones</Link>
        </Button>

        {onClose && (
          <Button variant="ghost" onClick={onClose} className="w-full">
            Continue Shopping
          </Button>
        )}
      </div>

      {/* Helpful Tips */}
      <div className="mt-8 text-left w-full max-w-xs">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Shopping Tips
        </h4>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>
              Use filters to find specific gemstone types and price ranges
            </span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>All gemstones come with certificates of authenticity</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>Free shipping on orders over $500</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>30-day return policy on all purchases</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
