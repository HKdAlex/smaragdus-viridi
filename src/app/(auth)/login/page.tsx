import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Access your gemstone collection
          </p>
        </div>

        <LoginForm />

        <div className="text-center">
          <Link href="/signup" className="text-primary hover:text-primary/80">
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
