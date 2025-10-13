Checklist for this assessment
- Inventory current features, architecture, and code quality.
- Identify critical gaps, risks, and compliance blockers.
- Map fixes to owners and clear next steps.
- Define a production readiness checklist by domain.
- Propose high‑impact enhancements.
- Note unverifiable/out‑of‑scope items.

### 1. Summary
Crystallique (Smaragdus Viridi) is a robust Next.js 15 + Supabase e‑commerce platform with strong differentiators (3D visualization, AI-assisted catalog, multi‑currency, chat, advanced filtering) and extensive i18n. Core UX and catalog flows are well developed; admin APIs and types are present; chat is implemented with real-time support. However, several critical production blockers remain: real payments are not integrated; Orders API is only partially implemented; secrets have leaked via a committed `.env.local`; CSP is overly permissive; and testing/monitoring are light. With targeted fixes, a secure payment path, hardened security, and minimal backend work to complete orders and order retrieval, the platform can be production‑ready in 2–4 weeks.

### 2. Major Gaps & Critical Issues
- High — Payments not integrated (simulated only)
  - Impacted area: Checkout, revenue. Strings indicate simulated payment only; no Stripe or gateway usage found.
  - Evidence: No Stripe usage in code; simulated copy in translations (e.g., `src/messages/en/orders.json:96`).
  - Next steps: Implement Stripe (Payment Intents) or bank transfer flow with invoice issuance; add webhooks; map order state transitions; add retries and reconciliation jobs.
  - Responsibility: Backend, DevOps, Legal/Compliance.

- High — Orders API incomplete; missing order retrieval route
  - Impacted area: Order creation/retrieval and order details page.
  - Evidence: `src/app/api/orders/route.ts:1` returns 501 for GET/POST; `/api/orders/[id]` route not implemented though UI calls it (`src/features/orders/components/order-details-page.tsx:52`).
  - Next steps: Implement `POST /api/orders` to validate cart/stock, create order in a transaction, emit order events; implement `GET /api/orders/[id]` with auth checks; ensure RLS or server-side checks.
  - Responsibility: Backend.

- High — Secret leakage in repository
  - Impacted area: Security and environment integrity.
  - Evidence: Real keys committed to `.env.local` (Supabase URL/anon key, service role key, OpenAI) in repo root (`.env.local:1`).
  - Next steps: Immediately revoke/rotate Supabase service role and anon key, rotate OpenAI key; purge from history if repo is/was public; enforce secret scanning + pre-commit hooks; lock down Vercel env.
  - Responsibility: Security, DevOps.

- High — Overly permissive CSP and security posture
  - Impacted area: XSS/malicious script risk.
  - Evidence: `next.config.ts:21` includes `script-src 'unsafe-eval' 'unsafe-inline'` and broad `connect-src` (wss/ws wildcard).
  - Next steps: Remove `unsafe-eval` and `unsafe-inline`; whitelist known domains; add nonce/hashing for inline if unavoidable; ensure strong CSP headers in Vercel; adopt secure headers lib or Next safe headers; review `Referrer-Policy`, `Permissions-Policy`.
  - Responsibility: Security, DevOps.

- High — Admin service role used broadly in APIs
  - Impacted area: Principle of least privilege, data exposure risk if server is compromised.
  - Evidence: Multiple routes/services use `supabaseAdmin` (service role) for DB access (e.g., `src/app/api/chat/route.ts:1`, `src/app/api/catalog/route.ts:3`, admin services), paired with user auth checks.
  - Next steps: For non-admin user data, prefer RLS with anon client; confine service role to admin-only paths and server jobs; add defensive authorization checks; centralize guard middleware; ensure no client exposure.
  - Responsibility: Backend, Security.

- Medium — Broken legal links and missing policy content
  - Impacted area: Legal/compliance and UX trust.
  - Evidence: Footer links for `/privacy`, `/terms`, `/cookies` exist (`src/shared/components/layout/footer.tsx:25`) but no corresponding pages in `src/app`.
  - Next steps: Add localized policy pages (EN/RU), cookie banner and preferences center; confirm content with Legal.
  - Responsibility: Frontend, Legal.

- Medium — Testing coverage and quality gates are minimal in practice
  - Impacted area: Reliability, regressions.
  - Evidence: Vitest configured (`vitest.config.ts:1`), but few/no tests found; build ignores ESLint errors (`next.config.ts:6`).
  - Next steps: Add unit/integration tests for cart, orders, catalog filters, chat; enable ESLint during builds for staging; add PR CI gates; target at least 70–80% on core business logic.
  - Responsibility: QA/Frontend/Backend.

- Medium — Global search UX not defined/implemented
  - Impacted area: Navigation, discovery, cross‑site findability.
  - Evidence: Header search button has no behavior; only catalog‑scoped search exists via filters and `/api/catalog?search=...`.
  - Next steps: Decide scope (sitewide search, catalog‑only, or command palette), target entities (gemstones, content pages, admin tools), and UX (inline input vs overlay). Implement locale‑aware navigation to `/catalog?search=…`, add typeahead, and consider indexing strategy (full‑text, view, or external search) as needed.
  - Responsibility: Product/UX, Frontend.

- Medium — Monitoring, alerting, and error tracking not integrated
  - Impacted area: Operability in production.
  - Evidence: Simple console logger (`src/shared/utils/logger.ts:1`), no Sentry/Datadog/uptime checks; Pino mentioned in docs but not present in code.
  - Next steps: Integrate Sentry (client+server) and basic uptime/ping; structured logging (Pino/Winston) server-side; setup dashboards and alerting.
  - Responsibility: DevOps.

- Medium — Order stock reservation and concurrency safety not specified
  - Impacted area: Overselling prevention and integrity.
  - Evidence: `OrderService.createOrder` inserts orders and deletes `cart_items` without explicit stock locking/reservation (`src/features/orders/services/order-service.ts:70`).
  - Next steps: Add stock reservation at order creation, enforce constraints in DB (triggers, check constraints), transactional semantics, and idempotency keys on POST.
  - Responsibility: Backend, Database.

- Low — SEO and growth gaps (structured data, sitemaps, analytics)
  - Impacted area: Organic acquisition and insights.
  - Evidence: Some Next `Metadata` present (`src/app/layout.tsx:18`), but no sitemap/robots, no JSON-LD, analytics not visible.
  - Next steps: Add sitemap and robots; product JSON‑LD; integrate analytics (GA4/PLG tool); add canonical URLs and hreflang for locales.
  - Responsibility: Frontend, Marketing.

### 3. Minor Issues & Improvements
- [ ] Define and implement global Search purpose and UX (sitewide vs catalog vs command palette).
- [ ] Replace console logger with structured logger (Pino) on server; standardize contexts.
- [ ] Harden image `remotePatterns` to explicit host allowlist and remove unused origins (`next.config.ts`).
- [ ] Tighten `images.unsplash.com` usage or serve via proxy/CDN with cache headers.
- [ ] Add rate limiting on write APIs (auth, chat, orders) and bot protection.
- [ ] Add missing accessibility labels and keyboard traps validation on modal components.
- [ ] Refine 3D viewer loading states and device performance fallbacks.
- [ ] Add skeletons for catalog/product pages to reduce CLS.
- [ ] Ensure all i18n namespaces are present across locales (run i18n audit in CI).
- [ ] Add /healthz and /ready endpoints for uptime monitors.
- [ ] Add admin UI for order events timeline detail and internal notes filters.
- [ ] Migrate inline theme script to CSP‑friendly nonce or CSS media + hydration strategy.

### 4. Production Readiness Checklist
- Core Technical Operations
  - [ ] CI/CD: Build, test, lint on PR; block on failures
  - [ ] Deploy: Vercel prod + preview with environment separation
  - [ ] Monitoring: Sentry (client/server), uptime checks, log aggregation
  - [ ] Alerts: Error rate, failing routes, cold starts, DB error spikes
  - [ ] Perf: Lighthouse >90, route budgets, image optimization verified
  - [ ] Caching: Catalog responses and ISR; CDN headers tuned
  - [ ] Secrets: Rotated, vaulted, and scoped envs (no secrets in repo)

- Compliance
  - [ ] GDPR: Privacy policy, DPA, data export/delete flows
  - [ ] PCI: Stripe (or gateway) with SAQ A, card data never touches server
  - [ ] Security: CSP hardened, dependency audit, rate limiting, authZ review
  - [ ] Cookies: Consent banner, preferences, policy pages (EN/RU)
  - [ ] Logging: PII minimization, retention policies

- Documentation & Testing
  - [ ] Runbooks: Incident response, on-call, rollback
  - [ ] Onboarding: Dev setup, environment, data seeding
  - [ ] Tests: Unit/integration/E2E for core journeys (checkout, search, auth)
  - [ ] Coverage: 70–80% on core business logic
  - [ ] API: Contract docs and example requests

- Business Readiness
  - [ ] Content: Finalized landing/copy for target personas (jewelers/collectors)
  - [ ] Policies: Privacy, Terms, Refunds/Returns, Shipping
  - [ ] Support: Chat SLAs, escalation, email templates
  - [ ] Payments: Gateway live keys, webhooks, reconciliation
  - [ ] Analytics: Funnels (catalog → PDP → cart → order)

### 5. Suggested Enhancements
| Enhancement | Impact | Priority |
| --- | --- | --- |
| Real payment integration (Stripe Payment Intents + webhooks) | Unlocks actual sales, enables refunds and receipts | High |
| Order retrieval API and events timeline completion | Unblocks order details page and post‑purchase UX | High |
| Secrets governance (rotation, vault, scanners) | Eliminates current critical security risk | High |
| CSP hardening + nonce-based inline mitigation | Reduces XSS risk and passes security review | High |
| Stock reservation + idempotent order creation | Prevents overselling, improves data integrity | High |
| Global sitewide search/command palette | Improves discovery and navigation across entities | Medium |
| Sentry + structured logging | Faster triage, improved reliability | Medium |
| SEO: sitemap, robots, JSON-LD, hreflang | Better discovery and international SEO | Medium |
| Analytics & funnels (GA4 + privacy mode) | Insight into conversion and feature usage | Medium |
| Save/compare gemstones, wishlists | Improves engagement for enthusiasts/pros | Medium |
| Price alerts and restock notifications | Drives re‑engagement and repeat visits | Medium |
| Certificate management (upload/verify reports) | Trust and differentiation for professional buyers | Medium |
| AR try‑on (later) | Differentiating 3D experience for mobile | Low |

Rationale summary:
- Payment + orders + security changes convert the platform from demo to production safely.
- Monitoring, SEO, analytics ensure operability and growth.
- Engagement features (save/compare/alerts) align with pro and consumer personas.

### 6. Error/Out-Of-Scope Items
- Unable to verify PCI DSS certification status in codebase.
- Cannot confirm GDPR DPA and legal policy sign‑off; content not present.
- Production Supabase RLS correctness across all tables cannot be fully audited here.
- Email/SMS provider integration (for notifications) not present; unverifiable.
- Infrastructure specifics (VPC, WAF, backups, encryption at rest) not visible from app repo.
- Domain/DNS/SSL provisioning outside scope; `check-dns.sh` exists but infra not verified.

Responsibilities and immediate next steps (prioritized)
- Backend
  - Implement `POST /api/orders` and `GET /api/orders/[id]`; add stock reservation + idempotency.
  - Integrate Stripe; add webhooks for order state updates.
- DevOps/Security
  - Revoke and rotate leaked keys; add secret scanning; lock env handling.
  - Harden CSP and headers; add Sentry + uptime monitoring.
- Frontend
  - Add legal pages (EN/RU) and cookie consent; fix order details page consumption of new API; finalize 3D fallbacks.
- Legal/Business
  - Finalize Privacy/Terms/Refund policies; approve payment terms and jurisdictions.
- QA
  - Add tests for cart→order, auth flows, catalog filters; set coverage targets; add E2E smoke tests.

Context alignment
- Technology: Next.js 15, Supabase, Tailwind, Three.js, next‑intl; i18n structure is robust (`src/i18n/request.ts:1`, messages in `src/messages/en/index.ts:1` and `src/messages/ru/index.ts:1`).
- Differentiators: 3D visualization, AI‑assisted catalog, multi‑currency, chat — all present in code; production gating items are mostly payments, orders API completion, and security hardening.
- Status: Docs indicate sprints 1–4 complete with sprint 5 (cart) next; repository reflects near‑complete cart UI and service, with API endpoints to finish.

If you want, I can:
- Draft the `GET /api/orders/[id]` and complete `POST /api/orders` routes to align with the existing `OrderService`.
- Add a Stripe integration skeleton with test keys, intents, and webhooks.
- Replace CSP with a hardened policy and wire Sentry for server and browser.
