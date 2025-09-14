import Link from "next/link";
import { Suspense } from "react";

interface UnauthorizedPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reason?: string }>;
}

/**
 * Unauthorized Access Page
 *
 * Displayed when users attempt to access resources they don't have permission for.
 * Provides clear messaging and appropriate actions based on the reason for denial.
 */
export default async function UnauthorizedPage({
  params,
  searchParams,
}: UnauthorizedPageProps) {
  const { locale } = await params;
  const { reason } = await searchParams;

  const getMessageAndActions = (reason?: string) => {
    switch (reason) {
      case "insufficient_permissions":
        return {
          title: "Access Denied",
          message:
            "You don't have permission to access this area. Admin privileges are required.",
          actions: [
            { href: `/${locale}/`, label: "Go to Home", primary: true },
            {
              href: `/${locale}/profile`,
              label: "View Profile",
              primary: false,
            },
          ],
        };

      case "invalid_role":
        return {
          title: "Account Role Issue",
          message:
            "There's an issue with your account role. Please contact support for assistance.",
          actions: [
            {
              href: `/${locale}/contact`,
              label: "Contact Support",
              primary: true,
            },
            { href: `/${locale}/`, label: "Go to Home", primary: false },
          ],
        };

      default:
        return {
          title: "Unauthorized",
          message: "You are not authorized to access this resource.",
          actions: [
            { href: `/${locale}/`, label: "Go to Home", primary: true },
            { href: `/${locale}/login`, label: "Sign In", primary: false },
          ],
        };
    }
  };

  const { title, message, actions } = getMessageAndActions(reason);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto h-24 w-24 text-red-500 mb-6">
              <svg
                className="h-full w-full"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Title */}
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {title}
            </h2>

            {/* Message */}
            <p className="mt-2 text-sm text-gray-600">{message}</p>

            {/* Debug Info (Development Only) */}
            {process.env.NODE_ENV === "development" && reason && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-800">
                  <strong>Debug:</strong> Reason: {reason}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            {actions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className={`group relative w-full flex justify-center py-3 px-4 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                  action.primary
                    ? "border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500"
                }`}
              >
                {action.label}
              </Link>
            ))}
          </div>

          {/* Additional Help */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              If you believe this is an error, please{" "}
              <Link
                href={`/${locale}/contact`}
                className="text-blue-600 hover:text-blue-500 underline"
              >
                contact our support team
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </Suspense>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: UnauthorizedPageProps) {
  const { locale } = await params;
  const { reason } = await searchParams;

  return {
    title: "Unauthorized Access - Crystallique",
    description: "You are not authorized to access this resource.",
    robots: "noindex, nofollow",
  };
}
