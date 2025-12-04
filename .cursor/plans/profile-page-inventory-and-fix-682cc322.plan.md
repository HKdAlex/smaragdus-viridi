---
name: Profile Page Enhancements Phase 2
overview: ""
todos:
  - id: a2ac839c-1eca-48fd-8b4d-671e64d468a4
    content: Wire useOrderHistory hook in UserProfilePage and pass data to OrderHistory component
    status: pending
  - id: 6a48bdb4-00a9-43c1-850c-37ec5a6be607
    content: Wire useActivityHistory hook in UserProfilePage and pass data to ActivityFeed component
    status: pending
  - id: 8e2307c1-31af-4823-8606-39847acee69d
    content: Replace static no-orders message with actual recent orders from useOrderHistory hook
    status: pending
  - id: 53b3c148-5042-48ca-83a8-441e9fa93ef6
    content: Check/create user preferences storage mechanism (table or extend user_profiles)
    status: pending
  - id: d06b719a-6006-4a12-8f50-83762ae88aba
    content: Add getPreferences and updatePreferences methods to UserProfileService
    status: pending
  - id: 81deea8b-b5c9-46a8-8ef1-87e94c57620f
    content: Replace TODO in profile page.tsx with actual onUpdatePreferences server action
    status: pending
  - id: a85d8d94-42a5-4dbf-a65c-291a14c6b9a1
    content: Load and save preferences in ProfileSettings component
    status: pending
  - id: 039429a3-4282-4109-8bfb-25389446776b
    content: Add error states and error boundaries to all profile components
    status: pending
  - id: 83a2b7f5-d645-4fb7-bf5b-c7fdeb56f3fb
    content: Add proper loading skeletons and indicators throughout profile page
    status: pending
  - id: dbfa0501-97f7-4dd4-91bb-7aac2e22b6fb
    content: Ensure profile updates trigger data refresh and UI updates
    status: pending
  - id: f5d99346-1c7f-4cfa-9a7d-c1d2cc90fb85
    content: Replace all any types with proper TypeScript types
    status: pending
  - id: 5f8a62d8-8e8c-45c3-a16e-538335c91ea9
    content: Add Zod schemas for profile updates and password changes
    status: pending
  - id: e6b2cc35-e076-4332-9525-577c31ceff6e
    content: "Test all profile page functionality: updates, password change, preferences, order history, activity feed"
    status: pending
---

# Profile Page Enhancements Phase 2

## Summary

Implement three high-priority features to close critical gaps in the application:

1. **Contact Form Notifications** - Notify admins and auto-respond to users
2. **Orders Enhancement** - CSV export, bulk actions, cancellation, analytics
3. **User Activity Tracking** - Track and display user activities

---

## Feature 1: Contact Form Notification System

### Current State

- Contact form saves to `chat_messages` table
- No admin notifications sent
- No auto-response to users
- TODOs at `src/app/api/contact/route.ts:78-80`

### Implementation Plan

#### 1.1 Create Contact Email Templates

**File**: `src/lib/email/templates/contact-templates.ts`

```typescript
export enum ContactEmailTemplateType {
  ADMIN_NOTIFICATION = 'contact_admin_notification',
  USER_AUTO_RESPONSE = 'contact_user_auto_response',
}

export function getAdminNotificationTemplate(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  urgency: string;
  locale: string;
}): { subject: string; html: string; text: string };

export function getUserAutoResponseTemplate(data: {
  name: string;
  locale: string;
}): { subject: string; html: string; text: string };
```

#### 1.2 Create Contact Notification Service

**File**: `src/features/contact/services/contact-notification-service.ts`

```typescript
export class ContactNotificationService {
  async notifyAdmins(submission: ContactSubmission): Promise<void>;
  async sendAutoResponse(email: string, name: string, locale: string): Promise<void>;
  private getAdminEmails(): Promise<string[]>;
}
```

- Fetch admin emails from `user_profiles` where `role = 'admin'`
- Use existing `EmailService` from `src/lib/email/`
- Respect admin notification preferences

#### 1.3 Update Contact API Route

**File**: `src/app/api/contact/route.ts`

- Import `ContactNotificationService`
- After saving message, call `notifyAdmins()` and `sendAutoResponse()`
- Handle errors gracefully (don't fail submission if email fails)
- Log notification status

#### 1.4 Add Admin Email Configuration

**File**: `src/lib/email/config/contact-email-config.ts`

```typescript
export const CONTACT_EMAIL_CONFIG = {
  adminFallbackEmail: process.env.ADMIN_FALLBACK_EMAIL || 'admin@example.com',
  autoResponseEnabled: true,
  adminNotificationEnabled: true,
} as const;
```

### Files to Create/Modify

- `src/lib/email/templates/contact-templates.ts` (new)
- `src/lib/email/config/contact-email-config.ts` (new)
- `src/features/contact/services/contact-notification-service.ts` (new)
- `src/app/api/contact/route.ts` (modify)

---

## Feature 2: Orders Enhancement

### Current State

- Orders dashboard shows orders but lacks management tools
- TODOs: CSV export, bulk actions, order cancellation
- Analytics returns hardcoded zeros

### Implementation Plan

#### 2.1 Order Export Service

**File**: `src/features/orders/services/order-export-service.ts`

```typescript
export interface OrderExportOptions {
  orderIds?: string[];
  status?: OrderStatus[];
  dateFrom?: string;
  dateTo?: string;
  format: 'csv' | 'json';
  includeItems: boolean;
  includeCustomerInfo: boolean;
}

export class OrderExportService {
  async exportOrders(options: OrderExportOptions): Promise<{
    success: boolean;
    data?: string;
    filename?: string;
    error?: string;
  }>;
  
  private formatOrderForExport(order: Order): Record<string, any>;
  private generateCSV(orders: Order[]): string;
}
```

CSV columns: Order ID, Order Number, Customer Name, Email, Status, Total, Currency, Items Count, Created At, Updated At

#### 2.2 Order Export API Route

**File**: `src/app/api/admin/orders/export/route.ts`

- POST endpoint accepting `OrderExportOptions`
- Requires admin authentication
- Returns CSV file or JSON
- Input validation with Zod

#### 2.3 Order Cancellation

**File**: `src/features/orders/services/order-service.ts` (modify)

```typescript
async cancelOrder(orderId: string, reason?: string): Promise<OrderResult> {
  // 1. Verify order exists and is cancellable (pending/confirmed only)
  // 2. Update order status to 'cancelled'
  // 3. Create order_event record
  // 4. Return updated order
}
```

**File**: `src/app/api/orders/[orderId]/cancel/route.ts` (new)

- POST endpoint for user cancellation
- Requires authentication
- Only owner can cancel their order

**File**: `src/app/api/admin/orders/[orderId]/cancel/route.ts` (new)

- POST endpoint for admin cancellation
- Requires admin authentication
- Can cancel any order with reason

#### 2.4 Bulk Order Actions

**File**: `src/features/admin/services/order-bulk-service.ts` (new)

```typescript
export class OrderBulkService {
  async bulkUpdateStatus(
    orderIds: string[],
    newStatus: OrderStatus,
    adminId: string
  ): Promise<BulkOperationResult>;
  
  async bulkExport(orderIds: string[]): Promise<ExportResult>;
}
```

**File**: `src/app/api/admin/orders/bulk-status/route.ts` (new)

- PUT endpoint for bulk status updates
- Requires admin authentication
- Creates audit trail

#### 2.5 Fix Order Analytics

**File**: `src/features/admin/services/order-management-service.ts` (modify)

Replace hardcoded zeros in `getOrderAnalytics()`:

```typescript
async getOrderAnalytics(filters?: OrderFilters): Promise<OrderAnalytics> {
  // Query orders table for:
  // - total_orders: COUNT(*)
  // - total_revenue: SUM(total_amount) WHERE status = 'delivered'
  // - average_order_value: AVG(total_amount)
  // - orders_by_status: GROUP BY status
  // - orders_by_month: DATE_TRUNC('month', created_at)
}
```

#### 2.6 Update Orders Dashboard UI

**File**: `src/features/orders/components/orders-dashboard.tsx` (modify)

- Wire `handleExportOrders` to call export API and download file
- Wire `handleBulkAction` to call bulk status API
- Add bulk selection UI (checkboxes)
- Show real analytics data

**File**: `src/features/orders/components/order-details-page.tsx` (modify)

- Wire cancel button to call cancel API
- Show confirmation dialog before cancellation
- Handle cancel success/error states

### Files to Create/Modify

- `src/features/orders/services/order-export-service.ts` (new)
- `src/features/admin/services/order-bulk-service.ts` (new)
- `src/app/api/admin/orders/export/route.ts` (new)
- `src/app/api/orders/[orderId]/cancel/route.ts` (new)
- `src/app/api/admin/orders/[orderId]/cancel/route.ts` (new)
- `src/app/api/admin/orders/bulk-status/route.ts` (new)
- `src/features/orders/services/order-service.ts` (modify)
- `src/features/admin/services/order-management-service.ts` (modify)
- `src/features/orders/components/orders-dashboard.tsx` (modify)
- `src/features/orders/components/order-details-page.tsx` (modify)

---

## Feature 3: User Activity Tracking System

### Current State

- `user_activities` table does not exist
- `UserProfileService.getActivityHistory()` returns empty array
- `logActivity()` logs but doesn't persist
- Activity feed on profile page always empty

### Implementation Plan

#### 3.1 Database Migration

**File**: `supabase/migrations/[timestamp]_create_user_activities.sql`

```sql
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at DESC);

-- RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
  ON user_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert activities"
  ON user_activities FOR INSERT
  WITH CHECK (true);
```

Activity types: `order_placed`, `order_status_changed`, `profile_updated`, `password_changed`, `favorite_added`, `favorite_removed`, `cart_updated`

#### 3.2 User Activity Service

**File**: `src/features/user/services/user-activity-service.ts` (new)

```typescript
export type ActivityType = 
  | 'order_placed'
  | 'order_status_changed'
  | 'profile_updated'
  | 'password_changed'
  | 'favorite_added'
  | 'favorite_removed'
  | 'cart_updated';

export interface UserActivity {
  id: string;
  user_id: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export class UserActivityService {
  async logActivity(
    userId: string,
    type: ActivityType,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void>;
  
  async getActivities(
    userId: string,
    options?: { page?: number; limit?: number; type?: ActivityType[] }
  ): Promise<{ activities: UserActivity[]; total: number; hasMore: boolean }>;
}
```

#### 3.3 Update UserProfileService

**File**: `src/features/user/services/user-profile-service.ts` (modify)

- Import `UserActivityService`
- Replace TODO in `getActivityHistory()` with actual query
- Replace TODO in `logActivity()` with `UserActivityService.logActivity()`
- Log activities on: profile update, password change

#### 3.4 Integrate Activity Logging Across Features

**Orders** - `src/features/orders/services/order-service.ts`:

```typescript
// After order creation:
await userActivityService.logActivity(userId, 'order_placed', 
  `Placed order #${orderNumber}`, { orderId, total });
```

**Cart** - `src/features/cart/services/cart-service.ts`:

```typescript
// After cart update:
await userActivityService.logActivity(userId, 'cart_updated',
  `Updated cart`, { itemCount });
```

**Favorites** - Add logging when favorites are added/removed

#### 3.5 Run Migration and Sync Types

After creating migration:

```bash
# Apply migration
mcp_supabase_apply_migration

# Sync types
npm run types:generate
```

### Files to Create/Modify

- `supabase/migrations/[timestamp]_create_user_activities.sql` (new)
- `src/features/user/services/user-activity-service.ts` (new)
- `src/features/user/services/user-profile-service.ts` (modify)
- `src/features/orders/services/order-service.ts` (modify)
- `src/features/cart/services/cart-service.ts` (modify)
- `src/shared/types/database.ts` (regenerate)

---

## Implementation Order

| Phase | Feature | Effort | Dependencies |

|-------|---------|--------|--------------|

| 1 | Contact Form Notifications | ~2 hours | Email service exists |

| 2 | Orders Enhancement | ~4 hours | None |

| 3 | User Activity Tracking | ~3 hours | DB migration |

**Recommended order**: 1 → 2 → 3 (lowest effort first, build momentum)

---

## Testing Strategy

### Contact Form Notifications

- Test admin notification email sent
- Test user auto-response email sent
- Test graceful failure if email service fails
- Test both locales (en/ru)

### Orders Enhancement

- Test CSV export with various filters
- Test order cancellation (user and admin)
- Test bulk status update
- Test analytics returns real data

### User Activity Tracking

- Test activity logging on profile update
- Test activity logging on order creation
- Test activity feed pagination
- Test RLS policies

---

## Constraints

- Must use existing email infrastructure
- Must follow existing code patterns (SRP, SSOT)
- Must apply DB migrations via Supabase MCP
- Must sync types after schema changes via `npm run types:generate`
- All API routes require proper authentication
- No PII in logs

---

## Risks

- Email delivery failures (mitigate: graceful error handling, don't fail main operation)
- Activity table growth (mitigate: add retention policy later)
- Bulk operations on large datasets (mitigate: add limits, pagination)