# Codebase Review Report

## Checklist

- Read accessible files and project configuration.
- Identify code issues, anti-patterns, and risks.
- Classify findings by severity (Critical, Major, Minor, Suggestion).
- Specify exact locations where possible.
- Summarize and recommend clear, actionable remediations.
- Note any inaccessible files or analysis errors.

## Summary

31 issues found in the codebase.

## Findings

1. Issue: Committed secrets in repository (.env.local)

   - File/Location: .env.local:1
   - Reason: Supabase service role key and OpenAI key are committed, creating immediate account compromise and data exfiltration risks.
   - Severity: Critical
   - Recommendation: Revoke and rotate all exposed keys immediately; purge from history if public; move secrets to environment config in Vercel; add secret scanning and pre-commit protections.

2. Issue: Client-side order creation directly against database

   - File/Location: src/features/cart/components/cart-page.tsx:108
   - Reason: `OrderService.createOrder` is invoked from a client component using the anon Supabase client to insert into orders/order_items and delete cart_items, enabling abuse and bypassing server-side validation/authorization.
   - Severity: Critical
   - Recommendation: Move order creation to a server route (`POST /api/orders`) with validation, RLS or server-side auth checks, idempotency, and stock reservation; block client from writing sensitive tables.

3. Issue: Admin orders API lacks admin authorization

   - File/Location: src/app/api/admin/orders/route.ts:1
   - Reason: Handler reads orders (including user details) without verifying the requester is an admin; potential data leakage via API.
   - Severity: Critical
   - Recommendation: Require admin session and role check before queries; prefer server-side Supabase with RLS policies reinforcing admin-only access; add tests for unauthorized access.

4. Issue: Overly permissive CSP (unsafe-inline/unsafe-eval)

   - File/Location: next.config.ts:24
   - Reason: `script-src 'unsafe-inline' 'unsafe-eval'` and broad `connect-src` (ws/wss) increase XSS and script injection risks.
   - Severity: Critical
   - Recommendation: Remove `unsafe-inline`/`unsafe-eval`; add nonce or hashes; restrict `connect-src` to required domains; align CSP with deployed headers (Vercel) and add automated verification.

5. Issue: Orders API unimplemented (returns 501)

   - File/Location: src/app/api/orders/route.ts:1
   - Reason: Both GET and POST return “not implemented,” breaking order flows and leading to client-side DB writes as a workaround.
   - Severity: Major
   - Recommendation: Implement `POST /api/orders` (validation, transaction, events) and `GET /api/orders` (authorized listing); wire cart to server API; deprecate direct DB writes from client.

6. Issue: Missing `GET /api/orders/[id]` used by Order Details

   - File/Location: src/app/api/orders/[id]/route.ts (missing)
   - Reason: UI fetches `/api/orders/{id}` but no route exists; results in runtime failures.
   - Severity: Major
   - Recommendation: Add route with user/admin authorization; reuse `OrderService.getOrder`; return items, totals, timeline.

7. Issue: Service role client defined in shared module

   - File/Location: src/lib/supabase.ts:38
   - Reason: `supabaseAdmin` (service role) is defined alongside browser client in a shared module; while NEXT_PUBLIC gating prevents leak, best practice isolates server-only admin code to avoid accidental import/use on client.
   - Severity: Major
   - Recommendation: Move service role client to a server-only module (e.g., `src/lib/supabase-admin.ts`); update imports in API routes; enforce lint rule disallowing admin client in client code.

8. Issue: Inline theme script without CSP nonce

   - File/Location: src/app/layout.tsx:53
   - Reason: Uses `dangerouslySetInnerHTML` without nonce; blocked by strict CSP and increases risk if CSP loosened.
   - Severity: Major
   - Recommendation: Add nonce and CSP support, or replace with `next-themes`/CSS-first approach; avoid inline scripts.

9. Issue: ESLint disabled for production builds

   - File/Location: next.config.ts:6
   - Reason: `eslint.ignoreDuringBuilds: true` allows builds with lint errors, increasing production risk and tech debt.
   - Severity: Major
   - Recommendation: Enable ESLint in CI and production/staging builds; gate merges on clean lint.

10. Issue: Catalog API may unintentionally exclude items due to inner joins

    - File/Location: src/app/api/catalog/route.ts:64
    - Reason: `images:gemstone_images!inner` forces results to have images; combined with other inner joins, search may “miss” valid items.
    - Severity: Minor
    - Recommendation: Use left join by default; apply `hasImages` filter explicitly; document behavior.

11. Issue: Global search not implemented (UI affordance without behavior)

    - File/Location: src/shared/components/navigation/main-nav.tsx:210
    - Reason: Search icon is non-functional; only catalog-scoped search exists via filters.
    - Severity: Minor
    - Recommendation: Decide global search scope (sitewide vs catalog vs command palette) and implement locale-aware navigation or overlay with typeahead.

12. Issue: Orders events API comment mismatches implementation

    - File/Location: src/app/api/orders/[orderId]/events/route.ts:1
    - Reason: Comment says “uses service role,” but handler uses cookie-based anon client; potential confusion and misconfiguration risk.
    - Severity: Minor
    - Recommendation: Align comments with code; decide on client (admin vs anon + RLS) and document authorization strategy.

13. Issue: Broad `images.remotePatterns` and `connect-src` scope

    - File/Location: next.config.ts:16xw
    - Reason: `*.supabase.co` and broad `ws:/wss:` can widen attack surface and content injection risk.
    - Severity: Minor
    - Recommendation: Restrict to exact Supabase project host; limit connect targets to needed origins; review image sources and prefer CDN/proxy if feasible.

14. Issue: Duplication/confusion between server client modules

    - File/Location: src/lib/supabase.ts:1, src/lib/supabase-server.ts:1
    - Reason: Two server-side helper modules with overlapping purposes can cause inconsistent usage.
    - Severity: Suggestion
    - Recommendation: Consolidate into one clear server client API; standardize import paths and usage across routes.

15. Issue: Inconsistent locale-aware navigation (next/link vs i18n Link)

    - File/Location: src/shared/components/layout/footer.tsx:3; src/app/[locale]/page.tsx:5; src/features/gemstones/components/gemstone-catalog-optimized.tsx:24; src/app/not-found.tsx:1; src/app/[locale]/(public)/unauthorized/page.tsx:1
    - Reason: Mixing `next/link` with `@/i18n/navigation` `Link` can break locale prefixes, SEO hreflang correctness, and cause unexpected route behavior.
    - Severity: Major
    - Recommendation: Standardize on `@/i18n/navigation` `Link`, `useRouter`, and `usePathname` across all user-facing components; add an ESLint rule to forbid `next/link` in localized routes.

16. Issue: Client-side cart database writes rely on strict RLS

    - File/Location: src/features/cart/services/cart-service.ts:62, 147, 213, 258, 331, 384, 537 (multiple `.from("cart_items")` mutations)
    - Reason: Writing to `cart_items` from the browser is acceptable only with robust RLS policies; otherwise risk of cross-user access or tampering.
    - Severity: Major
    - Recommendation: Verify RLS: all `cart_items` operations must scope by `auth.uid()`; consider moving mutations to server routes with additional validation and rate limiting; add tests asserting RLS enforcement.

17. Issue: Public Catalog API uses service role client

    - File/Location: src/app/api/catalog/route.ts:1
    - Reason: Using `supabaseAdmin` for public, read-mostly data broadens blast radius if token leaks and bypasses table RLS entirely.
    - Severity: Major
    - Recommendation: Prefer anon client + RLS for public reads, or expose a security-definer RPC limited to necessary columns; keep service role for admin-only and background jobs.

18. Issue: Excessive console logging in client and services

    - File/Location: src/features/cart/services/cart-service.ts:20+, src/features/auth/context/auth-context.tsx:31+, src/shared/components/navigation/main-nav.tsx:33+
    - Reason: Verbose logs in production can leak PII and hurt performance; logs are inconsistent with the `Logger` abstraction.
    - Severity: Minor
    - Recommendation: Strip or guard console logs behind `NODE_ENV==='development'`; use a centralized logger (server only) with redaction and sampling.

19. Issue: Lack of API rate limiting and abuse protection

    - File/Location: Location not specified (applies to write endpoints: chat, orders, cart if serverized)
    - Reason: Missing rate limiting allows brute force and abuse; can increase costs and degrade availability.
    - Severity: Major
    - Recommendation: Add per-IP/user rate limiting (e.g., Upstash Redis, Vercel Edge, or Supabase functions), request size limits, and CAPTCHA where appropriate.

20. Issue: Missing HTTP caching headers/ISR for catalog responses

    - File/Location: src/app/api/catalog/route.ts:1
    - Reason: No `Cache-Control`/SWR headers; server does all work on each request; only client in-memory cache exists.
    - Severity: Minor
    - Recommendation: Set `Cache-Control` headers (e.g., `public, max-age=60, s-maxage=300, stale-while-revalidate=600`), or move to Edge/ISR where suitable; add server-side caching strategy and invalidation.

21. Issue: Multiple admin API endpoints lack explicit admin authorization

    - File/Location: src/app/api/admin/gemstones/route.ts:1; src/app/api/admin/orders/route.ts:1; src/app/api/admin/orders/[orderId]/status/route.ts:1; src/app/api/admin/orders/bulk-update/route.ts:1; src/app/api/admin/statistics/users/route.ts:1
    - Reason: Handlers run with service role or elevated access but don’t verify requester’s admin role; leads to potential data exposure and unauthorized mutations.
    - Severity: Critical
    - Recommendation: Add robust admin checks using `createServerClient().auth.getUser()` + role lookup; return 401/403 if absent; consider server-side middleware guard; reinforce with RLS that only admins can read/write respective views/tables.

22. Issue: Minimal/absent automated tests for critical flows

    - File/Location: Location not specified (repo-wide)
    - Reason: Vitest is configured but no significant tests detected; increases regression risk across cart, orders, and catalog.
    - Severity: Major
    - Recommendation: Add unit tests for services (cart, orders), integration tests for API routes (orders, catalog), and E2E for cart→order; gate PRs on tests and coverage.

23. Issue: SSOT violations and duplicated domain constants

    - File/Location: src/features/orders/types/order.types.ts:114 (supported_currencies); src/app/api/catalog/route.ts:86/116/144 (hardcoded gemstone types/colors/cuts); similar enums duplicated elsewhere
    - Reason: Repeated hardcoded lists drift from DB enums and cause subtle bugs.
    - Severity: Major
    - Recommendation: Generate TS enums from DB (already using `types:generate`) and import them; centralize domain constants; consider a `domain-constants.ts` sourced from DB types.

24. Issue: Inconsistent input validation across APIs (Zod used in some, not others)

    - File/Location: src/app/api/chat/route.ts uses Zod; orders and admin routes do not
    - Reason: Missing schema validation allows malformed input and makes error handling inconsistent.
    - Severity: Major
    - Recommendation: Add Zod schemas for all API inputs (orders create, admin updates, catalog filters), respond with 400 on validation errors, and document contracts.

25. Issue: `btoa(JSON.stringify(filters))` for cache keys may break on non-ASCII

    - File/Location: src/features/gemstones/services/catalog-cache.ts:35
    - Reason: `btoa` expects Latin1; Unicode characters in filters (e.g., RU locale values) can throw.
    - Severity: Minor
    - Recommendation: Use a Unicode-safe base64 (encode UTF-8) or `encodeURIComponent` on JSON; or hash (e.g., SHA-1) to a stable key.

26. Issue: Repeated ad-hoc price formatting and rounding
    - File/Location: src/features/cart/components/cart-page.tsx:153; src/features/cart/services/cart-service.ts:642; others
    - Reason: Formatting/rounding duplicated and set to 0 fraction digits; risks inconsistent display across locales/currencies.
    - Severity: Suggestion
    - Recommendation: Create a shared money utility with currency-aware fraction digits and localization; use consistently across UI and services.

27. Issue: Single Responsibility Principle (SRP) violations due to very large components
    - File/Location: 
      - src/features/gemstones/components/ai-analysis-display.tsx:1-1227
      - src/features/admin/components/enhanced-search.tsx:1-850
      - src/features/admin/components/gemstone-list-optimized.tsx:1-831
      - src/features/admin/components/gemstone-form.tsx:1-768
      - src/features/gemstones/components/filters/advanced-filters-v2.tsx:1-759
      - src/features/visualization/components/stone-3d-visualizer.tsx:1-717
      - src/features/gemstones/components/gemstone-catalog-optimized.tsx:1-708
      - src/features/cart/services/cart-service.ts:1-651
      - src/features/orders/components/order-details-page.tsx:1-467
    - Reason: Monolithic files combine state management, data fetching, transformation, and presentation; reduces cohesion and testability.
    - Severity: Major
    - Recommendation: Split into container (data/logic) and presentational components; extract reusable hooks (data fetching, formatting); keep components <300 LOC where feasible.

28. Issue: Mixed concerns (data fetching, caching, and UI) in catalog component
    - File/Location: src/features/gemstones/components/gemstone-catalog-optimized.tsx:104-240
    - Reason: Component builds query strings, performs fetch, manages client cache, and renders UI, complicating reuse and testing.
    - Severity: Major
    - Recommendation: Move fetch and query construction to a service/hook (e.g., `useCatalogQuery` with TanStack Query); keep the component focused on rendering props.

29. Issue: Widespread use of `any` weakens type safety
    - File/Location: src/app/api/catalog/route.ts:188 (`map((gemstone: any)`); src/features/orders/services/order-service.ts:200-227 (image mapping with `any`); others
    - Reason: `any` defeats generated Supabase types and invites runtime errors.
    - Severity: Minor
    - Recommendation: Use generated `Database` types and narrow with `zod` parsing; avoid `any` by defining minimal interfaces for select projections.

30. Issue: Inconsistent API response shapes and error contracts
    - File/Location: Multiple API routes (e.g., /api/catalog returns `{data,...}` without `success`; others return `{success: true/false,...}`)
    - Reason: Inconsistency increases client complexity and error handling bugs.
    - Severity: Minor
    - Recommendation: Standardize on a response envelope `{success:boolean, data?:T, error?:{code:string,message:string}}` and document it; add helpers to build responses consistently.

31. Issue: Ad-hoc client caching without persistence or deduplication
    - File/Location: src/features/gemstones/services/catalog-cache.ts:1-61
    - Reason: Simple in-memory Map offers no request dedupe, no suspense integration, and resets on navigation reload; keys may collide across locales.
    - Severity: Suggestion
    - Recommendation: Adopt TanStack Query or SWR for request caching, dedupe, background revalidation, and cache hydration; scope keys by locale and filter hash.

## Error Handling

- All referenced files were accessible during analysis; no parsing errors encountered.
