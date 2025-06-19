# Functional Specification

## 1. Registration / Login
- Fields: Name, Phone (masked), Email, Password, Confirm Password
- Validations: email format, phone mask, password length, matching
- Features:
  - Auth via Google, VK, Telegram
  - Auto-login after registration
  - Checkbox: Agree to terms
  - Toast notifications for success or error

## 2. Catalog & Filters
- Filters auto-update result list:
  - Color: multi-select, color chips, highlighted when active
  - Mineral Name: multi-select dropdown
  - Price Range: interactive slider with live preview
  - Cut Style: grid of cuts with visual icons, multiselect
  - Origin: multi-select dropdown
- Search-as-you-type with suggestions and match highlighting

## 3. Product Detail Page
- Title, specs, price / price-per-ct, availability
- Icons: ❤️ and 🛒
- Actions:
  - Add to favorites / remove
  - Add to cart / remove
  - Download all media (watermark-free, serial number only)
  - Launch visualizer

## 4. Cart
- Product list in vertical stack
- Quantities (if multiple allowed)
- Auto-calculate subtotal, shipping, currency
- Actions:
  - Remove item
  - Clear all
  - Checkout → `/checkout`

## 5. Checkout
- Fields:
  - Name, Phone, Email (opt), Address
  - Comment (opt)
- Delivery: automatic fee based on city
- Payment:
  - Online (any method)
  - Invoice for companies
- Confirmation:
  - Success screen
  - Email to user
  - Order appears in admin panel with status

## 6. Chat
- Always visible icon (💬 bottom right)
- Opens chat overlay
- Features:
  - Text + file attachments
  - Admin label visible
  - Delayed response message after 10min
  - Chat history tied to user ID (or localStorage for guests)

## 7. Favorites
- Stored per-user (or local for guests)
- Max 100 items
- Duplicate check
- UI feedback:
  - "Added to favorites"
  - "Already in favorites"

## 8. Currency Conversion
- Dropdown selector: ₽, $, €, AED, etc.
- Used globally (catalog, cart, checkout)
- Uses fixed rate source (API or admin-set)
- Stored in user session/localStorage

## 9. Admin Dashboard
- Catalog Manager:
  - Add/edit/delete items
  - Upload photo/video
  - Enter: title, weight, cut, color, origin, cert, serial, price (retail & discounted)
- Order Manager:
  - View all orders with filter by status
  - Update order status manually
  - Export orders (CSV or XLS)
- Chat:
  - Respond to users
  - Issue invoice from chat view
- Role Management:
  - Promote user to “Regular Client” status

## 10. Downloads
- Product page: "Download all"
- Includes:
  - All images (high res, no watermark)
  - All videos (e.g. MP4)
  - Filename or visible serial number overlay (bottom-right corner)
- Optional: log download in admin panel

## 11. Visualizer
- Size selector (manual entry or dropdown)
- Finger type: slim / normal / wide
- Skin tone (optional)
- Product type: ring, pendant, etc.
- Realistic scaled placement of stone
- Rotation (optional 3D or pre-rendered)
- Compare mode: show two stones side-by-side
- Save/share preview

