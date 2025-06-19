# Technical Specification — Smaragdus Viridi

## Stack
- **Frontend**: Next.js 14, React, TailwindCSS, ShadCN
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **Storage**: Supabase Storage (media), CDN-enabled
- **Realtime**: Supabase Realtime for chat
- **3D/Visualizer**: WebGL + fallback to rendered images

## Frontend Structure
- Feature-based folder layout
- SSR for product/catalog pages
- Static for homepage, about
- Components:
  - CatalogCard
  - ProductDetail
  - ChatWidget
  - VisualizerPanel

## Auth
- Supabase Auth with:
  - Email/password
  - OAuth (Google, VK, Telegram)
- Role-based access: guest, user, VIP, admin

## Database Schema
### Tables
- `users`
  - id, email, phone, name, role

- `stones`
  - id, title, weight, dimensions, cut, color, origin
  - available: boolean
  - cert_url, delivery_estimate
  - price_regular, price_discounted
  - serial_number

- `favorites`
  - user_id, stone_id

- `cart_items`
  - user_id, stone_id, quantity

- `orders`
  - id, user_id, status, delivery, payment_type
  - total_amount, created_at

- `chat_messages`
  - sender_id, receiver_id, message, file_url, timestamp

- `media_files`
  - stone_id, type (image/video), url, is_downloadable

- `downloads`
  - user_id, stone_id, timestamp (optional log)

- `currency_rates`
  - base_currency, target_currency, rate

## API (Edge Functions)
- `POST /checkout` — process order
- `POST /chat/send` — store message
- `GET /visualizer/data` — return scaled images
- `POST /media/log-download` — optional logging

## Admin Panel Features
- Protected route
- Upload/edit/delete stones
- Preview media
- Manage users & roles
- Order dashboard (status filter, export)
- Reply in chat + send invoice

## Security
- Supabase Row Level Security (RLS)
- All storage files private, signed URLs for downloads
- Admin-only mutations for products/orders

## Performance
- Use CDN for media
- Image lazy loading
- Split builds for mobile/desktop
- Cache product data where safe (ISR/SSR)

## Optional Integrations
- Email provider (Resend, Mailgun) for order emails
- Payment gateway: Stripe, YooKassa, or local bank
- 3D tools: Babylon.js or pre-rendered WebGL assets

## DevOps
- GitHub repo + Supabase CLI + Vercel/Netlify for deploy
- .env for secrets (API keys, storage access)

