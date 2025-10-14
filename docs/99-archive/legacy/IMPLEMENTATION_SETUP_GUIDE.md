# 🔷 Smaragdus Viridi - Implementation Setup Guide

**Premium Gemstone E-commerce Platform**  
_Next.js 15 + Supabase + TypeScript_

## 🚀 Quick Start

### Prerequisites

- **Node.js 20.x.x** (use fnm for version management)
- **npm** or **yarn**
- **Supabase CLI**
- **Git**
- **PostgreSQL** (for local development)

### 1. Project Initialization

```bash
# Clone and setup
git clone <repository-url> crystallique
cd crystallique

# Install fnm and Node.js 20
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 20
fnm use 20

# Initialize Next.js 15 project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install core dependencies
npm install @supabase/supabase-js@latest
npm install @supabase/ssr@latest
npm install three @types/three
npm install @react-three/fiber @react-three/drei
npm install zustand
npm install @tanstack/react-query
npm install zod
npm install date-fns
npm install framer-motion
npm install react-dropzone
npm install stripe
npm install lucide-react
npm install @radix-ui/react-select
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-tabs
npm install class-variance-authority
npm install clsx tailwind-merge

# Development dependencies
npm install -D @types/node
npm install -D @typescript-eslint/eslint-plugin
npm install -D @typescript-eslint/parser
npm install -D vitest @vitejs/plugin-react
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D husky lint-staged
npm install -D prettier prettier-plugin-tailwindcss
```

### 2. Environment Configuration

Create environment files:

```bash
# Copy environment template
cp .env.example .env.local
```

**`.env.local`** (Fill with your values):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL=your_supabase_db_url

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Stripe (Payment Processing)
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Currency API
EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key

# File Storage
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=gemstone-media
AWS_S3_BUCKET_NAME=crystallique-media
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Smaragdus Viridi"
NEXT_PUBLIC_COMPANY_NAME="Smaragdus Viridi Ltd"

# Development
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
```

### 3. Project Structure Setup

Create the feature-based directory structure:

```bash
# Create src directory structure
mkdir -p src/{app,features,shared,lib,types}

# App Router structure
mkdir -p src/app/{(auth),{shop),admin,api}
mkdir -p src/app/(auth)/{login,register}
mkdir -p src/app/(shop)/{catalog,product,cart,favorites}
mkdir -p src/app/admin/{dashboard,stones,orders,chat}
mkdir -p src/app/api/{auth,stones,orders,chat,media,currency}

# Feature modules
mkdir -p src/features/{catalog,product,cart,favorites,orders,chat,visualizer,auth,admin,payments,currency,media}

# Create feature subdirectories
for feature in catalog product cart favorites orders chat visualizer auth admin payments currency media; do
  mkdir -p src/features/$feature/{components,hooks,services,types,utils}
done

# Shared utilities
mkdir -p src/shared/{components,hooks,utils,types,constants}
mkdir -p src/shared/components/{ui,forms,layout}

# Library configurations
mkdir -p src/lib/{supabase,stripe,webgl}

# Types
mkdir -p src/types
```

### 4. TypeScript Configuration

**`tsconfig.json`**:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 5. Supabase Configuration

**Install Supabase CLI**:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize project
supabase init

# Link to your project
supabase link --project-ref your-project-ref
```

**`src/lib/supabase/client.ts`**:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**`src/lib/supabase/server.ts`**:

```typescript
import { createServerSupabaseClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
```

### 6. Database Schema Setup

**`supabase/migrations/001_initial_schema.sql`**:

```sql
-- Create custom types first
CREATE TYPE user_role AS ENUM ('admin', 'regular_customer', 'premium_customer', 'guest');
CREATE TYPE currency_code AS ENUM ('USD', 'EUR', 'GBP', 'RUB', 'CHF', 'JPY');
CREATE TYPE gemstone_type AS ENUM ('diamond', 'emerald', 'ruby', 'sapphire', 'amethyst', 'topaz', 'garnet', 'peridot', 'citrine', 'tanzanite');
CREATE TYPE gem_color AS ENUM ('red', 'blue', 'green', 'yellow', 'pink', 'white', 'black', 'colorless', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'fancy-yellow', 'fancy-blue', 'fancy-pink', 'fancy-green');
CREATE TYPE gem_cut AS ENUM ('round', 'oval', 'marquise', 'pear', 'emerald', 'princess', 'cushion', 'radiant', 'fantasy');
CREATE TYPE gem_clarity AS ENUM ('FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_type AS ENUM ('bank_transfer', 'crypto', 'cash', 'stripe');

-- Origins table
CREATE TABLE origins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  region TEXT,
  mine_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gemstones table (core inventory)
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

-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role user_role DEFAULT 'regular_customer',
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  preferred_currency currency_code DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status order_status DEFAULT 'pending',
  delivery_address JSONB,
  payment_type payment_type,
  total_amount INTEGER NOT NULL,
  currency_code currency_code DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  gemstone_id UUID REFERENCES gemstones(id) ON DELETE RESTRICT,
  quantity INTEGER DEFAULT 1,
  unit_price INTEGER NOT NULL,
  line_total INTEGER NOT NULL
);

-- Favorites
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gemstone_id UUID REFERENCES gemstones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, gemstone_id)
);

-- Cart items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gemstone_id UUID REFERENCES gemstones(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, gemstone_id)
);

-- Gemstone media
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

-- Certifications
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gemstone_id UUID NOT NULL REFERENCES gemstones(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL,
  certificate_number TEXT,
  certificate_url TEXT,
  issued_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  attachments TEXT[],
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  is_auto_response BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Currency rates
CREATE TABLE currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency currency_code NOT NULL,
  target_currency currency_code NOT NULL,
  rate DECIMAL(15,8) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(base_currency, target_currency)
);

-- Indexes for performance
CREATE INDEX idx_gemstones_available ON gemstones(in_stock);
CREATE INDEX idx_gemstones_cut ON gemstones(cut);
CREATE INDEX idx_gemstones_color ON gemstones(color);
CREATE INDEX idx_gemstones_price ON gemstones(price_amount);
CREATE INDEX idx_gemstones_weight ON gemstones(weight_carats);
CREATE INDEX idx_gemstones_created_at ON gemstones(created_at DESC);

-- Composite indexes for filtering
CREATE INDEX idx_gemstones_available_cut_color ON gemstones(in_stock, cut, color);
CREATE INDEX idx_gemstones_price_weight ON gemstones(price_amount, weight_carats);

-- User and order indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_unread ON chat_messages(user_id, is_read) WHERE is_read = FALSE;
```

### 7. Row Level Security (RLS)

**`supabase/migrations/002_rls_policies.sql`**:

```sql
-- Enable RLS
ALTER TABLE gemstones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Gemstone policies (public read, admin write)
CREATE POLICY "Gemstones viewable by all" ON gemstones
  FOR SELECT USING (true);

CREATE POLICY "Gemstones manageable by admin" ON gemstones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- User profile policies
CREATE POLICY "Users see own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Order policies
CREATE POLICY "Users see own orders" ON orders
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Favorites policies
CREATE POLICY "Users manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- Cart policies
CREATE POLICY "Users manage own cart" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Chat policies
CREATE POLICY "Users see own messages" ON chat_messages
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Users send own messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 8. Core Types Setup

**`src/types/database.types.ts`**:

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Define your Supabase types here
      // Generate with: supabase gen types typescript --project-id YOUR_PROJECT_ID
    };
  };
}
```

**`src/types/gemstone.types.ts`**:

```typescript
export type GemstoneType =
  | "diamond"
  | "emerald"
  | "ruby"
  | "sapphire"
  | "amethyst"
  | "topaz"
  | "garnet"
  | "peridot"
  | "citrine"
  | "tanzanite";

export type GemColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "pink"
  | "white"
  | "black"
  | "colorless"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "fancy-yellow"
  | "fancy-blue"
  | "fancy-pink"
  | "fancy-green";

export type GemCut =
  | "round"
  | "oval"
  | "marquise"
  | "pear"
  | "emerald"
  | "princess"
  | "cushion"
  | "radiant"
  | "fantasy";

export type GemClarity =
  | "FL"
  | "IF"
  | "VVS1"
  | "VVS2"
  | "VS1"
  | "VS2"
  | "SI1"
  | "SI2"
  | "I1";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "RUB" | "CHF" | "JPY";

export type UserRole =
  | "admin"
  | "regular_customer"
  | "premium_customer"
  | "guest";

export interface Money {
  readonly amount: number; // Store in smallest currency unit (cents)
  readonly currency: CurrencyCode;
}

export interface GemDimensions {
  readonly length_mm: number;
  readonly width_mm: number;
  readonly depth_mm: number;
}

export interface Gemstone {
  readonly id: string;
  readonly name: GemstoneType;
  readonly color: GemColor;
  readonly cut: GemCut;
  readonly weight_carats: number;
  readonly dimensions: GemDimensions;
  readonly clarity: GemClarity;
  readonly price: Money;
  readonly premium_price?: Money;
  readonly in_stock: boolean;
  readonly delivery_days: number;
  readonly internal_code: string;
  readonly serial_number: string;
  readonly created_at: string;
  readonly updated_at: string;
}
```

### 9. App Router Setup

**`src/app/layout.tsx`**:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smaragdus Viridi - Premium Gemstones",
  description:
    "Professional gemstone trading platform for jewelers and collectors",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

**`src/app/page.tsx`**:

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  redirect("/catalog");
}
```

### 10. Development Scripts

**`package.json` scripts**:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "db:generate-types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/supabase.ts",
    "db:reset": "supabase db reset",
    "db:migrate": "supabase db push",
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "prepare": "husky install"
  }
}
```

### 11. Development Workflow

```bash
# Start development environment
npm run supabase:start  # Start local Supabase
npm run dev            # Start Next.js dev server

# Database operations
npm run db:generate-types  # Generate TypeScript types
npm run db:migrate        # Apply migrations
npm run db:reset          # Reset database

# Code quality
npm run lint              # Check linting
npm run type-check        # Check TypeScript
npm run test              # Run tests

# Build for production
npm run build
```

### 12. Initial Data Seeding

Create sample data for development:

**`scripts/seed-data.ts`**:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedData() {
  // Insert sample origins
  const { data: origins } = await supabase
    .from("origins")
    .insert([
      { name: "Myanmar (Burma)", country: "Myanmar", region: "Mogok" },
      { name: "Colombia", country: "Colombia", region: "Muzo" },
      { name: "Kashmir", country: "India", region: "Kashmir" },
    ])
    .select();

  // Insert sample gemstones
  await supabase.from("gemstones").insert([
    {
      name: "ruby",
      weight_carats: 2.15,
      length_mm: 8.5,
      width_mm: 6.8,
      depth_mm: 4.2,
      color: "red",
      cut: "oval",
      clarity: "VS1",
      origin_id: origins?.[0]?.id,
      price_amount: 850000, // $8,500 in cents
      price_currency: "USD",
      premium_price_amount: 765000, // 10% discount for premium
      premium_price_currency: "USD",
      serial_number: "RBY-001-2024",
      internal_code: "MM-RBY-001",
    },
  ]);

  console.log("Sample data seeded successfully");
}

seedData();
```

### 13. Next Steps

1. **Run the setup**:

   ```bash
   npm run db:migrate
   npm run db:generate-types
   npm run dev
   ```

2. **Implement core features** (in order):

   - Authentication system
   - Gemstone catalog with filtering
   - Product detail pages
   - Shopping cart functionality
   - Admin dashboard
   - Real-time chat system
   - 3D visualization
   - Payment processing

3. **Configure external services**:

   - Stripe payment processing
   - Exchange rate API
   - Email service (Resend/SendGrid)
   - CDN for media files

4. **Deploy to production**:
   - Vercel deployment
   - Production Supabase project
   - Environment variable configuration

## 🔧 Troubleshooting

### Common Issues

1. **Supabase connection errors**: Check your environment variables
2. **TypeScript errors**: Run `npm run type-check` and fix issues
3. **Build failures**: Ensure all dependencies are installed correctly
4. **Authentication issues**: Verify Supabase Auth configuration

### Performance Guidelines

- Always run `npm run build` after 3+ file changes
- Use TypeScript strict mode - never use `any` types
- Implement proper error boundaries
- Use Next.js Image component for optimization
- Implement proper caching strategies

---

**Ready to build the premium gemstone e-commerce platform! 💎**
