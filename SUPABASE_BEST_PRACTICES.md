# 🏗️ Supabase Best Practices - Clean Code Guidelines

**Date:** October 14, 2025  
**Status:** 📚 Reference Guide  
**Scope:** ~350 Supabase calls across codebase

---

## **Current Issues & Solutions**

### **Issue 1: Null Check Pattern** ⚠️

**Problem:**

```typescript
const supabase = supabaseAdmin;  // Can be null!
const { data } = await supabase.from("table")...  // ❌ TypeScript error
```

**Current Approach (Inconsistent):**

```typescript
// ✅ GOOD: Check at method start
if (!supabaseAdmin) {
  throw new Error("Database connection failed");
}
const supabase = supabaseAdmin;

// ❌ BAD: Re-assign without check
const supabase = supabaseAdmin;  // Can still be null!
await supabase.from(...)
```

---

## **Best Practices for Supabase Calls**

### **1. Guard Pattern (Preferred)** ✅

**Use this for service layer methods:**

```typescript
class MyService {
  static async getData() {
    // Guard at the start
    if (!supabaseAdmin) {
      throw new Error("Database connection failed");
    }

    // Now TypeScript knows it's not null
    const { data, error } = await supabaseAdmin.from("table").select("*");

    if (error) {
      throw new Error(`Failed: ${error.message}`);
    }

    return data;
  }
}
```

**Benefits:**

- ✅ Single check at method start
- ✅ TypeScript knows it's safe after guard
- ✅ Fail fast with clear error
- ✅ No redundant checks

---

### **2. Non-Null Assertion (Use Sparingly)** ⚠️

**Only when you're 100% certain:**

```typescript
// Only in private methods after public method already checked
private static async fetchImages(ids: string[]) {
  // Parent method already validated supabaseAdmin
  const { data } = await supabaseAdmin!
    .from("gemstone_images")
    .select("*")
    .in("id", ids);

  return data;
}
```

**When to use:**

- ✅ Private methods where caller validates
- ✅ After explicit null check in same scope
- ❌ Never in public API methods
- ❌ Never without documenting why it's safe

---

### **3. Graceful Degradation Pattern** 🛡️

**For non-critical operations:**

```typescript
private static async buildSearchResponse(data: any[]) {
  // Critical check at start
  if (!supabaseAdmin) {
    console.error("supabaseAdmin is null, returning without images");
    // Return degraded response instead of failing
    return data.map(row => ({
      ...row,
      images: [], // Empty but valid
    }));
  }

  // Fetch optional enhancement
  const { data: images } = await supabaseAdmin
    .from("gemstone_images")
    .select("*");

  return data.map(row => ({
    ...row,
    images: images?.filter(img => img.gemstone_id === row.id) || [],
  }));
}
```

**When to use:**

- ✅ Optional enhancements (images, metadata)
- ✅ Fallback data available
- ✅ User experience shouldn't break
- ❌ Critical data (user auth, payments)

---

## **Current Codebase Audit**

### **Pattern Distribution (Estimated):**

| Pattern                | Count | Usage                | Quality    |
| ---------------------- | ----- | -------------------- | ---------- |
| **Guard at start**     | ~200  | Services, API routes | ✅ Good    |
| **No check + assign**  | ~100  | Legacy code          | ❌ Bad     |
| **Non-null assertion** | ~30   | Private methods      | ⚠️ Risky   |
| **Inline checks**      | ~20   | Scattered            | ⚠️ Verbose |

---

## **Recommended Refactoring**

### **Priority 1: Service Layer** 🔴

**Current Issues:**

```typescript
// ❌ BAD: Multiple checks
class SearchService {
  static async method1() {
    if (!supabaseAdmin) throw new Error();
    const supabase = supabaseAdmin; // Unnecessary
    // ...
  }

  static async method2() {
    if (!supabaseAdmin) throw new Error();
    const supabase = supabaseAdmin; // Duplicate pattern
    // ...
  }
}
```

**Recommended Pattern:**

```typescript
// ✅ GOOD: Consistent guard pattern
class SearchService {
  /**
   * Guard helper - call at start of every public method
   */
  private static ensureConnection() {
    if (!supabaseAdmin) {
      throw new Error("Database connection failed");
    }
  }

  static async method1() {
    this.ensureConnection();
    // Now supabaseAdmin is safe to use
    const { data } = await supabaseAdmin.from("table")...
  }

  static async method2() {
    this.ensureConnection();
    // Consistent pattern across all methods
    const { data } = await supabaseAdmin.from("table")...
  }
}
```

---

### **Priority 2: Query Optimization** 🚀

**Current Issues:**

```typescript
// ❌ BAD: N+1 query problem
for (const gemstone of gemstones) {
  const { data: images } = await supabase
    .from("gemstone_images")
    .eq("gemstone_id", gemstone.id);
  gemstone.images = images;
}
```

**Best Practice:**

```typescript
// ✅ GOOD: Single query with IN clause
const gemstoneIds = gemstones.map((g) => g.id);
const { data: allImages } = await supabase
  .from("gemstone_images")
  .in("gemstone_id", gemstoneIds);

// Group by gemstone_id
const imagesByGemstone = new Map();
allImages?.forEach((img) => {
  if (!imagesByGemstone.has(img.gemstone_id)) {
    imagesByGemstone.set(img.gemstone_id, []);
  }
  imagesByGemstone.get(img.gemstone_id).push(img);
});

// Assign to gemstones
gemstones.forEach((g) => {
  g.images = imagesByGemstone.get(g.id) || [];
});
```

---

### **Priority 3: Error Handling** 🛡️

**Current Issues:**

```typescript
// ❌ BAD: Silent failures
const { data, error } = await supabase.from("table").select("*");
if (error) console.error(error); // But then what?
return data; // Might be null!
```

**Best Practice:**

```typescript
// ✅ GOOD: Explicit error handling
const { data, error } = await supabase.from("table").select("*");

if (error) {
  console.error("[ServiceName] Operation failed:", error);

  // Decision tree:
  // 1. Critical data? Throw
  if (isCritical) {
    throw new Error(`Failed to fetch critical data: ${error.message}`);
  }

  // 2. Has fallback? Return default
  if (hasFallback) {
    return defaultData;
  }

  // 3. Can continue? Return empty
  return [];
}

// Validate data
if (!data) {
  console.warn("[ServiceName] Query returned null data");
  return [];
}

return data;
```

---

## **Optimization Patterns**

### **Pattern 1: Batch Operations** 📦

**Problem:**

```typescript
// ❌ 100 queries!
for (const id of userIds) {
  await updateUser(id);
}
```

**Solution:**

```typescript
// ✅ 1 query!
await supabase
  .from("users")
  .upsert(userIds.map((id) => ({ id, updated: true })));
```

---

### **Pattern 2: Parallel Fetching** ⚡

**Problem:**

```typescript
// ❌ Sequential (slow)
const users = await fetchUsers();
const products = await fetchProducts();
const orders = await fetchOrders();
```

**Solution:**

```typescript
// ✅ Parallel (fast)
const [users, products, orders] = await Promise.all([
  fetchUsers(),
  fetchProducts(),
  fetchOrders(),
]);
```

---

### **Pattern 3: Select Only What You Need** 🎯

**Problem:**

```typescript
// ❌ Fetches everything
const { data } = await supabase.from("gemstones").select("*");
```

**Solution:**

```typescript
// ✅ Specific columns
const { data } = await supabase
  .from("gemstones")
  .select("id, name, price_amount, images:gemstone_images(image_url)");
```

---

### **Pattern 4: Use RPC for Complex Queries** 🔧

**Problem:**

```typescript
// ❌ Multiple round trips
const gemstones = await fetchGemstones();
const filtered = gemstones.filter((g) => complexLogic(g));
const sorted = filtered.sort(compareFunction);
```

**Solution:**

```typescript
// ✅ Single RPC call with PostgreSQL logic
const { data } = await supabase.rpc("search_gemstones_fulltext", {
  search_query: query,
  filters: filters,
  page_num: page,
  page_size: pageSize,
});
```

**Benefits:**

- ✅ Database does the heavy lifting
- ✅ Pagination at DB level
- ✅ Complex filtering without N+1 queries
- ✅ Better performance

---

## **Clean Code Principles**

### **1. Single Responsibility** 📋

**Problem:**

```typescript
// ❌ Method does too much
async function handleSearch() {
  // Validate input
  // Call database
  // Transform data
  // Fetch images
  // Format response
  // Log analytics
}
```

**Solution:**

```typescript
// ✅ Separated concerns
class SearchService {
  static async searchGemstones(request: SearchRequest) {
    const validated = this.validateRequest(request);
    const rawData = await this.queryDatabase(validated);
    const enriched = await this.enrichWithImages(rawData);
    return this.formatResponse(enriched);
  }

  private static validateRequest(request: SearchRequest) {
    /* ... */
  }
  private static async queryDatabase(request: ValidatedRequest) {
    /* ... */
  }
  private static async enrichWithImages(data: RawData[]) {
    /* ... */
  }
  private static formatResponse(data: EnrichedData[]) {
    /* ... */
  }
}
```

---

### **2. DRY (Don't Repeat Yourself)** 🔁

**Problem:**

```typescript
// ❌ Duplicate null checks everywhere
async function method1() {
  if (!supabaseAdmin) throw new Error("DB failed");
  // ...
}

async function method2() {
  if (!supabaseAdmin) throw new Error("DB failed");
  // ...
}
```

**Solution:**

```typescript
// ✅ Centralized guard
class BaseService {
  protected static ensureConnection() {
    if (!supabaseAdmin) {
      throw new Error("Database connection failed");
    }
  }
}

class SearchService extends BaseService {
  static async method1() {
    this.ensureConnection();
    // ...
  }

  static async method2() {
    this.ensureConnection();
    // ...
  }
}
```

---

### **3. Explicit Error Types** 🎯

**Current:**

```typescript
// ❌ Generic errors
throw new Error("Something went wrong");
```

**Better:**

```typescript
// ✅ Specific error classes
class DatabaseConnectionError extends Error {
  constructor(operation: string) {
    super(`Database connection failed during ${operation}`);
    this.name = "DatabaseConnectionError";
  }
}

class QueryError extends Error {
  constructor(table: string, operation: string, details: string) {
    super(`Query failed: ${table}.${operation} - ${details}`);
    this.name = "QueryError";
  }
}

// Usage
if (!supabaseAdmin) {
  throw new DatabaseConnectionError("search");
}

if (error) {
  throw new QueryError("gemstones", "select", error.message);
}
```

---

## **Recommended Action Plan**

### **Phase 1: Critical Fixes** 🔴 (High Priority)

1. **Fix null check pattern** (1-2 hours)

   - Add `ensureConnection()` to all service classes
   - Remove redundant `const supabase = supabaseAdmin` assignments
   - **Files:** `search.service.ts`, `gemstone-fetch.service.ts`

2. **Fix N+1 queries** (2-3 hours)
   - Audit for loops with await
   - Replace with batch queries
   - **Impact:** 10-100x performance improvement

### **Phase 2: Optimization** 🚀 (Medium Priority)

3. **Implement batch operations** (3-4 hours)

   - Identify sequential queries that can be parallel
   - Use `Promise.all()` for independent fetches
   - **Impact:** 2-5x faster page loads

4. **Optimize SELECT queries** (2-3 hours)
   - Remove `SELECT *` where not needed
   - Use specific column lists
   - **Impact:** Reduced bandwidth, faster queries

### **Phase 3: Refactoring** 🏗️ (Low Priority)

5. **Create error hierarchy** (2-3 hours)

   - Define custom error classes
   - Consistent error handling
   - **Impact:** Better debugging, clearer logs

6. **Extract helper methods** (3-4 hours)
   - Common patterns to utilities
   - Reduce code duplication
   - **Impact:** Maintainability

---

## **Quick Wins** ⚡

### **Win 1: Add Connection Guard**

```typescript
// Add to every service class
private static ensureConnection(): asserts supabaseAdmin is NonNullable<typeof supabaseAdmin> {
  if (!supabaseAdmin) {
    throw new DatabaseConnectionError("service operation");
  }
}
```

### **Win 2: Replace Loops with Batch**

```typescript
// Before
for (const id of ids) {
  await updateRecord(id);
}

// After
await supabase.from("table").upsert(ids.map((id) => ({ id, updated: true })));
```

### **Win 3: Use Promise.all**

```typescript
// Before
const users = await fetchUsers();
const orders = await fetchOrders();

// After
const [users, orders] = await Promise.all([fetchUsers(), fetchOrders()]);
```

---

## **Monitoring & Metrics**

### **Add Query Logging**

```typescript
class QueryLogger {
  static async logQuery<T>(
    operation: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - start;
      console.log(`[DB] ${operation} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[DB] ${operation} failed after ${duration}ms:`, error);
      throw error;
    }
  }
}

// Usage
const data = await QueryLogger.logQuery("fetch_gemstones", () =>
  supabase.from("gemstones").select("*")
);
```

---

## **8. Architectural Questions & Answers**

### **Q1: Should Supabase calls be in API routes or services?**

**Short Answer:** 📚 **Services > API Routes** (with exceptions)

**The Rule of Thumb:**

```typescript
// ❌ BAD: Business logic in API route
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();

  // 50+ lines of query building, filtering, joining, transforming...
  const query = supabase.from("gemstones").select("*");

  if (filters.color) query = query.eq("color", filters.color);
  if (filters.priceMin) query = query.gte("price_amount", filters.priceMin);
  // ... 30 more lines ...

  const enrichedData = data.map((item) => ({
    /* complex transformation */
  }));

  return NextResponse.json(enrichedData);
}

// ✅ GOOD: Thin API route + thick service
export async function GET(request: NextRequest) {
  const filters = parseFilters(request);
  const data = await GemstoneService.getGemstones(filters);
  return NextResponse.json(data);
}
```

**When to use Services:**

| Scenario                | Use Service? | Why                    |
| ----------------------- | ------------ | ---------------------- |
| **Complex queries**     | ✅ Yes       | Reusable, testable     |
| **Business logic**      | ✅ Yes       | Single source of truth |
| **Data transformation** | ✅ Yes       | Consistent formatting  |
| **Multiple queries**    | ✅ Yes       | Transaction management |
| **Used in 2+ places**   | ✅ Yes       | DRY principle          |

**When API routes are acceptable:**

| Scenario                | Direct in Route? | Why                |
| ----------------------- | ---------------- | ------------------ |
| **Simple CRUD**         | ⚠️ Maybe         | If truly 1-2 lines |
| **Single-use endpoint** | ⚠️ Maybe         | If never reused    |
| **Auth-only logic**     | ✅ Yes           | Route-specific     |
| **Request validation**  | ✅ Yes           | HTTP layer concern |

**Current Codebase Example:**

```typescript
// ❌ Current: /api/catalog/route.ts (150+ lines of DB logic)
export async function GET(request: NextRequest) {
  const supabase = supabaseAdmin;
  let query = supabase.from("gemstones").select(/* 20 lines */);
  query = query.gt("price_amount", 0);
  if (filters.search) {
    /* ... */
  }
  if (filters.gemstoneTypes?.length) {
    /* ... */
  }
  // ... 100+ more lines ...
}

// ✅ Better: Move to GemstoneService
// /api/catalog/route.ts
export async function GET(request: NextRequest) {
  const filters = parseFilters(request);
  const result = await GemstoneService.getCatalog(filters);
  return NextResponse.json(result);
}

// /features/gemstones/services/gemstone-service.ts
export class GemstoneService {
  static async getCatalog(filters: GemstoneFilters) {
    // All the query logic here
  }
}
```

**Benefits of Service Layer:**

1. **Reusability:** Use from API routes, server actions, cron jobs
2. **Testing:** Mock services, not HTTP requests
3. **Type Safety:** Strong typing without HTTP concerns
4. **Composition:** Chain service methods easily
5. **Caching:** Add caching layer without touching routes

---

### **Q2: Is it okay to have duplicate Supabase calls in multiple places?**

**Short Answer:** ❌ **No, consolidate common queries into shared functions**

**The Problem:**

```typescript
// ❌ BAD: Same query in 5 different places

// File 1: search/services/search.service.ts
const { data: images } = await supabase
  .from("gemstone_images")
  .select("id, gemstone_id, image_url, is_primary, image_order")
  .in("gemstone_id", ids)
  .order("image_order", { ascending: true });

// File 2: catalog/services/catalog.service.ts
const { data: images } = await supabase
  .from("gemstone_images")
  .select("id, gemstone_id, image_url, is_primary, image_order")
  .in("gemstone_id", ids)
  .order("image_order", { ascending: true });

// File 3: admin/services/gemstone-admin-service.ts
const { data: images } = await supabase
  .from("gemstone_images")
  .select("id, gemstone_id, image_url, is_primary, image_order")
  .in("gemstone_id", ids)
  .order("image_order", { ascending: true });

// File 4: orders/services/order.service.ts
// ... same exact query ...

// File 5: cart/services/cart.service.ts
// ... same exact query ...
```

**Risks of Duplication:**

1. **Maintenance Nightmare:** Change image fields? Update 5 places
2. **Inconsistency:** Different devs modify queries differently
3. **Bug Propagation:** Fix a bug? Might miss 2 of 5 copies
4. **Performance Drift:** Optimize one, forget others
5. **Type Mismatches:** Different return types for same data

**The Solution:**

```typescript
// ✅ GOOD: Shared data access layer

// /features/gemstones/data-access/gemstone-images.da.ts
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Gemstone Images Data Access
 *
 * Centralized queries for gemstone_images table.
 * Single source of truth for image fetching logic.
 */
export class GemstoneImagesDA {
  /**
   * Fetch images for multiple gemstones (batch operation)
   * Returns Map for easy lookup
   */
  static async fetchImagesByGemstoneIds(
    gemstoneIds: string[]
  ): Promise<Map<string, GemstoneImage[]>> {
    if (!supabaseAdmin) {
      throw new Error("Database connection failed");
    }

    const { data, error } = await supabaseAdmin
      .from("gemstone_images")
      .select("id, gemstone_id, image_url, is_primary, image_order")
      .in("gemstone_id", gemstoneIds)
      .order("image_order", { ascending: true });

    if (error) {
      console.error("[GemstoneImagesDA] Fetch failed:", error);
      throw new Error(`Failed to fetch images: ${error.message}`);
    }

    // Group by gemstone_id
    const imagesByGemstone = new Map<string, GemstoneImage[]>();
    (data || []).forEach((img) => {
      if (!imagesByGemstone.has(img.gemstone_id)) {
        imagesByGemstone.set(img.gemstone_id, []);
      }
      imagesByGemstone.get(img.gemstone_id)!.push(img);
    });

    return imagesByGemstone;
  }

  /**
   * Fetch primary image for a single gemstone
   */
  static async fetchPrimaryImage(
    gemstoneId: string
  ): Promise<GemstoneImage | null> {
    if (!supabaseAdmin) {
      throw new Error("Database connection failed");
    }

    const { data, error } = await supabaseAdmin
      .from("gemstone_images")
      .select("*")
      .eq("gemstone_id", gemstoneId)
      .eq("is_primary", true)
      .single();

    if (error) {
      console.error("[GemstoneImagesDA] Primary image fetch failed:", error);
      return null;
    }

    return data;
  }
}

// Now use it everywhere:

// search/services/search.service.ts
import { GemstoneImagesDA } from "@/features/gemstones/data-access/gemstone-images.da";

const imagesByGemstone = await GemstoneImagesDA.fetchImagesByGemstoneIds(
  gemstoneIds
);

// catalog/services/catalog.service.ts
const imagesByGemstone = await GemstoneImagesDA.fetchImagesByGemstoneIds(
  gemstoneIds
);

// admin/services/gemstone-admin-service.ts
const imagesByGemstone = await GemstoneImagesDA.fetchImagesByGemstoneIds(
  gemstoneIds
);
```

**Recommended File Structure:**

```
src/
├── features/
│   ├── gemstones/
│   │   ├── services/           # Business logic
│   │   │   ├── gemstone.service.ts
│   │   │   └── catalog.service.ts
│   │   │
│   │   ├── data-access/        # 🆕 Data access layer
│   │   │   ├── gemstones.da.ts
│   │   │   ├── gemstone-images.da.ts
│   │   │   ├── certifications.da.ts
│   │   │   └── origins.da.ts
│   │   │
│   │   └── types/              # Shared types
│   │       └── gemstone.types.ts
│   │
│   ├── search/
│   │   ├── services/
│   │   └── data-access/        # 🆕 Search-specific queries
│   │       └── search.da.ts
│   │
│   └── orders/
│       ├── services/
│       └── data-access/        # 🆕 Order-specific queries
│           └── orders.da.ts
```

**Data Access Layer Pattern:**

```typescript
// Pattern: [Entity].da.ts

/**
 * [Entity] Data Access
 *
 * Low-level database queries for [table_name] table.
 * No business logic - pure data fetching.
 *
 * Rules:
 * - Always check supabaseAdmin
 * - Return raw data (minimal transformation)
 * - Handle errors consistently
 * - Optimize for batch operations
 */
export class EntityDA {
  // CRUD operations
  static async findById(id: string) {
    /* ... */
  }
  static async findMany(filters: Filters) {
    /* ... */
  }
  static async create(data: CreateDto) {
    /* ... */
  }
  static async update(id: string, data: UpdateDto) {
    /* ... */
  }
  static async delete(id: string) {
    /* ... */
  }

  // Common patterns
  static async fetchByIds(ids: string[]) {
    /* Batch fetch */
  }
  static async fetchWithRelations(id: string) {
    /* With joins */
  }
}
```

**When to create a Data Access method:**

| Criteria                     | Create DA Method?         |
| ---------------------------- | ------------------------- |
| Query used in 2+ files       | ✅ Yes                    |
| Complex join with 3+ tables  | ✅ Yes                    |
| Performance-sensitive query  | ✅ Yes                    |
| Table-specific logic         | ✅ Yes                    |
| One-off query in single file | ❌ No (inline acceptable) |

**Refactoring Priority:**

```typescript
// 1. HIGH PRIORITY: Identify most duplicated queries
// Run this search across codebase:
// grep -r "from(\"gemstone_images\")" src/

// 2. MEDIUM PRIORITY: Complex queries
// Queries with 5+ joins, filters, transformations

// 3. LOW PRIORITY: Simple CRUD
// Basic .select(), .insert() if not duplicated
```

---

## **Summary**

| Aspect               | Current State         | Target State             |
| -------------------- | --------------------- | ------------------------ |
| **Null Checks**      | Inconsistent          | Guard pattern everywhere |
| **Query Efficiency** | Some N+1              | All batched              |
| **Error Handling**   | Generic               | Typed & specific         |
| **Code Duplication** | High (~50 duplicates) | Minimal via DA layer     |
| **Architecture**     | Logic in API routes   | Services + Data Access   |
| **Performance**      | Good                  | Excellent                |

**Estimated Effort:** 20-25 hours  
**Expected Impact:** 2-10x performance improvement, significantly better maintainability

---

**Next Steps:**

1. Start with Phase 1 critical fixes
2. Apply patterns to new code immediately
3. Refactor existing code incrementally
4. Monitor query performance
