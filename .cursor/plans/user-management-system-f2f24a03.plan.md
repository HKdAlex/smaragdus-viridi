<!-- f2f24a03-8f55-4743-8345-377cc7530775 68e8687b-9c7d-4351-b446-d0891486a16e -->
# User Management System Implementation Plan

## Summary

Build a complete admin user management system that allows administrators to:

- View, search, filter, and paginate users with advanced filters
- Create users manually or send email invitations
- Edit user profiles (name, phone, email, currency preferences, role)
- Assign and change user roles with confirmation dialogs
- Suspend/activate user accounts
- Delete users with proper safeguards
- Perform bulk operations (role changes, status updates)
- Track user activity and view audit logs
- Export user data to CSV
- Reset user passwords
- View enhanced user statistics

## Architecture & Design Principles

**Single Responsibility Principle (SRP)**: Each component/service has one clear responsibility

- Services handle data operations only (no UI logic)
- Components handle UI rendering only (no business logic)
- API routes handle HTTP concerns only (authentication, validation, routing)

**Single Source of Truth (SSOT)**:

- User data lives in `user_profiles` table
- Auth state managed by Supabase Auth
- All user operations flow through UserManagementService

**Security First**:

- All operations require admin authentication via `requireAdmin()`
- Row Level Security (RLS) policies prevent unauthorized access
- Input validation with Zod schemas
- Audit logging for all sensitive operations
- No PII in logs or error messages

**File Size Limits**: No file exceeds 300 lines; split into focused modules

## Database Layer

### Migration: `supabase/migrations/[timestamp]_create_user_management_tables.sql`

Create tables for audit logs and user invitations:

```sql
-- User activity audit log
CREATE TABLE user_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'role_change', 'suspend', 'activate'
  changes JSONB, -- Before/after state
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User invitations
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role user_role DEFAULT 'regular_customer',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_audit_logs_admin ON user_audit_logs(admin_user_id);
CREATE INDEX idx_user_audit_logs_target ON user_audit_logs(target_user_id);
CREATE INDEX idx_user_audit_logs_created_at ON user_audit_logs(created_at DESC);
CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_token ON user_invitations(token);

-- RLS Policies
ALTER TABLE user_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON user_audit_logs
  FOR SELECT USING (public.is_admin());

-- Only admins can manage invitations
CREATE POLICY "Admins can manage invitations" ON user_invitations
  FOR ALL USING (public.is_admin());
```

### RLS Enhancement: User Profiles Admin Access

Update RLS policies on `user_profiles` to allow admin full access:

```sql
-- Allow admins to view all user profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (public.is_admin());

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile" ON user_profiles
  FOR UPDATE USING (public.is_admin());

-- Allow admins to delete profiles (with safeguards in application layer)
CREATE POLICY "Admins can delete profiles" ON user_profiles
  FOR DELETE USING (public.is_admin());
```

## Type Definitions

### `src/features/admin/types/user-management.types.ts` (< 150 lines)

```typescript
import type { Database } from '@/shared/types/database';
import type { UserRole, CurrencyCode } from '@/shared/types';

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export interface UserWithAuth extends UserProfile {
  auth_email: string;
  auth_created_at: string;
  auth_last_sign_in: string | null;
  is_active: boolean;
}

export interface UserFilters {
  search?: string; // Search by name, email, phone
  role?: UserRole[];
  is_active?: boolean;
  registered_from?: string; // ISO date
  registered_to?: string; // ISO date
  has_orders?: boolean;
}

export interface UserListRequest {
  page?: number;
  limit?: number;
  filters?: UserFilters;
  sort_by?: 'name' | 'email' | 'created_at' | 'role';
  sort_order?: 'asc' | 'desc';
}

export interface UserListResponse {
  users: UserWithAuth[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateUserRequest {
  email: string;
  password?: string; // Optional: if not provided, send invitation
  name: string;
  phone?: string;
  role: UserRole;
  preferred_currency?: CurrencyCode;
  send_invitation?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  email?: string;
  role?: UserRole;
  preferred_currency?: CurrencyCode;
  discount_percentage?: number;
  language_preference?: string;
}

export interface BulkUserOperation {
  user_ids: string[];
  operation: 'role_change' | 'activate' | 'suspend' | 'delete';
  role?: UserRole; // Required for role_change
}

export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  admin_name: string;
  target_user_id: string | null;
  target_user_name: string | null;
  action: string;
  changes: Record<string, any>;
  created_at: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  invited_by_name: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}
```

## Service Layer

### `src/features/admin/services/user-management-service.ts` (< 250 lines)

Purpose: Handle all user data operations (SSOT for user management)

Key methods:

- `getUsers(request: UserListRequest): Promise<Result<UserListResponse>>`
- `getUserById(userId: string): Promise<Result<UserWithAuth>>`
- `createUser(data: CreateUserRequest): Promise<Result<UserWithAuth>>`
- `updateUser(userId: string, data: UpdateUserRequest): Promise<Result<UserWithAuth>>`
- `deleteUser(userId: string): Promise<Result<void>>`
- `bulkOperation(operation: BulkUserOperation): Promise<Result<BulkResult>>`
- `getUserStatistics(): Promise<Result<UserStatistics>>`
- `exportUsers(filters?: UserFilters): Promise<Result<string>>` (returns CSV)

Calls API routes, handles response parsing, error logging via logger.

### `src/features/admin/services/user-audit-service.ts` (< 150 lines)

Purpose: Handle audit log operations

Key methods:

- `logUserAction(action, targetUserId, changes, metadata)`
- `getAuditLogs(filters, pagination): Promise<Result<AuditLogEntry[]>>`
- `getAuditLogsForUser(userId): Promise<Result<AuditLogEntry[]>>`

### `src/features/admin/services/user-invitation-service.ts` (< 150 lines)

Purpose: Handle user invitation operations

Key methods:

- `sendInvitation(email, role): Promise<Result<UserInvitation>>`
- `getInvitations(filters): Promise<Result<UserInvitation[]>>`
- `resendInvitation(invitationId): Promise<Result<void>>`
- `cancelInvitation(invitationId): Promise<Result<void>>`

## API Layer

### `src/app/api/admin/users/route.ts` (< 200 lines)

**GET**: List users with filtering and pagination

- Requires admin auth via `requireAdmin()`
- Parse query params (page, limit, filters)
- Validate with Zod
- Call Supabase with proper joins to auth.users
- Return paginated response

**POST**: Create new user

- Requires admin auth
- Validate input with Zod schema
- If `send_invitation` is true: create invitation, send email
- Else: create auth user + profile via Supabase Admin API
- Log action to audit log
- Return created user

### `src/app/api/admin/users/[id]/route.ts` (< 200 lines)

**GET**: Get single user details

**PUT**: Update user profile

- Validate changes with Zod
- Log changes to audit log (before/after state)
- Update user_profiles table
- If email changed, update auth.users email
- Return updated user

**DELETE**: Delete user

- Check safeguards (e.g., can't delete last admin, can't delete self)
- Soft delete or hard delete based on configuration
- Log action
- Return success

### `src/app/api/admin/users/bulk/route.ts` (< 150 lines)

**POST**: Perform bulk operations

- Validate operation and user_ids
- For each user, perform operation in transaction
- Log each action to audit log
- Return summary of successes/failures

### `src/app/api/admin/users/statistics/route.ts` (< 100 lines)

**GET**: Enhanced user statistics

- Call database function for optimized stats
- Return detailed metrics

### `src/app/api/admin/users/export/route.ts` (< 150 lines)

**GET**: Export users to CSV

- Apply filters from query params
- Fetch all matching users
- Generate CSV using library
- Return as downloadable file

### `src/app/api/admin/users/[id]/audit-logs/route.ts` (< 100 lines)

**GET**: Get audit logs for specific user

### `src/app/api/admin/invitations/route.ts` (< 150 lines)

**GET**: List pending invitations

**POST**: Send new invitation

### `src/app/api/admin/invitations/[id]/route.ts` (< 100 lines)

**DELETE**: Cancel invitation

**POST**: Resend invitation email

## Validation Schemas

### `src/features/admin/validation/user-management.schemas.ts` (< 150 lines)

Zod schemas for:

- `createUserSchema`
- `updateUserSchema`
- `userFiltersSchema`
- `bulkOperationSchema`
- `invitationSchema`

## UI Components

### `src/features/admin/components/users/user-list-table.tsx` (< 250 lines)

Similar pattern to `gemstone-list-optimized.tsx`:

- Virtualized/paginated table
- Advanced filtering sidebar (search, role, active status, date range)
- Sortable columns
- Row selection for bulk operations
- Action menu per user (edit, delete, view logs, reset password)
- Loading states and error handling
- Export button

### `src/features/admin/components/users/user-form-dialog.tsx` (< 250 lines)

Modal dialog for creating/editing users:

- Form fields: name, email, phone, role, currency, discount
- Conditional fields based on create vs edit mode
- Toggle for "Send invitation email" on create
- Validation with react-hook-form + Zod
- Success/error toast notifications

### `src/features/admin/components/users/user-bulk-actions.tsx` (< 150 lines)

Bulk operations toolbar:

- Shows when users are selected
- Dropdown for bulk actions (change role, suspend, activate, delete)
- Confirmation dialogs with warning messages
- Progress indicator for bulk operations

### `src/features/admin/components/users/user-audit-logs-dialog.tsx` (< 200 lines)

Modal to view audit logs for a user:

- Timeline view of actions
- Filter by action type
- Show admin who performed action
- Display before/after changes
- Pagination for long histories

### `src/features/admin/components/users/user-filters-sidebar.tsx` (< 200 lines)

Collapsible sidebar with filters:

- Search input (debounced)
- Role checkboxes
- Active status toggle
- Date range picker
- "Has orders" toggle
- Clear filters button

### `src/features/admin/components/users/user-statistics-cards.tsx` (< 150 lines)

Enhanced statistics cards (replacing current placeholder):

- Total users, active users, VIP users, admins (keep existing)
- Add: New users this month, average session time, conversion rate
- Trend indicators (up/down arrows with percentage)
- Click to filter by category

### `src/features/admin/components/users/user-invitation-manager.tsx` (< 200 lines)

Component to manage pending invitations:

- List of pending invitations
- Status indicators (pending, expired, accepted)
- Resend button
- Cancel button
- Create new invitation form

### `src/features/admin/components/admin-user-manager.tsx` (refactor, < 250 lines)

Main container component (update existing file):

- Keep statistics cards (but use enhanced version)
- Replace "Coming Soon" placeholder with user management tabs:
  - Tab 1: User List (user-list-table component)
  - Tab 2: Invitations (user-invitation-manager component)
  - Tab 3: Audit Logs (filterable list of all admin actions)
- State management for selected tab
- Integration with all child components

## Internationalization

### Update `src/messages/en/admin.json` (add ~80 lines)

```json
"users": {
  "title": "User Management",
  "subtitle": "Manage user accounts, roles, and permissions",
  "addUser": "Add User",
  "createUser": "Create User",
  "editUser": "Edit User",
  "deleteUser": "Delete User",
  "manageRoles": "Manage Roles",
  "viewAuditLog": "View Audit Log",
  "resetPassword": "Reset Password",
  "sendInvitation": "Send Invitation",
  "exportUsers": "Export Users",
  "bulkActions": "Bulk Actions",
  "selectedUsers": "{count} users selected",
  "tabs": {
    "allUsers": "All Users",
    "invitations": "Invitations",
    "auditLogs": "Audit Logs"
  },
  "filters": {
    "search": "Search users...",
    "role": "Role",
    "status": "Status",
    "dateRange": "Registration Date",
    "hasOrders": "Has Orders",
    "clearFilters": "Clear Filters",
    "allRoles": "All Roles",
    "active": "Active",
    "inactive": "Inactive"
  },
  "form": {
    "name": "Full Name",
    "email": "Email Address",
    "phone": "Phone Number",
    "role": "User Role",
    "currency": "Preferred Currency",
    "discount": "Discount Percentage",
    "language": "Language Preference",
    "sendInvite": "Send invitation email",
    "password": "Password",
    "passwordPlaceholder": "Leave empty to send invitation"
  },
  "stats": {
    "totalUsers": "Total Users",
    "activeUsers": "Active Users",
    "vipUsers": "VIP Users",
    "admins": "Admins",
    "newThisMonth": "New This Month",
    "conversionRate": "Conversion Rate"
  },
  "actions": {
    "edit": "Edit User",
    "delete": "Delete User",
    "viewLogs": "View Audit Logs",
    "resetPassword": "Reset Password",
    "suspend": "Suspend Account",
    "activate": "Activate Account",
    "changeRole": "Change Role"
  },
  "bulk": {
    "changeRole": "Change Role",
    "suspend": "Suspend Accounts",
    "activate": "Activate Accounts",
    "delete": "Delete Users",
    "confirmDelete": "Are you sure you want to delete {count} users? This action cannot be undone.",
    "confirmRoleChange": "Change role to {role} for {count} users?",
    "success": "Bulk operation completed successfully",
    "partialSuccess": "Completed: {success} successful, {failed} failed"
  },
  "invitations": {
    "pending": "Pending Invitations",
    "expired": "Expired",
    "accepted": "Accepted",
    "resend": "Resend",
    "cancel": "Cancel",
    "expiresOn": "Expires on {date}",
    "sentBy": "Sent by {name}",
    "createSuccess": "Invitation sent to {email}",
    "resendSuccess": "Invitation resent",
    "cancelSuccess": "Invitation cancelled"
  },
  "audit": {
    "title": "Audit Log",
    "action": "Action",
    "performedBy": "Performed By",
    "targetUser": "Target User",
    "timestamp": "Timestamp",
    "changes": "Changes",
    "viewDetails": "View Details",
    "actions": {
      "create": "User Created",
      "update": "Profile Updated",
      "delete": "User Deleted",
      "role_change": "Role Changed",
      "suspend": "Account Suspended",
      "activate": "Account Activated",
      "password_reset": "Password Reset"
    }
  },
  "confirmations": {
    "deleteTitle": "Delete User",
    "deleteMessage": "Are you sure you want to delete {name}? This will permanently remove their account and all associated data.",
    "deleteLastAdmin": "Cannot delete the last admin user",
    "deleteSelf": "You cannot delete your own account",
    "roleChangeTitle": "Change User Role",
    "roleChangeMessage": "Change {name}'s role from {currentRole} to {newRole}?",
    "suspendTitle": "Suspend Account",
    "suspendMessage": "Suspend {name}'s account? They will not be able to log in.",
    "activateTitle": "Activate Account",
    "activateMessage": "Activate {name}'s account?"
  },
  "messages": {
    "createSuccess": "User created successfully",
    "updateSuccess": "User updated successfully",
    "deleteSuccess": "User deleted successfully",
    "loadError": "Failed to load users",
    "createError": "Failed to create user",
    "updateError": "Failed to update user",
    "deleteError": "Failed to delete user",
    "exportSuccess": "Users exported successfully",
    "exportError": "Failed to export users",
    "passwordResetSuccess": "Password reset email sent to {email}",
    "passwordResetError": "Failed to send password reset email"
  }
}
```

### Update `src/messages/ru/admin.json` (Russian translations)

Mirror structure of English translations.

## Constraints & Validation

- Maximum 300 lines per file (split if necessary)
- All external inputs validated with Zod before processing
- TypeScript strict mode, no `any` types
- All sensitive operations require admin authentication
- Audit logging for all user modifications
- Cannot delete last admin user
- Cannot delete own admin account
- Rate limiting on invitation emails (3 per minute per admin)
- Email validation before creating users
- Strong password requirements (min 8 chars, complexity)

## Security Considerations

1. **Admin Authentication**: All endpoints use `requireAdmin()` from existing pattern
2. **RLS Policies**: User profiles accessible only to admins and self
3. **Input Validation**: Zod schemas validate all inputs
4. **Audit Trail**: All modifications logged with admin ID, IP, timestamp
5. **No PII in Logs**: Never log passwords, sensitive user data
6. **Email Security**: Use Resend API with rate limiting
7. **CSRF Protection**: Next.js built-in protection
8. **XSS Prevention**: Proper sanitization of all user inputs
9. **SQL Injection**: Parameterized queries via Supabase client

## Test Strategy

### Unit Tests (Vitest)

- `user-management-service.test.ts`: Test all service methods
- `user-management.schemas.test.ts`: Test Zod validation
- `user-audit-service.test.ts`: Test audit logging

### E2E Tests (Playwright)

- `admin-user-management.spec.ts`:
  - Admin can view user list
  - Admin can create user manually
  - Admin can send invitation
  - Admin can edit user profile
  - Admin can change user role
  - Admin can delete user
  - Admin can perform bulk operations
  - Admin can export users to CSV
  - Admin can view audit logs
  - Admin can reset user password

### API Tests

- `users-api.test.ts`: Test all API endpoints with various scenarios

## Data Model Impact

**New Tables**:

- `user_audit_logs`: Track all user management actions
- `user_invitations`: Track pending/accepted invitations

**Modified Tables**:

- `user_profiles`: New RLS policies for admin access

**New RPC Functions**:

- `get_user_statistics()`: Optimized stats query
- `is_last_admin(user_id)`: Check if user is last admin

## Risks & Mitigations

1. **Risk**: Accidental deletion of admin accounts

   - **Mitigation**: Cannot delete last admin, cannot delete self, confirmation dialogs

2. **Risk**: Unauthorized access to user data

   - **Mitigation**: Strict RLS policies, admin authentication on all routes

3. **Risk**: Performance issues with large user lists

   - **Mitigation**: Pagination, indexed queries, virtualized table

4. **Risk**: Email delivery failures

   - **Mitigation**: Retry logic, manual resend option, fallback to manual password creation

5. **Risk**: Audit log table growth

   - **Mitigation**: Implement retention policy (e.g., keep 1 year), archiving strategy

## Open Questions

None - all requirements clarified via user responses.

## Files to Create/Modify

**Database** (1 file):

- `supabase/migrations/[timestamp]_create_user_management_tables.sql`

**Types** (1 file):

- `src/features/admin/types/user-management.types.ts`

**Services** (3 files):

- `src/features/admin/services/user-management-service.ts`
- `src/features/admin/services/user-audit-service.ts`
- `src/features/admin/services/user-invitation-service.ts`

**Validation** (1 file):

- `src/features/admin/validation/user-management.schemas.ts`

**API Routes** (8 files):

- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/route.ts`
- `src/app/api/admin/users/[id]/audit-logs/route.ts`
- `src/app/api/admin/users/bulk/route.ts`
- `src/app/api/admin/users/statistics/route.ts`
- `src/app/api/admin/users/export/route.ts`
- `src/app/api/admin/invitations/route.ts`
- `src/app/api/admin/invitations/[id]/route.ts`

**Components** (8 files):

- `src/features/admin/components/users/user-list-table.tsx`
- `src/features/admin/components/users/user-form-dialog.tsx`
- `src/features/admin/components/users/user-bulk-actions.tsx`
- `src/features/admin/components/users/user-audit-logs-dialog.tsx`
- `src/features/admin/components/users/user-filters-sidebar.tsx`
- `src/features/admin/components/users/user-statistics-cards.tsx`
- `src/features/admin/components/users/user-invitation-manager.tsx`
- `src/features/admin/components/admin-user-manager.tsx` (refactor existing)

**Translations** (2 files):

- `src/messages/en/admin.json` (update)
- `src/messages/ru/admin.json` (update)

**Tests** (4 files):

- `tests/unit/user-management-service.test.ts`
- `tests/unit/user-management.schemas.test.ts`
- `tests/e2e/admin-user-management.spec.ts`
- `tests/api/users-api.test.ts`

**Total**: 28 files (1 migration, 23 new files, 4 updated files)

## Success Criteria

- ✅ Admin can view paginated list of all users with search/filters
- ✅ Admin can create users manually or send invitations
- ✅ Admin can edit user profiles and change roles
- ✅ Admin can suspend/activate accounts
- ✅ Admin can delete users (with safeguards)
- ✅ Admin can perform bulk operations on multiple users
- ✅ Admin can view audit logs for all user actions
- ✅ Admin can export user list to CSV
- ✅ Admin can reset user passwords via email
- ✅ All operations are properly secured with RLS and admin auth
- ✅ All user modifications are logged to audit trail
- ✅ UI is responsive, intuitive, and follows existing design patterns
- ✅ All components follow SRP with max 300 LOC
- ✅ All code passes TypeScript strict mode checks
- ✅ All tests pass (unit, E2E, API)
- ✅ No security vulnerabilities or exposed secrets

### To-dos

- [ ] Create database migration for audit logs and invitations tables with RLS policies
- [ ] Define TypeScript types and Zod validation schemas for user management
- [ ] Implement UserManagementService, UserAuditService, and UserInvitationService
- [ ] Create API routes for user CRUD, bulk operations, statistics, export, and invitations
- [ ] Build UI components: user list table, form dialog, filters, bulk actions, audit logs viewer
- [ ] Enhance user statistics cards with new metrics and trends
- [ ] Implement invitation management UI and email sending functionality
- [ ] Add comprehensive translations for English and Russian
- [ ] Write unit tests, E2E tests, and API tests for all functionality
- [ ] Integrate all components into admin-user-manager and test end-to-end flow