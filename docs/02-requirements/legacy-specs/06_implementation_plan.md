# Implementation Plan — Smaragdus Viridi

## Phase 1 — MVP (4–6 weeks)
🎯 Goal: Launch functional gem store with core features

### Deliverables:
- Homepage with latest stones
- Catalog with filters (color, cut, origin, price)
- Product page with full details and media
- Registration / login / user profile
- Cart + checkout form (no online payment yet)
- Favorites (local + user-linked)
- Admin dashboard for adding/editing stones
- Basic chat overlay (text only)

### Milestones:
- [ ] Project scaffolding & environment setup
- [ ] Auth and roles configured (Supabase)
- [ ] Catalog UI + live filters
- [ ] Product upload and preview (Admin)
- [ ] Cart & checkout backend integration
- [ ] Manual test run with admin placing orders

## Phase 2 — Interactive & Visual (3–4 weeks)
🎯 Goal: Increase engagement and realism

### Deliverables:
- Media download button with serial watermark
- Finger visualizer with scaling logic
- Chat with attachments and admin panel integration
- Role-based pricing (regular vs. VIP)
- Currency selector with auto-conversion

### Milestones:
- [ ] Implement visualizer module
- [ ] Download logic + logging
- [ ] Supabase Realtime integration for chat
- [ ] Currency API + display sync
- [ ] UX refinements for mobile devices

## Phase 3 — Production & Custom Jewelry (2–3 weeks)
🎯 Goal: Add custom order funnel and finish

### Deliverables:
- Custom jewelry section with description + CTA
- Admin orders dashboard with status management
- Payment integrations (Stripe/YooKassa)
- Delivery estimator by city
- Referral account structure
- Final SEO pass and lighthouse audit

### Milestones:
- [ ] Payment backend testing
- [ ] Order lifecycle finalization
- [ ] Email notifications via Resend/Mailgun
- [ ] Visual QA and bug fixes

---

## Deployment Plan
- Use Vercel for frontend, Supabase backend
- GitHub CI/CD with protected main branch
- Feature branches: `feat/catalog`, `feat/checkout`, etc.
- Use Supabase migrations for schema control

## Testing
- Unit tests (basic business logic)
- Visual snapshot tests for key pages
- Manual smoke testing

## Maintenance Plan
- Weekly backup of Supabase DB
- Admin-only access to order logs
- Monitor chat activity for UX improvements

---

## Versioning
- `v1.0.0` = public launch
- `v1.1.0` = visualizer, chat
- `v1.2.0` = full payment + custom jewelry

## Stretch Goals (post-launch)
- AI stone suggestions / matching
- User upload for custom cuts
- Live video consultation module

