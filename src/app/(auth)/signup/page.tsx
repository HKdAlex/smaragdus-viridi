import Link from "next/link";
import { SignupForm } from "@/features/auth/components/signup-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our premium gemstone marketplace
          </p>
        </div>

        <SignupForm />

        <div className="text-center">
          <Link href="/login" className="text-primary hover:text-primary/80">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
