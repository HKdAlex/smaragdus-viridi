import { Logo, ResponsiveLogo, HeaderLogo, FooterLogo, HeroLogo } from '@/shared/components/logo'

export default function LogoDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-12">Crystallique Logo Demo</h1>
        
        {/* Size Variations */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Size Variations</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            <div className="text-center">
              <Logo variant="block" size="sm" />
              <p className="mt-2 text-sm text-gray-600">Small (64px)</p>
            </div>
            <div className="text-center">
              <Logo variant="block" size="md" />
              <p className="mt-2 text-sm text-gray-600">Medium (128px)</p>
            </div>
            <div className="text-center">
              <Logo variant="block" size="lg" />
              <p className="mt-2 text-sm text-gray-600">Large (256px)</p>
            </div>
            <div className="text-center">
              <Logo variant="block" size="xl" />
              <p className="mt-2 text-sm text-gray-600">Extra Large (512px)</p>
            </div>
          </div>
        </section>

        {/* Variant Comparison */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Logo Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow">
              <Logo variant="block" size="lg" />
              <h3 className="mt-4 text-lg font-medium">Block Logo</h3>
              <p className="text-sm text-gray-600">For headers, footers, and prominent placement</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow">
              <Logo variant="inline" size="lg" />
              <h3 className="mt-4 text-lg font-medium">Inline Logo</h3>
              <p className="text-sm text-gray-600">For navigation bars and compact spaces</p>
            </div>
          </div>
        </section>

        {/* Responsive Logo */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Responsive Logo</h2>
          <div className="text-center p-8 bg-white rounded-lg shadow">
            <ResponsiveLogo variant="block" />
            <p className="mt-4 text-sm text-gray-600">
              Automatically adjusts size based on screen size
            </p>
          </div>
        </section>

        {/* Use Case Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Use Case Examples</h2>
          <div className="space-y-8">
            {/* Header Example */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Header Logo</h3>
              <div className="flex items-center justify-between border-b pb-4">
                <HeaderLogo />
                <nav className="space-x-4">
                  <a href="#" className="text-gray-600 hover:text-gray-900">Catalog</a>
                  <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Contact</a>
                </nav>
              </div>
            </div>

            {/* Hero Example */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg shadow p-8 text-center">
              <HeroLogo className="mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Crystallique</h3>
              <p className="text-gray-600">Premium Gemstones & Jewelry</p>
            </div>

            {/* Footer Example */}
            <div className="bg-gray-900 text-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <FooterLogo />
                <div className="text-sm text-gray-400">
                  © 2024 Crystallique. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* File Size Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Optimization Results</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">40KB</div>
                <p className="text-sm text-gray-600">256px version</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">121KB</div>
                <p className="text-sm text-gray-600">512px version</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">1.6MB</div>
                <p className="text-sm text-gray-600">Original (1024px)</p>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">
              File size reduced by 92% while maintaining visual quality
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}