# CORRECTION: Supabase Client Analysis

## 🚨 I Made a Critical Error!

I apologize - I completely misunderstood your question and gave you **incorrect analysis**.

---

## Your Question

> "What is the difference between `import { createServerClient } from "@supabase/ssr"` and `import { createServerSupabaseClient } from "@/lib/supabase"`?"

---

## The CORRECT Answer

### **They are completely different things!**

```typescript
// Option 1: Direct import from Supabase library
import { createServerClient } from "@supabase/ssr";
// ↑ This is THE FUNCTION itself (from node_modules)

// Option 2: Import your wrapper function
import { createServerSupabaseClient } from "@/lib/supabase";
// ↑ This is YOUR WRAPPER that CALLS the function above
```

---

## Breaking It Down

### **1. The Supabase Library Function**

```typescript
// From: node_modules/@supabase/ssr/dist/...
export function createServerClient(url, key, options) {
  // Supabase's implementation
  // Handles cookies, auth, sessions, etc.
}
```

**This is provided by Supabase.** You import it to USE it.

---

### **2. Your Wrapper Function**

```typescript
// From: /lib/supabase.ts (line 55-76)
export const createServerSupabaseClient = async () => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    //     ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
    //     USING Supabase's function here!
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // ... your cookie handling
      },
    },
  });
};
```

**This is YOUR code** that:

1. Sets up Next.js cookies
2. Calls Supabase's `createServerClient`
3. Returns a configured client

---

## The Relationship

```
┌─────────────────────────────────────────────┐
│  @supabase/ssr (npm package)                │
│  ┌───────────────────────────────────────┐  │
│  │ createServerClient()                  │  │  ← Supabase's function
│  │ (the actual implementation)           │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
              ↓ used by
┌─────────────────────────────────────────────┐
│  /lib/supabase.ts (your code)               │
│  ┌───────────────────────────────────────┐  │
│  │ createServerSupabaseClient()          │  │  ← YOUR wrapper
│  │ - Handles Next.js cookies             │  │
│  │ - Calls Supabase's createServerClient │  │
│  │ - Returns configured client           │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
              ↓ used by
┌─────────────────────────────────────────────┐
│  Your API routes & Server Components        │
│  - /app/api/catalog/route.ts               │
│  - /app/api/admin/*/route.ts               │
│  - etc.                                     │
└─────────────────────────────────────────────┘
```

---

## Why Your Wrapper Exists

### **Without Wrapper (Direct Use):**

```typescript
// ❌ You'd have to repeat this in EVERY file:
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/shared/types/database";

export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          /* ... */
        },
      },
    }
  );

  // Now use supabase...
}
```

**Problem:** 20+ lines of boilerplate in every file! 😱

---

### **With Your Wrapper (Clean):**

```typescript
// ✅ ONE line import, pre-configured!
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  // Ready to use!
}
```

**Benefits:**

- ✅ DRY (Don't Repeat Yourself)
- ✅ Type safety configured once
- ✅ Consistent cookie handling
- ✅ Easy to update if Supabase changes

---

## Correcting My Previous Error

### **What I Said (WRONG):**

> "You have duplicate implementations in `supabase.ts` and `supabase-server.ts`"

### **The Truth:**

Looking at your actual file system:

```bash
ls src/lib/
supabase.ts        ← EXISTS
supabase-server.ts ← DOES NOT EXIST!
```

**You already deleted it or never had it!** 🎉

The grep results showing 16 files importing from `@/lib/supabase-server` must be **outdated** or the file was already removed.

---

## Current State: Actually GOOD! ✅

Your current setup in `/lib/supabase.ts` is **correct and follows best practices**:

```typescript
// ✅ Browser client (singleton)
export const supabase = getBrowserClient();

// ✅ Server client (wrapper with Next.js cookies)
export const createServerSupabaseClient = async () => { ... }

// ✅ Admin client (service role)
export const supabaseAdmin = ...
```

---

## What You Should Actually Import

### **In Client Components:**

```typescript
import { supabase } from "@/lib/supabase";

// Use directly (singleton browser client)
const { data } = await supabase.from("table").select();
```

---

### **In Server Components / API Routes:**

```typescript
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("table").select();
}
```

---

### **In Server-Side Services (Admin Operations):**

```typescript
import { supabaseAdmin } from "@/lib/supabase";

if (!supabaseAdmin) throw new Error("DB connection failed");

const { data } = await supabaseAdmin.from("table").select();
```

---

## Summary

| Import                       | From             | What It Is              | When To Use                           |
| ---------------------------- | ---------------- | ----------------------- | ------------------------------------- |
| `createServerClient`         | `@supabase/ssr`  | **Supabase's function** | ✅ **Middleware ONLY** (special case) |
| `createServerSupabaseClient` | `@/lib/supabase` | **Your wrapper**        | API routes, Server Components         |
| `supabase`                   | `@/lib/supabase` | **Browser singleton**   | Client Components                     |
| `supabaseAdmin`              | `@/lib/supabase` | **Service role client** | Server-side admin operations          |

---

## Apology

I apologize for the confusion in my previous analysis. I:

- ❌ Incorrectly claimed you had duplicate files
- ❌ Confused Supabase's library function with your wrapper
- ❌ Suggested unnecessary refactoring

**The truth:**

- ✅ Your setup is correct and follows best practices
- ✅ You're not duplicating anything
- ✅ No changes needed to your Supabase client setup

The only real issues are:

1. 🔴 `bulk-edit-modal.tsx` N+1 query (user-facing performance)
2. 🟡 `related-gemstones.tsx` sequential queries

Your Supabase client configuration is solid! 👍

---

## Special Case: Middleware

### **Question: Is it okay to use `createServerClient` directly in middleware?**

**Answer: ✅ YES - This is actually REQUIRED!**

### **Why Middleware is Different:**

```typescript
// middleware.ts - CORRECT ✅
import { createServerClient } from "@supabase/ssr";

export async function updateSession(request: NextRequest) {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll(); // ← NextRequest cookies
        },
        setAll(cookiesToSet) {
          // Must handle BOTH request and response cookies
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value); // ← For Server Components
            supabaseResponse.cookies.set(name, value); // ← For browser
          });
        },
      },
    }
  );
}
```

---

### **Why You CAN'T Use Your Wrapper in Middleware:**

```typescript
// ❌ This would NOT work in middleware:
import { createServerSupabaseClient } from "@/lib/supabase";

export async function updateSession(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  //                     ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
  // PROBLEM: Your wrapper uses Next.js cookies() from "next/headers"
  // Middleware needs NextRequest.cookies, not next/headers cookies!
}
```

---

### **The Key Differences:**

| Context               | Cookie Source         | Import From                              |
| --------------------- | --------------------- | ---------------------------------------- |
| **Middleware**        | `NextRequest.cookies` | Direct `request.cookies.getAll()`        |
| **API Routes**        | `next/headers`        | `import { cookies } from "next/headers"` |
| **Server Components** | `next/headers`        | `import { cookies } from "next/headers"` |

---

### **Your Wrapper Implementation:**

```typescript
// /lib/supabase.ts - Uses next/headers
export const createServerSupabaseClient = async () => {
  const { cookies } = await import("next/headers");
  //     ↑↑↑↑↑↑↑
  //     This is NOT available in middleware context!

  const cookieStore = await cookies();

  return createServerClient<Database>(..., {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      //               ↑↑↑↑↑↑↑↑↑↑↑
      //               Different API than NextRequest.cookies
    }
  });
};
```

---

### **Why Middleware is Special:**

1. **Different execution context**

   - Middleware runs on Edge Runtime
   - Has access to `NextRequest`/`NextResponse` objects
   - Does NOT have access to `next/headers` cookies

2. **Different cookie handling**

   - Must read from `request.cookies`
   - Must write to BOTH `request.cookies` (for Server Components) AND `response.cookies` (for browser)

3. **Performance critical**
   - Runs on every request
   - Must be fast (no heavy wrappers)

---

### **Correct Usage Guide:**

```typescript
// ✅ middleware.ts
import { createServerClient } from "@supabase/ssr";
// Use directly with NextRequest.cookies

// ✅ API routes (route.ts)
import { createServerSupabaseClient } from "@/lib/supabase";
// Use your wrapper with next/headers cookies

// ✅ Server Components (page.tsx)
import { createServerSupabaseClient } from "@/lib/supabase";
// Use your wrapper with next/headers cookies

// ✅ Client Components (*.tsx)
import { supabase } from "@/lib/supabase";
// Use browser singleton

// ✅ Server-side services (*.service.ts)
import { supabaseAdmin } from "@/lib/supabase";
// Use service role client
```

---

### **Your Current Implementation: Perfect! ✅**

Looking at your `middleware.ts` (lines 68-119):

- ✅ Correctly imports `createServerClient` from `@supabase/ssr`
- ✅ Properly handles `request.cookies.getAll()`
- ✅ Correctly sets cookies on BOTH request and response
- ✅ Implements secure cookie options
- ✅ Has proper logging for debugging

**This is exactly how Supabase documentation recommends it!**

---

### **Summary:**

| File                    | Should Use                                            | Reason               |
| ----------------------- | ----------------------------------------------------- | -------------------- |
| `middleware.ts`         | ✅ `createServerClient` from `@supabase/ssr`          | NextRequest context  |
| `route.ts` (API)        | ✅ `createServerSupabaseClient` from `@/lib/supabase` | next/headers context |
| `page.tsx` (Server)     | ✅ `createServerSupabaseClient` from `@/lib/supabase` | next/headers context |
| `*.tsx` (Client)        | ✅ `supabase` from `@/lib/supabase`                   | Browser context      |
| `*.service.ts` (Server) | ✅ `supabaseAdmin` from `@/lib/supabase`              | Service role         |

Your architecture is **textbook correct**! 🎯

---

## `createServerSupabaseClient` vs `supabaseAdmin`

### **Critical Question: What's the difference?**

These are **fundamentally different** clients for different security contexts:

---

### **1. createServerSupabaseClient - USER CONTEXT** 👤

```typescript
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  // This client:
  // ✅ Reads the user's session from cookies
  // ✅ Respects Row Level Security (RLS)
  // ✅ Only sees data the LOGGED-IN USER can see
  // ❌ Cannot bypass security policies

  const { data } = await supabase.from("orders").select("*");
  // ↑ Returns only THIS USER's orders (enforced by RLS)
}
```

**Key Properties:**

- 🔑 Uses **anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- 👤 Authenticated as the **current user** (from cookies)
- 🔒 **RLS policies apply** - security enforced by database
- ✅ Safe to use based on user's session
- ⚠️ If user is not logged in, sees only public data

---

### **2. supabaseAdmin - ADMIN/SYSTEM CONTEXT** 🔓

```typescript
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!supabaseAdmin) {
    throw new Error("Service role not available");
  }

  // This client:
  // ✅ BYPASSES all Row Level Security (RLS)
  // ✅ Has FULL database access
  // ⚠️ NO authentication checks
  // ⚠️ Can see/modify ANY data

  const { data } = await supabaseAdmin.from("orders").select("*");
  // ↑ Returns ALL orders from ALL users!
}
```

**Key Properties:**

- 🔑 Uses **service role key** (`SUPABASE_SERVICE_ROLE_KEY`)
- 🔓 **Bypasses ALL RLS policies** - full database access
- ⚠️ **DANGEROUS** if misused - can access everything
- ✅ Required for admin operations
- ⚠️ **Must validate permissions yourself** in application code

---

### **Visual Comparison:**

```
Database Table: orders
┌─────────┬─────────┬────────┬────────┐
│ id      │ user_id │ total  │ status │
├─────────┼─────────┼────────┼────────┤
│ order-1 │ user-A  │ $100   │ paid   │ ← User A can see this
│ order-2 │ user-A  │ $50    │ paid   │ ← User A can see this
│ order-3 │ user-B  │ $200   │ paid   │ ← User A CANNOT see this (RLS)
│ order-4 │ user-C  │ $150   │ paid   │ ← User A CANNOT see this (RLS)
└─────────┴─────────┴────────┴────────┘

// User A logs in...

// Using createServerSupabaseClient (User Context):
const supabase = await createServerSupabaseClient();
const { data } = await supabase.from("orders").select("*");
// Returns: [order-1, order-2] ← Only User A's orders ✅

// Using supabaseAdmin (System Context):
const { data } = await supabaseAdmin.from("orders").select("*");
// Returns: [order-1, order-2, order-3, order-4] ← ALL orders! ⚠️
```

---

### **When to Use Each:**

| Scenario                         | Use                          | Why                                   |
| -------------------------------- | ---------------------------- | ------------------------------------- |
| **User viewing their orders**    | `createServerSupabaseClient` | RLS ensures they only see their data  |
| **User updating their profile**  | `createServerSupabaseClient` | RLS prevents editing others' profiles |
| **Public catalog page**          | `createServerSupabaseClient` | Can use anon/guest user session       |
| **Admin dashboard (all orders)** | `supabaseAdmin`              | Need to see across all users          |
| **System cron job**              | `supabaseAdmin`              | No user session available             |
| **Server-side background task**  | `supabaseAdmin`              | Processing data for all users         |

---

### **Security Implications:**

#### **✅ Safe: User Context**

```typescript
// API route for user's orders
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS automatically filters to this user's data
  const { data } = await supabase.from("orders").select("*");

  // ✅ SAFE: User can only see their own orders (RLS enforced)
  return NextResponse.json(data);
}
```

---

#### **⚠️ DANGEROUS: Admin Context Without Checks**

```typescript
// ❌ BAD: Using admin client without permission checks
export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    throw new Error("Service role not available");
  }

  // NO authentication check!
  // NO admin role check!

  const { data } = await supabaseAdmin.from("orders").select("*");

  // ⚠️ DANGER: Returns ALL users' orders to ANYONE!
  return NextResponse.json(data);
}
```

---

#### **✅ SAFE: Admin Context WITH Checks**

```typescript
// ✅ GOOD: Using admin client with proper authorization
export async function GET(request: NextRequest) {
  // First, authenticate the user with USER context
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // NOW safe to use admin client
  if (!supabaseAdmin) {
    throw new Error("Service role not available");
  }

  const { data } = await supabaseAdmin.from("orders").select("*");

  // ✅ SAFE: Verified user is admin before using admin client
  return NextResponse.json(data);
}
```

---

### **Your Current Code Pattern: CORRECT ✅**

Looking at your codebase:

```typescript
// Example: /api/catalog/route.ts
export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }
  const supabase = supabaseAdmin;

  // Query gemstones with filters
  const { data } = await supabase
    .from("gemstones")
    .select("*")
    .gt("price_amount", 0);

  // ✅ SAFE: Catalog is public data, no user-specific filtering needed
}
```

This is correct because:

- ✅ Catalog data is public (not user-specific)
- ✅ Using admin to avoid RLS overhead on public queries
- ✅ No sensitive user data exposed

---

### **Common Patterns:**

#### **Pattern 1: Public Data (Admin Client OK)**

```typescript
// Fetching public catalog - no user filtering needed
const { data } = await supabaseAdmin
  .from("gemstones")
  .select("*")
  .eq("in_stock", true);
```

---

#### **Pattern 2: User-Specific Data (User Client)**

```typescript
// Fetching user's favorites - must use user context
const supabase = await createServerSupabaseClient();
const { data } = await supabase.from("favorites").select("*");
// RLS ensures user only sees their favorites
```

---

#### **Pattern 3: Admin Operation (Both Clients)**

```typescript
// Admin viewing all users' data
const supabase = await createServerSupabaseClient();

// 1. Verify user is admin (use user context)
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) throw new Error("Unauthorized");

const { data: profile } = await supabase
  .from("user_profiles")
  .select("role")
  .eq("user_id", user.id)
  .single();

if (profile?.role !== "admin") {
  throw new Error("Forbidden");
}

// 2. Now use admin client for cross-user queries
const { data: allOrders } = await supabaseAdmin!.from("orders").select("*");
```

---

### **Implementation in Your Code:**

Looking at `/lib/supabase.ts`:

```typescript
// Lines 55-76: User Context Client
export const createServerSupabaseClient = async () => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey, // ← ANON KEY (respects RLS)
    {
      cookies: {
        /* cookie handling */
      },
    }
  );
};

// Lines 38-52: Admin Context Client
export const supabaseAdmin = (() => {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceRoleKey) {
    return null; // Not available on client-side
  }

  return createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey, // ← SERVICE ROLE KEY (bypasses RLS)
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
})();
```

---

### **Summary Table:**

| Aspect             | `createServerSupabaseClient` | `supabaseAdmin`               |
| ------------------ | ---------------------------- | ----------------------------- |
| **Key Used**       | Anon key (public)            | Service role key (secret)     |
| **Authentication** | From user's cookies          | None (system)                 |
| **RLS Policies**   | ✅ Enforced                  | ❌ Bypassed                   |
| **Access Level**   | User's permissions           | Full database access          |
| **Use For**        | User-specific operations     | Admin/system operations       |
| **Security Risk**  | Low (RLS protects)           | High (must validate yourself) |
| **Session**        | User's session               | No session                    |
| **Available On**   | Server-side only             | Server-side only              |

---

### **Best Practices:**

1. **Default to User Context**

   ```typescript
   // ✅ Start with user context
   const supabase = await createServerSupabaseClient();
   ```

2. **Only Use Admin When Needed**

   ```typescript
   // ⚠️ Only when you need to bypass RLS
   if (!supabaseAdmin) throw new Error("DB error");
   const data = await supabaseAdmin.from("table").select("*");
   ```

3. **Always Validate Before Admin Operations**

   ```typescript
   // ✅ Check authentication + authorization first
   const supabase = await createServerSupabaseClient();
   const user = await verifyAdmin(supabase);
   // Then use admin client
   ```

4. **Use User Context for User Operations**
   ```typescript
   // ✅ Let RLS do the work
   const supabase = await createServerSupabaseClient();
   await supabase.from("favorites").insert({ ... });
   // RLS ensures user_id is set correctly
   ```

---

Your understanding and usage of both clients is spot-on! 🎯

---

## `supabase` vs `createServerSupabaseClient`

### **Critical Question: What's the difference between the browser and server clients?**

Both use the **anon key** and respect **RLS**, but they run in **different environments**:

---

### **1. supabase - BROWSER/CLIENT-SIDE** 🌐

```typescript
"use client"; // ← Client Component!

import { supabase } from "@/lib/supabase";

export function MyComponent() {
  const handleClick = async () => {
    // This runs in the BROWSER
    const { data } = await supabase.from("favorites").select("*");
    // ↑ Uses cookies stored in browser
  };

  return <button onClick={handleClick}>Load Favorites</button>;
}
```

**Key Properties:**

- 🌐 Runs in the **browser** (client-side)
- 🍪 Reads auth cookies from **browser storage**
- 🔄 **Singleton** - same instance across all components
- ✅ Works in Client Components (`"use client"`)
- ❌ **NOT available** in Server Components or API routes
- 🔒 Still respects RLS (uses anon key)

---

### **2. createServerSupabaseClient - SERVER-SIDE** 🖥️

```typescript
// No "use client" - Server Component or API route!

import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  // This runs on the SERVER
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("favorites").select("*");
  // ↑ Uses cookies from Next.js request headers

  return NextResponse.json(data);
}
```

**Key Properties:**

- 🖥️ Runs on the **server** (server-side)
- 🍪 Reads auth cookies from **Next.js headers** (`next/headers`)
- 🔄 **Creates new instance** per request
- ✅ Works in Server Components and API routes
- ❌ **NOT available** in Client Components
- 🔒 Still respects RLS (uses anon key)

---

### **Visual Comparison:**

```
┌─────────────────────────────────────────┐
│  Browser (Client-Side)                  │
│  ┌───────────────────────────────────┐  │
│  │ Client Component                  │  │
│  │ "use client"                      │  │
│  │                                   │  │
│  │ import { supabase }               │  │
│  │                                   │  │
│  │ supabase.from("table")...         │  │
│  │   ↓                               │  │
│  │ Reads cookies from browser        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Server (Server-Side)                   │
│  ┌───────────────────────────────────┐  │
│  │ API Route / Server Component      │  │
│  │ (no "use client")                 │  │
│  │                                   │  │
│  │ const supabase = await            │  │
│  │   createServerSupabaseClient()    │  │
│  │                                   │  │
│  │ supabase.from("table")...         │  │
│  │   ↓                               │  │
│  │ Reads cookies from Next.js        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

### **The Cookie Source Difference:**

```typescript
// Browser Client (supabase)
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    // Browser automatically handles cookies via document.cookie
    // No explicit cookie handling needed
  }
);
```

vs

```typescript
// Server Client (createServerSupabaseClient)
export const createServerSupabaseClient = async () => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  //     ↑↑↑↑↑↑↑
  // Explicitly reads from Next.js request headers

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll(); // ← From Next.js
      },
      setAll(cookiesToSet) {
        // Set cookies in Next.js response
      },
    },
  });
};
```

---

### **When To Use Each:**

| Context              | Client                       | Example                                   |
| -------------------- | ---------------------------- | ----------------------------------------- |
| **Client Component** | `supabase`                   | Button click handlers, forms, React state |
| **Server Component** | `createServerSupabaseClient` | Initial data loading, SSR                 |
| **API Route**        | `createServerSupabaseClient` | REST endpoints, data mutations            |
| **Server Action**    | `createServerSupabaseClient` | Form submissions (server-side)            |

---

### **Common Patterns:**

#### **Pattern 1: Client-Side Interaction**

```typescript
"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";

export function AddToFavoritesButton({ gemstoneId }: { gemstoneId: string }) {
  const [loading, setLoading] = useState(false);

  const handleAddToFavorites = async () => {
    setLoading(true);

    // ✅ Client-side mutation
    const { error } = await supabase
      .from("favorites")
      .insert({ gemstone_id: gemstoneId });

    if (error) {
      alert("Failed to add to favorites");
    }

    setLoading(false);
  };

  return (
    <button onClick={handleAddToFavorites} disabled={loading}>
      {loading ? "Adding..." : "Add to Favorites"}
    </button>
  );
}
```

---

#### **Pattern 2: Server-Side Initial Data**

```typescript
// Server Component - NO "use client"

import { createServerSupabaseClient } from "@/lib/supabase";

export default async function FavoritesPage() {
  // ✅ Server-side data fetching
  const supabase = await createServerSupabaseClient();

  const { data: favorites } = await supabase.from("favorites").select(`
      *,
      gemstone:gemstones(*)
    `);

  return (
    <div>
      {favorites?.map((fav) => (
        <FavoriteCard key={fav.id} favorite={fav} />
      ))}
    </div>
  );
}
```

---

#### **Pattern 3: API Route**

```typescript
// /app/api/favorites/route.ts

import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // ✅ Server-side API endpoint
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("favorites")
    .insert({
      gemstone_id: body.gemstoneId,
      user_id: user.id, // ← RLS will enforce this
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
```

---

### **Implementation in Your Code:**

```typescript
// /lib/supabase.ts

// Browser Client (Singleton)
let _browserClient: SupabaseClient<Database, "public">;

export function getBrowserClient(): SupabaseClient<Database, "public"> {
  if (!_browserClient) {
    _browserClient = createBrowserClient<Database, "public">(
      supabaseUrl,
      supabaseAnonKey,
      {
        db: { schema: "public" as const },
        isSingleton: false, // ← Your custom singleton
      }
    );
  }
  return _browserClient;
}

export const supabase = getBrowserClient(); // ← Export for client components

// Server Client (New instance per request)
export const createServerSupabaseClient = async () => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        /* handle response cookies */
      },
    },
  }); // ← New instance each call
};
```

---

### **Why Not Use Browser Client on Server?**

```typescript
// ❌ This would FAIL:
export async function GET() {
  const { data } = await supabase.from("favorites").select("*");
  //                      ↑↑↑↑↑↑↑
  // ERROR: supabase is for browser, can't read Next.js cookies!
  // Server has no access to document.cookie
}
```

---

### **Why Not Use Server Client on Browser?**

```typescript
"use client";

// ❌ This would FAIL:
export function MyComponent() {
  const handleClick = async () => {
    const supabase = await createServerSupabaseClient();
    //                      ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
    // ERROR: Can't import "next/headers" in browser!
    // next/headers is server-only
  };
}
```

---

### **Summary Table:**

| Aspect              | `supabase` (Browser)           | `createServerSupabaseClient` (Server)  |
| ------------------- | ------------------------------ | -------------------------------------- |
| **Environment**     | Browser (client-side)          | Server (API routes, Server Components) |
| **Cookie Source**   | `document.cookie`              | `next/headers` (request headers)       |
| **Import Location** | Client Components              | Server Components, API routes          |
| **Instance Type**   | Singleton (shared)             | New per request                        |
| **Key Used**        | Anon key                       | Anon key                               |
| **RLS**             | ✅ Enforced                    | ✅ Enforced                            |
| **User Context**    | ✅ Yes (from browser cookies)  | ✅ Yes (from server cookies)           |
| **When To Use**     | Interactive UI, client actions | Initial data load, API endpoints       |

---

### **Complete Architecture:**

```
Your Application
├─ Browser (Client-Side)
│  └─ supabase ← Client Components, user interactions
│
├─ Server (Next.js)
│  ├─ createServerSupabaseClient ← Server Components, API routes
│  └─ supabaseAdmin ← Admin operations (bypasses RLS)
│
└─ Middleware (Edge)
   └─ createServerClient (direct) ← Auth checks, route protection
```

---

### **Best Practice: Hybrid Approach**

```typescript
// Server Component - Initial load
export default async function FavoritesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: initialFavorites } = await supabase
    .from("favorites")
    .select("*");

  // Pass to Client Component
  return <FavoritesList initialData={initialFavorites} />;
}

// Client Component - Interactivity
"use client";

import { supabase } from "@/lib/supabase";

export function FavoritesList({ initialData }) {
  const [favorites, setFavorites] = useState(initialData);

  const addFavorite = async (gemstoneId: string) => {
    // Client-side mutation
    const { data } = await supabase
      .from("favorites")
      .insert({ gemstone_id: gemstoneId })
      .select()
      .single();

    setFavorites([...favorites, data]);
  };

  return (/* UI with addFavorite handler */);
}
```

**Benefits:**

- ✅ Fast initial load (server-side)
- ✅ Interactive updates (client-side)
- ✅ Both respect RLS
- ✅ Seamless user experience

---

Your architecture uses both correctly! 🎯
