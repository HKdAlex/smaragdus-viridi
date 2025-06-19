# 📋 Implementation Playbook - Smaragdus Viridi

**Purpose**: Complete step-by-step guide for independent implementation  
**Status**: Ready for execution  
**Last Updated**: January 2025

---

## 🎯 How to Use This Playbook

### **Independent Development Flow:**

1. **Read the entire phase** before starting
2. **Complete each step in order** - don't skip ahead
3. **Check success criteria** before moving to next step
4. **Update progress** in `docs/06-tracking/LIVING_PLAN.md`
5. **Commit frequently** with conventional commit messages

### **When to Ask for Help:**

- ❌ Unexpected errors that block progress
- ❌ Unclear requirements or specifications
- ❌ Architecture decisions not covered in docs
- ✅ NOT for routine implementation - this guide has everything

---

## 🚀 PHASE 1: PROJECT INITIALIZATION (Days 1-3)

### **Step 1.1: Development Environment Setup**

**Estimated Time**: 2 hours  
**Prerequisites**: Node.js 20, Git, Cursor IDE

#### **Actions:**

```bash
# 1. Create Next.js 15 project
npx create-next-app@latest smaragdus-viridi --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 2. Navigate to project
cd smaragdus-viridi

# 3. Install additional dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install zod react-hook-form @hookform/resolvers
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# 4. Install dev dependencies
npm install -D @types/node @testing-library/react @testing-library/jest-dom vitest jsdom

# 5. Initialize git
git init
git add .
git commit -m "feat: initialize Next.js 15 project with TypeScript and Tailwind"
```

#### **Configuration Files to Create:**

**`.env.local`**:

```env
# Copy this template and fill with your values
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**`vitest.config.ts`**:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**`src/test/setup.ts`**:

```typescript
import "@testing-library/jest-dom";
```

#### **Success Criteria:**

- [x] `npm run dev` starts without errors
- [x] `npm run build` completes successfully
- [x] `npm run lint` passes
- [x] Project opens in Cursor IDE without issues

**Commit**: `feat: configure development environment and testing setup` ✅ **COMPLETED**

---

### **Step 1.2: Project Structure Setup**

**Estimated Time**: 1 hour

#### **Actions:**

```bash
# Create feature-based directory structure
mkdir -p src/features/{auth,gemstones,cart,orders,chat,admin}
mkdir -p src/shared/{components,hooks,services,types,utils}
mkdir -p src/lib
mkdir -p src/app/{(auth),admin,api}

# Create initial files
touch src/shared/types/index.ts
touch src/lib/supabase.ts
touch src/lib/utils.ts
```

#### **Create Core Type Definitions:**

**`src/shared/types/index.ts`**:

```typescript
// Core domain types
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

export type UserRole =
  | "admin"
  | "regular_customer"
  | "premium_customer"
  | "guest";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "RUB" | "CHF" | "JPY";

export interface Money {
  readonly amount: number; // in smallest currency unit (cents)
  readonly currency: CurrencyCode;
}

export interface Gemstone {
  readonly id: string;
  readonly name: GemstoneType;
  readonly color: GemColor;
  readonly cut: GemCut;
  readonly weight_carats: number;
  readonly clarity: GemClarity;
  readonly price: Money;
  readonly premium_price?: Money;
  readonly in_stock: boolean;
  readonly serial_number: string;
  readonly created_at: string;
}
```

#### **Success Criteria:**

- [x] All directories created
- [x] TypeScript types compile without errors
- [x] File structure matches our architecture documentation

**Commit**: `feat: establish feature-based project structure and core types` ✅ **COMPLETED**

---

### **Step 1.3: Supabase Integration Setup**

**Estimated Time**: 2 hours  
**Prerequisites**: Supabase account

#### **Actions Using MCP Tools:**

**Important**: Use MCP tools, NOT Supabase CLI

```bash
# DON'T USE: supabase init, supabase start, etc.
# Instead, use the MCP tools available in your environment
```

#### **Create Supabase Client:**

**`src/lib/supabase.ts`**:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations
export const createServerClient = () => {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
```

#### **Test Connection:**

**`src/app/api/test-db/route.ts`**:

```typescript
import { createServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createServerClient();

    // Test connection
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Database connection failed",
      },
      { status: 500 }
    );
  }
}
```

#### **Success Criteria:**

- [ ] Supabase client connects without errors
- [ ] `/api/test-db` returns successful response
- [ ] Environment variables properly configured

**Commit**: `feat: integrate Supabase client with connection testing`

---

## 🗄️ PHASE 2: DATABASE SCHEMA SETUP (Days 4-5)

### **Step 2.1: Create Database Schema Using MCP**

**Estimated Time**: 3 hours

#### **Actions:**

Use MCP tools to execute these SQL statements in your Supabase project:

**Create Enums and Core Tables:**

```sql
-- Create enums first
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
  'round', 'oval', 'marquise', 'pear', 'emerald',
  'princess', 'cushion', 'radiant', 'fantasy'
);

CREATE TYPE gem_clarity AS ENUM (
  'FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'
);

CREATE TYPE user_role AS ENUM (
  'admin', 'regular_customer', 'premium_customer', 'guest'
);

CREATE TYPE currency_code AS ENUM (
  'USD', 'EUR', 'GBP', 'RUB', 'CHF', 'JPY'
);

-- Origins table
CREATE TABLE origins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  region TEXT,
  mine_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  role user_role DEFAULT 'regular_customer',
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  preferred_currency currency_code DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Gemstones table
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
  price_amount INTEGER NOT NULL, -- in cents
  price_currency currency_code NOT NULL,
  premium_price_amount INTEGER,
  premium_price_currency currency_code,
  in_stock BOOLEAN DEFAULT TRUE,
  delivery_days INTEGER DEFAULT 7,
  internal_code TEXT UNIQUE,
  serial_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Success Criteria:**

- [ ] All tables created without errors
- [ ] Enums defined correctly
- [ ] Foreign key relationships working

**Commit**: `feat: create database schema with gemstone and user tables`

---

### **Step 2.2: Add RLS Policies and Indexes**

**Estimated Time**: 2 hours

#### **Row Level Security Policies:**

```sql
-- Enable RLS on all tables
ALTER TABLE gemstones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE origins ENABLE ROW LEVEL SECURITY;

-- Gemstones: Public read, admin write
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

-- User profiles: Users see own data
CREATE POLICY "Users see own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin sees all profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- Origins: Public read, admin write
CREATE POLICY "Origins viewable by all" ON origins
  FOR SELECT USING (true);

CREATE POLICY "Origins manageable by admin" ON origins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
```

#### **Performance Indexes:**

```sql
-- Gemstone filtering indexes
CREATE INDEX idx_gemstones_in_stock ON gemstones(in_stock);
CREATE INDEX idx_gemstones_cut ON gemstones(cut);
CREATE INDEX idx_gemstones_color ON gemstones(color);
CREATE INDEX idx_gemstones_clarity ON gemstones(clarity);
CREATE INDEX idx_gemstones_price ON gemstones(price_amount);
CREATE INDEX idx_gemstones_weight ON gemstones(weight_carats);
CREATE INDEX idx_gemstones_created_at ON gemstones(created_at DESC);

-- Composite indexes for common filter combinations
CREATE INDEX idx_gemstones_in_stock_cut_color ON gemstones(in_stock, cut, color);
CREATE INDEX idx_gemstones_price_weight ON gemstones(price_amount, weight_carats);

-- User indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
```

#### **Success Criteria:**

- [ ] RLS policies prevent unauthorized access
- [ ] Indexes improve query performance
- [ ] Admin users can manage all data
- [ ] Regular users can only access own data

**Commit**: `feat: implement RLS policies and performance indexes`

---

### **Step 2.3: Seed Initial Data**

**Estimated Time**: 1 hour

#### **Add Sample Origins:**

```sql
INSERT INTO origins (name, country, region, mine_name) VALUES
  ('Myanmar', 'Myanmar', 'Mogok Valley', 'Mogok Ruby Mines'),
  ('Colombia', 'Colombia', 'Boyacá', 'Muzo Emerald Mine'),
  ('Sri Lanka', 'Sri Lanka', 'Ratnapura', 'Gem Fields'),
  ('Madagascar', 'Madagascar', 'Ilakaka', 'Sapphire Deposits'),
  ('Brazil', 'Brazil', 'Minas Gerais', 'Various Mines'),
  ('Australia', 'Australia', 'New South Wales', 'Lightning Ridge'),
  ('Tanzania', 'Tanzania', 'Merelani Hills', 'Tanzanite Mines'),
  ('Zambia', 'Zambia', 'Kafubu River', 'Emerald Mines');
```

#### **Add Sample Gemstones:**

```sql
INSERT INTO gemstones (
  name, weight_carats, length_mm, width_mm, depth_mm,
  color, cut, clarity, origin_id, price_amount, price_currency,
  serial_number
) VALUES
  ('ruby', 2.5, 8.2, 6.1, 4.3, 'red', 'oval', 'VS1',
   (SELECT id FROM origins WHERE name = 'Myanmar'),
   500000, 'USD', 'RBY001'),
  ('emerald', 3.2, 9.1, 7.3, 5.2, 'green', 'emerald', 'SI1',
   (SELECT id FROM origins WHERE name = 'Colombia'),
   750000, 'USD', 'EMR001'),
  ('sapphire', 4.1, 10.2, 8.4, 6.1, 'blue', 'round', 'VVS2',
   (SELECT id FROM origins WHERE name = 'Sri Lanka'),
   320000, 'USD', 'SAP001'),
  ('diamond', 1.8, 7.8, 7.8, 4.8, 'D', 'round', 'IF',
   NULL, 1200000, 'USD', 'DIA001'),
  ('tanzanite', 5.5, 12.1, 9.2, 7.3, 'blue', 'cushion', 'VS2',
   (SELECT id FROM origins WHERE name = 'Tanzania'),
   180000, 'USD', 'TAN001');
```

#### **Success Criteria:**

- [ ] Origins data inserted successfully
- [ ] Sample gemstones available for testing
- [ ] Foreign key relationships working
- [ ] Data accessible through Supabase dashboard

**Commit**: `feat: add sample origins and gemstone data for development`

---

## 🔐 PHASE 3: AUTHENTICATION SYSTEM (Days 6-7)

### **Step 3.1: Auth Configuration**

**Estimated Time**: 2 hours

#### **Supabase Auth Setup:**

**`src/lib/auth.ts`**:

```typescript
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/shared/types";

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  role: UserRole;
  discount_percentage: number;
  preferred_currency: string;
  created_at: string;
  updated_at: string;
}

export const auth = {
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) return null;
    return data;
  },
};
```

#### **Auth Context Provider:**

**`src/features/auth/context/auth-context.tsx`**:

```typescript
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { auth, UserProfile } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        auth.getUserProfile(session.user.id).then(setProfile);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const userProfile = await auth.getUserProfile(session.user.id);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await auth.signIn(email, password);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      await auth.signUp(email, password, name);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

#### **Success Criteria:**

- [ ] Auth context provides user state
- [ ] Sign up/in/out functions work
- [ ] User profiles linked to auth users

**Commit**: `feat: implement authentication system with user profiles`

---

### **Step 3.2: Auth UI Components**

**Estimated Time**: 3 hours

#### **Login Form:**

**`src/features/auth/components/login-form.tsx`**:

```typescript
"use client";

import { useState } from "react";
import { useAuth } from "../context/auth-context";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
```

#### **Auth Pages:**

**`src/app/(auth)/login/page.tsx`**:

```typescript
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
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
          <a href="/register" className="text-blue-600 hover:text-blue-500">
            Don't have an account? Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
```

#### **Protected Route Middleware:**

**`src/middleware.ts`**:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

#### **Success Criteria:**

- [ ] Login form works and authenticates users
- [ ] Protected routes redirect unauthenticated users
- [ ] Admin routes check for admin role
- [ ] Auth state persists across page refreshes

**Commit**: `feat: add authentication UI components and protected routes`

---

## 💎 PHASE 4: BASIC GEMSTONE CATALOG (Days 8-10)

### **Step 4.1: Gemstone Data Layer**

**Estimated Time**: 3 hours

#### **Gemstone Service:**

**`src/features/gemstones/services/gemstone-service.ts`**:

```typescript
import { supabase } from "@/lib/supabase";
import type { Gemstone } from "@/shared/types";

export interface GemstoneCatalogFilters {
  colors?: string[];
  cuts?: string[];
  clarities?: string[];
  minPrice?: number;
  maxPrice?: number;
  minWeight?: number;
  maxWeight?: number;
  inStockOnly?: boolean;
  origins?: string[];
}

export interface GemstoneCatalogResponse {
  gemstones: Gemstone[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export const gemstoneService = {
  async getCatalog(
    filters: GemstoneCatalogFilters = {},
    page = 1,
    pageSize = 20
  ): Promise<GemstoneCatalogResponse> {
    let query = supabase.from("gemstones").select(
      `
        *,
        origin:origins(name, country)
      `,
      { count: "exact" }
    );

    // Apply filters
    if (filters.colors?.length) {
      query = query.in("color", filters.colors);
    }

    if (filters.cuts?.length) {
      query = query.in("cut", filters.cuts);
    }

    if (filters.clarities?.length) {
      query = query.in("clarity", filters.clarities);
    }

    if (filters.minPrice !== undefined) {
      query = query.gte("price_amount", filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte("price_amount", filters.maxPrice);
    }

    if (filters.minWeight !== undefined) {
      query = query.gte("weight_carats", filters.minWeight);
    }

    if (filters.maxWeight !== undefined) {
      query = query.lte("weight_carats", filters.maxWeight);
    }

    if (filters.inStockOnly) {
      query = query.eq("in_stock", true);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to).order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      gemstones: data || [],
      totalCount: count || 0,
      page,
      pageSize,
    };
  },

  async getGemstoneById(id: string): Promise<Gemstone | null> {
    const { data, error } = await supabase
      .from("gemstones")
      .select(
        `
        *,
        origin:origins(name, country)
      `
      )
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  },

  async getFilterOptions() {
    const { data: gemstones } = await supabase
      .from("gemstones")
      .select("color, cut, clarity, price_amount, weight_carats");

    if (!gemstones) return null;

    const colors = [...new Set(gemstones.map((g) => g.color))];
    const cuts = [...new Set(gemstones.map((g) => g.cut))];
    const clarities = [...new Set(gemstones.map((g) => g.clarity))];
    const prices = gemstones.map((g) => g.price_amount);
    const weights = gemstones.map((g) => g.weight_carats);

    return {
      colors: colors.sort(),
      cuts: cuts.sort(),
      clarities: clarities.sort(),
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
      },
      weightRange: {
        min: Math.min(...weights),
        max: Math.max(...weights),
      },
    };
  },
};
```

#### **Success Criteria:**

- [ ] Service fetches gemstones with filters
- [ ] Pagination works correctly
- [ ] Filter options dynamically generated
- [ ] Related data (origins) included

**Commit**: `feat: implement gemstone service with filtering and pagination`

---

### **Step 4.2: Gemstone Catalog Components**

**Estimated Time**: 4 hours

#### **Gemstone Card Component:**

**`src/features/gemstones/components/gemstone-card.tsx`**:

```typescript
import Image from "next/image";
import Link from "next/link";
import type { Gemstone } from "@/shared/types";

interface GemstoneCardProps {
  gemstone: Gemstone;
}

export function GemstoneCard({ gemstone }: GemstoneCardProps) {
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  return (
    <Link href={`/gemstones/${gemstone.id}`}>
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4">
        {/* Placeholder for gemstone image */}
        <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Photo</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-900 capitalize">
              {gemstone.color} {gemstone.name}
            </h3>
            <span className="text-xs text-gray-500">
              {gemstone.serial_number}
            </span>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              {gemstone.weight_carats}ct • {gemstone.cut} • {gemstone.clarity}
            </p>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(gemstone.price.amount, gemstone.price.currency)}
            </span>

            <span
              className={`px-2 py-1 text-xs rounded-full ${
                gemstone.in_stock
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {gemstone.in_stock ? "In Stock" : "Sold"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

#### **Catalog Grid Component:**

**`src/features/gemstones/components/catalog-grid.tsx`**:

```typescript
"use client";

import { useState, useEffect } from "react";
import {
  gemstoneService,
  GemstoneCatalogFilters,
} from "../services/gemstone-service";
import { GemstoneCard } from "./gemstone-card";
import type { Gemstone } from "@/shared/types";

interface CatalogGridProps {
  initialFilters?: GemstoneCatalogFilters;
}

export function CatalogGrid({ initialFilters = {} }: CatalogGridProps) {
  const [gemstones, setGemstones] = useState<Gemstone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);

  const pageSize = 20;

  useEffect(() => {
    loadGemstones();
  }, [filters, currentPage]);

  const loadGemstones = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await gemstoneService.getCatalog(
        filters,
        currentPage,
        pageSize
      );

      setGemstones(response.gemstones);
      setTotalCount(response.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load gemstones");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg h-80 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading gemstones: {error}</p>
        <button
          onClick={loadGemstones}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (gemstones.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          No gemstones found matching your criteria.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Results summary */}
      <div className="text-sm text-gray-600">
        Showing {(currentPage - 1) * pageSize + 1}-
        {Math.min(currentPage * pageSize, totalCount)} of {totalCount} gemstones
      </div>

      {/* Gemstone grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {gemstones.map((gemstone) => (
          <GemstoneCard key={gemstone.id} gemstone={gemstone} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>

          <span className="px-3 py-2">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

#### **Success Criteria:**

- [ ] Gemstone cards display all key information
- [ ] Grid loads gemstones from database
- [ ] Pagination works correctly
- [ ] Loading and error states handled

**Commit**: `feat: create gemstone card and catalog grid components`

---

### **Step 4.3: Catalog Page**

**Estimated Time**: 2 hours

#### **Main Catalog Page:**

**`src/app/catalog/page.tsx`**:

```typescript
import { CatalogGrid } from "@/features/gemstones/components/catalog-grid";

export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gemstone Catalog
          </h1>
          <p className="text-gray-600">
            Discover our collection of premium gemstones
          </p>
        </div>

        {/* Catalog grid */}
        <CatalogGrid />
      </div>
    </div>
  );
}
```

#### **Navigation Component:**

**`src/shared/components/navigation.tsx`**:

```typescript
"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/context/auth-context";

export function Navigation() {
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Smaragdus Viridi
            </Link>

            <div className="ml-8 flex space-x-4">
              <Link
                href="/catalog"
                className="text-gray-600 hover:text-gray-900"
              >
                Catalog
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={signOut}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

#### **Update Root Layout:**

**`src/app/layout.tsx`**:

```typescript
import { Inter } from "next/font/google";
import { AuthProvider } from "@/features/auth/context/auth-context";
import { Navigation } from "@/shared/components/navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Smaragdus Viridi - Premium Gemstones",
  description: "Professional gemstone e-commerce platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

#### **Success Criteria:**

- [ ] `/catalog` page displays gemstone grid
- [ ] Navigation works between pages
- [ ] Authentication state shows in nav
- [ ] Page loads without errors

**Commit**: `feat: create catalog page with navigation and layout`

---

## ✅ PHASE 1-4 COMPLETION CHECKLIST

### **Before Moving to Next Phase:**

#### **Technical Validation:**

- [ ] All pages load without console errors
- [ ] Database queries return expected data
- [ ] Authentication flow works end-to-end
- [ ] Responsive design works on mobile

#### **Code Quality:**

- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] All commits follow conventional format
- [ ] No `any` types in codebase

#### **Functionality:**

- [ ] Users can browse gemstone catalog
- [ ] Sign up/in/out works correctly
- [ ] Gemstone data displays accurately
- [ ] Basic navigation between pages

#### **Documentation:**

- [ ] Update `docs/06-tracking/LIVING_PLAN.md` with progress
- [ ] Document any deviations from plan
- [ ] Note any technical decisions made

---

## 🔄 NEXT PHASES PREVIEW

### **Phase 5: Advanced Filtering (Days 11-13)**

- Multi-select filter components
- Price range sliders
- Real-time filter application
- Filter persistence in URL

### **Phase 6: Shopping Cart (Days 14-16)**

- Add to cart functionality
- Cart persistence
- Checkout process
- Order management

### **Phase 7: Admin Dashboard (Days 17-19)**

- Gemstone management
- User management
- Order processing
- Analytics

---

**🎉 Congratulations!**

After completing Phases 1-4, you'll have a fully functional gemstone catalog with authentication. The remaining phases build additional features on this solid foundation.

**Questions or Issues?** Refer to the human-AI collaboration guide for effective communication patterns.

---

**Last Updated**: January 2025  
**Status**: Ready for implementation  
**Estimated Total Time**: 19 days for complete platform
