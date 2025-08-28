import { Button } from "@/shared/components/ui/button";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-6">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Get in touch with our gemstone experts. We're here to help you find
            the perfect stones for your projects.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-emerald-600 dark:text-emerald-400 text-3xl mb-4">
                📧
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Email Us
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                info@smaragdus-viridi.com
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                sales@smaragdus-viridi.com
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-emerald-600 dark:text-emerald-400 text-3xl mb-4">
                📱
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Call Us
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                +1 (555) 123-4567
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Monday - Friday, 9AM - 6PM EST
              </p>
            </div>
          </div>

          {/* Contact Form Placeholder */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Send us a message
            </h3>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Contact form coming soon
                </p>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
