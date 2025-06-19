# Technical Specifications

## 🏗️ Architecture Overview

**Platform**: Modern TypeScript-based gemstone e-commerce platform  
**Target**: High-performance, scalable B2B/B2C marketplace  
**Deployment**: Cloud-native with global CDN distribution

## 📱 Technology Stack

### Frontend Framework

- **Primary**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: Zustand for client state, TanStack Query for server state
- **Animation**: Framer Motion for smooth interactions

### Backend Services

- **Primary**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Edge Functions**: Supabase Edge Functions for business logic
- **File Storage**: Supabase Storage with CDN
- **Authentication**: Supabase Auth with OAuth providers

### Development Tools

- **Package Manager**: npm
- **Build Tool**: Next.js built-in bundler
- **Type Checking**: TypeScript compiler
- **Linting**: ESLint with custom rules
- **Testing**: Vitest + React Testing Library
- **CI/CD**: GitHub Actions

## 🏗️ System Architecture

### Feature-Based Architecture

```
src/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Auth route group
│   ├── (shop)/            # Shop route group
│   ├── admin/             # Admin routes
│   └── api/               # API routes
├── features/              # Feature modules
│   ├── gemstones/         # Gemstone catalog & filtering
│   ├── product/           # Individual stone details
│   ├── cart/              # Shopping cart
│   ├── favorites/         # User favorites
│   ├── orders/            # Order management
│   ├── chat/              # Customer support chat
│   ├── visualizer/        # 3D stone visualizer
│   ├── auth/              # Authentication
│   ├── admin/             # Admin dashboard
│   ├── payments/          # Payment processing
│   ├── currency/          # Multi-currency system
│   └── media/             # File upload/download
├── shared/                # Shared utilities
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript types
│   └── constants/         # App constants
└── lib/                   # External service configs
    ├── supabase.ts
    ├── stripe.ts
    └── webgl.ts
```

### Component Architecture Principles

- **Single Responsibility**: Each component has one clear purpose
- **Composition over Inheritance**: Use React composition patterns
- **Prop Drilling Prevention**: Use context for deeply nested state
- **Performance First**: Memoization and lazy loading by default

## 🗄️ Database Design

### Schema Overview

**Database**: PostgreSQL 15 via Supabase  
**Approach**: Normalized schema with strict typing  
**Constraints**: Foreign keys, check constraints, and indexes

### Core Tables

#### Gemstones

```sql
CREATE TABLE gemstones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name gemstone_type NOT NULL,
  weight_carats DECIMAL(8,3) NOT NULL,
  length_mm DECIMAL(6,2) NOT NULL,
  width_mm DECIMAL(6,2) NOT NULL,
  depth_mm DECIMAL(6,2) NOT NULL,
  color gem_color NOT NULL,
  cut gem_cut NOT NULL,
  clarity gem_clarity NOT NULL,
  origin_id UUID REFERENCES origins(id),
  price_amount INTEGER NOT NULL, -- store in smallest currency unit
  price_currency currency_code NOT NULL,
  premium_price_amount INTEGER, -- for premium customers
  premium_price_currency currency_code,
  in_stock BOOLEAN DEFAULT TRUE,
  delivery_days INTEGER,
  internal_code TEXT UNIQUE, -- for admin identification
  serial_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### User Management

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role user_role DEFAULT 'regular_customer',
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  preferred_currency currency_code DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Media Management

```sql
CREATE TABLE gemstone_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gemstone_id UUID NOT NULL REFERENCES gemstones(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  has_watermark BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gemstone_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gemstone_id UUID NOT NULL REFERENCES gemstones(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  video_order INTEGER NOT NULL,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Data Types & Enums

```sql
CREATE TYPE gemstone_type AS ENUM (
  'diamond', 'emerald', 'ruby', 'sapphire', 'amethyst',
  'topaz', 'garnet', 'peridot', 'citrine', 'tanzanite'
);

CREATE TYPE gem_color AS ENUM (
  'red', 'blue', 'green', 'yellow', 'pink', 'white', 'black', 'colorless',
  'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'fancy-yellow', 'fancy-blue', 'fancy-pink', 'fancy-green'
);

CREATE TYPE gem_cut AS ENUM (
  'round', 'oval', 'marquise', 'pear', 'emerald', 'princess',
  'cushion', 'radiant', 'fantasy'
);

CREATE TYPE user_role AS ENUM (
  'admin', 'regular_customer', 'premium_customer', 'guest'
);

CREATE TYPE currency_code AS ENUM (
  'USD', 'EUR', 'GBP', 'RUB', 'CHF', 'JPY'
);
```

### Performance Optimizations

```sql
-- Indexes for filtering and search
CREATE INDEX idx_gemstones_in_stock ON gemstones(in_stock);
CREATE INDEX idx_gemstones_color ON gemstones(color);
CREATE INDEX idx_gemstones_cut ON gemstones(cut);
CREATE INDEX idx_gemstones_price ON gemstones(price_amount);
CREATE INDEX idx_gemstones_weight ON gemstones(weight_carats);

-- Composite indexes for common filter combinations
CREATE INDEX idx_gemstones_stock_color_cut ON gemstones(in_stock, color, cut);
CREATE INDEX idx_gemstones_price_weight ON gemstones(price_amount, weight_carats);

-- Full-text search index
CREATE INDEX idx_gemstones_search ON gemstones
USING gin(to_tsvector('english', name || ' ' || COALESCE(internal_code, '')));
```

## 🔐 Security Architecture

### Authentication & Authorization

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row Level Security (RLS) policies
- **Session Management**: Secure HTTP-only cookies
- **OAuth Providers**: Google, VK, Telegram integration

### Row Level Security Policies

```sql
-- Gemstones are publicly viewable, admin-only editable
CREATE POLICY "Public gemstone viewing" ON gemstones
  FOR SELECT USING (true);

CREATE POLICY "Admin gemstone management" ON gemstones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can only access their own data
CREATE POLICY "User profile access" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);
```

### Data Protection

- **Encryption**: All data encrypted at rest and in transit
- **PII Handling**: Personal data encrypted with separate keys
- **GDPR Compliance**: Data retention and deletion policies
- **Audit Logs**: All admin actions logged and monitored

## 🌐 API Architecture

### REST API Endpoints

#### Authentication

```typescript
POST / api / auth / login; // Email/password login
POST / api / auth / register; // User registration
POST / api / auth / logout; // Session termination
GET / api / auth / profile; // User profile data
PUT / api / auth / profile; // Update profile
```

#### Gemstone Catalog

```typescript
GET  /api/gemstones           // List with filtering/pagination
GET  /api/gemstones/:id       // Individual gemstone details
POST /api/gemstones           // Create (admin only)
PUT  /api/gemstones/:id       // Update (admin only)
DELETE /api/gemstones/:id     // Delete (admin only)
GET  /api/gemstones/search    // Search with autocomplete
```

#### Shopping & Orders

```typescript
GET  /api/cart                // User's cart items
POST /api/cart/add            // Add item to cart
DELETE /api/cart/:id          // Remove from cart
POST /api/checkout            // Process order
GET  /api/orders              // User's order history
GET  /api/orders/:id          // Order details
PUT  /api/orders/:id/status   // Update status (admin)
```

#### Media Management

```typescript
POST /api/media/upload        // Upload images/videos (admin)
GET  /api/media/:id/download  // Download with watermark
POST /api/media/batch-download // ZIP download
DELETE /api/media/:id         // Delete media (admin)
```

### WebSocket/Realtime

```typescript
// Supabase Realtime channels
-chat -
  { userId } - // User-admin chat
  inventory -
  updates - // Stock changes
  order -
  { orderId }; // Order status updates
```

### API Standards

- **Versioning**: URL path versioning (/api/v1/)
- **Response Format**: Consistent JSON structure
- **Error Handling**: Standardized error codes
- **Rate Limiting**: Per-user and per-endpoint limits
- **Documentation**: OpenAPI 3.0 specifications

## 🎨 Frontend Architecture

### Component Patterns

#### Feature Module Structure

```typescript
features/gemstones/
├── components/
│   ├── gemstone-card.tsx      // Individual stone display
│   ├── gemstone-grid.tsx      // Grid layout
│   ├── filter-panel.tsx       // Filtering controls
│   └── search-bar.tsx         // Search interface
├── hooks/
│   ├── use-gemstone-search.ts // Search logic
│   ├── use-filters.ts         // Filter state management
│   └── use-pagination.ts      // Pagination logic
├── services/
│   ├── gemstone-api.ts        // API calls
│   └── filter-service.ts      // Filter utilities
├── types/
│   └── gemstone.types.ts      // TypeScript types
└── utils/
    └── price-formatters.ts    // Utility functions
```

#### TypeScript Type System

```typescript
// Strict gemstone typing
interface Gemstone {
  readonly id: string;
  readonly name: GemstoneType;
  readonly color: GemColor;
  readonly cut: GemCut;
  readonly weight_carats: number;
  readonly dimensions: GemDimensions;
  readonly origin: GemOrigin;
  readonly clarity: GemClarity;
  readonly price: Money;
  readonly premium_price?: Money;
  readonly in_stock: boolean;
  readonly delivery_days: number;
  readonly serial_number: string;
  readonly certifications: Certification[];
  readonly created_at: string;
  readonly updated_at: string;
}

// Currency handling
interface Money {
  readonly amount: number; // Stored in smallest unit (cents)
  readonly currency: CurrencyCode;
}

// Error handling
type Result<T, E = Error> =
  | { data: T; error?: never }
  | { data?: never; error: E };
```

### State Management Strategy

- **Server State**: TanStack Query for API data
- **Client State**: Zustand for UI state
- **Form State**: React Hook Form with Zod validation
- **URL State**: Next.js router for filters and pagination

### Performance Optimization

- **Code Splitting**: Dynamic imports for heavy features
- **Image Optimization**: Next.js Image component with CDN
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Lazy Loading**: Intersection Observer for images
- **Memoization**: React.memo and useMemo for expensive operations

## 📱 Mobile & Responsive Design

### Breakpoint Strategy

```css
/* Mobile-first responsive design */
320px   // Small mobile
375px   // Large mobile
768px   // Tablet
1024px  // Small desktop
1280px  // Large desktop
1920px  // Ultra-wide
```

### Touch Interactions

- **Touch Targets**: Minimum 44px tap targets
- **Gestures**: Swipe for image galleries
- **Scroll**: Smooth scrolling with momentum
- **Zoom**: Pinch-to-zoom for gemstone images

### Progressive Web App Features

- **Service Worker**: Offline catalog browsing
- **Manifest**: Add to home screen capability
- **Push Notifications**: Order status updates
- **Background Sync**: Offline order queuing

## 🔧 Development Environment

### Required Software

```bash
Node.js 20.x LTS
npm 10.x
Git 2.40+
VS Code or Cursor
PostgreSQL 15 (optional local)
```

### Environment Configuration

```bash
# Development environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
CURRENCY_API_KEY=your_currency_api_key
```

### Quality Assurance Tools

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "analyze": "ANALYZE=true next build"
  }
}
```

## 🚀 Deployment Architecture

### Production Environment

- **Hosting**: Vercel (preferred) or Netlify
- **Database**: Supabase hosted PostgreSQL
- **CDN**: Vercel Edge Network or Cloudflare
- **Monitoring**: Sentry for error tracking
- **Analytics**: Vercel Analytics + Google Analytics

### CI/CD Pipeline

```yaml
# GitHub Actions workflow
name: CI/CD
on: [push, pull_request]
jobs:
  test:
    - Install dependencies
    - Run TypeScript checks
    - Run ESLint
    - Run unit tests
    - Generate coverage report

  build:
    - Build Next.js application
    - Run Lighthouse CI
    - Deploy to preview (PRs)
    - Deploy to production (main)
```

### Performance Monitoring

- **Core Web Vitals**: LCP, FID, CLS tracking
- **Lighthouse CI**: Automated performance testing
- **Real User Monitoring**: Vercel Analytics
- **Error Tracking**: Sentry integration
- **Database Monitoring**: Supabase dashboard

## 🔍 SEO & Analytics

### SEO Implementation

```typescript
// Next.js metadata API
export async function generateMetadata({ params }): Promise<Metadata> {
  const gemstone = await getGemstone(params.id);

  return {
    title: `${gemstone.color} ${gemstone.name} ${gemstone.cut} ${gemstone.weight_carats}ct`,
    description: `Premium ${gemstone.color} ${gemstone.name} with ${gemstone.cut} cut`,
    openGraph: {
      title: gemstone.name,
      description: `${gemstone.weight_carats}ct ${gemstone.color} ${gemstone.cut}`,
      images: [gemstone.images[0]?.url],
    },
  };
}
```

### Structured Data

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "2.5ct Blue Sapphire Oval Cut",
  "description": "Premium Ceylon sapphire with excellent clarity",
  "sku": "SAP-001-2023",
  "offers": {
    "@type": "Offer",
    "price": "5500.00",
    "priceCurrency": "USD"
  }
}
```

## 📊 Performance Requirements

### Performance Benchmarks

- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Time to Interactive**: <3.5s
- **Cumulative Layout Shift**: <0.1
- **First Input Delay**: <100ms

### Lighthouse Score Targets

- **Performance**: >90
- **Accessibility**: >95
- **Best Practices**: >90
- **SEO**: >90

### Bundle Size Limits

- **Initial Bundle**: <250KB gzipped
- **Route Chunks**: <100KB gzipped
- **Image Optimization**: WebP with fallbacks
- **Font Optimization**: Variable fonts with subset

---

_This technical specification serves as the authoritative guide for all implementation decisions and will be updated as the system evolves._
