<!-- 0e376a0a-36e5-4123-a4c1-75c39a41fc3e 15ff36cb-34ec-40da-946e-bf16726b8a35 -->
# Live Chat Feature Finalization Plan - Clean Architecture

## Architecture Principles

### Single Responsibility Principle (SRP)

- **Email Service**: Pure email sending only (no business logic)
- **Notification Orchestrator**: Decides WHEN to send (business rules)
- **Template Service**: Manages templates (SSOT for email content)
- **Admin Chat Service**: Admin chat operations (separate from user chat)
- **API Routes**: HTTP handling and validation only
- **Components**: UI rendering only (no business logic)

### Single Source of Truth (SSOT)

- **Templates**: `src/lib/email/templates/chat-templates.ts` (all email content)
- **Configuration**: `src/lib/email/config/chat-email-config.ts` (all email settings)
- **Types**: `src/features/chat/types/chat.types.ts` (chat types)
- **User Preferences**: `user_preferences` table (notification preferences)
- **Chat Messages**: `chat_messages` table (message state)

### Separation of Concerns

- **API Layer**: HTTP handlers, zod validation, error mapping
- **Service Layer**: Business logic, orchestration
- **Data Layer**: Database queries (via Supabase)
- **UI Layer**: Components (no business logic)
- **Hook Layer**: State management, side effects

### Clean Code Practices

- Functions < 50 LOC (split if larger)
- Pure functions where possible
- Explicit dependencies (dependency injection)
- Typed interfaces (no implicit any)
- Error handling separation (custom error classes)

## Implementation Plan

### Phase 1: Core Infrastructure (SSOT & Configuration)

#### 1.1 Email Configuration (SSOT)

**File**: `src/lib/email/config/chat-email-config.ts`

**Purpose**: Single source of truth for all email configuration

**Exports**:

```typescript
export const CHAT_EMAIL_CONFIG = {
  fromAddress: process.env.CHAT_EMAIL_FROM || 'noreply@crystallique.com',
  unattendedAlertThresholdMinutes: 15,
  rateLimitWindowMinutes: 60,
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://crystallique.com',
} as const;

export function getEmailFromAddress(): string;
export function getUnattendedAlertThreshold(): number;
export function getRateLimitWindow(): number;
```

**No business logic**, only configuration constants.

#### 1.2 Email Template Service (SSOT)

**File**: `src/lib/email/templates/chat-templates.ts`

**Purpose**: Single source of truth for all email templates

**Exports**:

```typescript
export enum ChatEmailTemplateType {
  NEW_USER_MESSAGE_TO_ADMIN = 'new_user_message_to_admin',
  ADMIN_RESPONSE_TO_USER = 'admin_response_to_user',
  UNATTENDED_MESSAGE_ALERT = 'unattended_message_alert',
  CHAT_SUMMARY = 'chat_summary',
}

export interface ChatEmailTemplateData {
  userName?: string;
  userEmail?: string;
  messageContent: string;
  messagePreview?: string;
  conversationUrl: string;
  siteName: string;
  locale: 'en' | 'ru';
  waitTime?: string;
}

export function getChatEmailTemplate(
  type: ChatEmailTemplateType,
  locale: 'en' | 'ru'
): ChatEmailTemplate;

export function renderChatEmailTemplate(
  template: ChatEmailTemplate,
  data: ChatEmailTemplateData
): { subject: string; html: string };
```

**Templates** (EN/RU support):

1. `NEW_USER_MESSAGE_TO_ADMIN` - User sends message
2. `ADMIN_RESPONSE_TO_USER` - Admin responds
3. `UNATTENDED_MESSAGE_ALERT` - Unattended message alert
4. `CHAT_SUMMARY` - Conversation summary (optional)

**Pure functions** - no side effects, only template rendering.

#### 1.3 Email Service (SRP: Email Sending Only)

**File**: `src/lib/email/services/chat-email-service.ts`

**Purpose**: Pure email sending service (no business logic)

**Exports**:

```typescript
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailMetadata {
  chatMessageId?: string;
  userId?: string;
  notificationType: ChatEmailTemplateType;
}

export class ChatEmailService {
  constructor(private resendApiKey: string);
  
  async sendEmail(
    to: string | string[],
    subject: string,
    html: string,
    metadata?: EmailMetadata
  ): Promise<EmailSendResult>;
}
```

**No business logic** - only email delivery via Resend SDK.

#### 1.4 Notification Orchestrator (SRP: Business Logic)

**File**: `src/features/chat/services/chat-notification-orchestrator.ts`

**Purpose**: Decides WHEN and TO WHOM to send notifications (business rules)

**Exports**:

```typescript
export class ChatNotificationOrchestrator {
  constructor(
    private emailService: ChatEmailService,
    private templateService: typeof import('@/lib/email/templates/chat-templates'),
    private userPreferencesService: UserPreferencesService,
    private adminService: AdminService
  );

  async handleUserMessageSent(
    userId: string,
    message: ChatMessage
  ): Promise<void>;

  async handleAdminMessageSent(
    userId: string,
    message: ChatMessage,
    adminId: string
  ): Promise<void>;

  async checkUnattendedMessages(): Promise<void>;
}
```

**Business logic only** - no email sending, delegates to services.

### Phase 2: Admin Chat Dashboard

#### 2.1 Admin Chat Service (SRP: Admin Chat Operations)

**File**: `src/features/admin/services/admin-chat-service.ts`

**Purpose**: Admin-specific chat operations (separate from user chat service)

**Exports**:

```typescript
export class AdminChatService {
  constructor(private supabase: SupabaseClient);

  async getConversations(): Promise<ChatConversation[]>;
  async getConversationMessages(userId: string): Promise<ChatMessage[]>;
  async sendAdminMessage(
    userId: string,
    content: string,
    adminId: string
  ): Promise<ChatMessage>;
  async markConversationAsRead(userId: string): Promise<void>;
}
```

**No UI logic**, only data operations.

#### 2.2 Admin Chat Hook (SRP: State Management)

**File**: `src/features/admin/hooks/use-admin-chat.ts`

**Purpose**: State management for admin chat (React hook)

**Exports**:

```typescript
export interface UseAdminChatReturn {
  conversations: ChatConversation[];
  selectedConversation: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  selectConversation: (userId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: () => Promise<void>;
}

export function useAdminChat(): UseAdminChatReturn;
```

**No business logic**, only state and side effects.

#### 2.3 Admin Chat Dashboard Component (SRP: UI Only)

**File**: `src/features/admin/components/admin-chat-dashboard.tsx`

**Purpose**: UI component for admin chat dashboard

**Structure** (split if > 150 LOC):

- `AdminChatDashboard` - Main component (< 100 LOC)
- `ConversationList` - Sidebar with conversations (< 100 LOC)
- `AdminChatInterface` - Chat interface wrapper (< 50 LOC)
- `ConversationHeader` - User info header (< 50 LOC)

**No business logic** - calls hooks/services only.

#### 2.4 Admin Dashboard Integration

**File**: `src/features/admin/components/admin-dashboard.tsx`

**Changes**:

- Add "chat" to `AdminTab` type
- Add chat tab to navigation with MessageCircle icon
- Add chat tab rendering in `renderTabContent()`
- Add unread count badge (via hook)

**Translation Keys**: Add to `src/messages/en/admin.json` and `src/messages/ru/admin.json`

### Phase 3: Email Notification Integration

#### 3.1 User Preferences Service (SRP: Preferences Access)

**File**: `src/features/user/services/user-preferences-service.ts` (extend if exists)

**Purpose**: Access user notification preferences (SSOT for preferences)

**Exports**:

```typescript
export class UserPreferencesService {
  async getUserNotificationPreferences(userId: string): Promise<UserPreferences>;
  async shouldSendChatNotification(userId: string): Promise<boolean>;
}
```

**No business logic**, only data access.

#### 3.2 Admin Service (SRP: Admin Data Access)

**File**: `src/features/admin/services/admin-service.ts` (extend if exists)

**Purpose**: Access admin data (SSOT for admin info)

**Exports**:

```typescript
export class AdminService {
  async getActiveAdmins(): Promise<Admin[]>;
  async getAdminNotificationPreferences(adminId: string): Promise<AdminPreferences>;
}
```

**No business logic**, only data access.

#### 3.3 API Route Integration

**File**: `src/app/api/chat/route.ts` (POST handler)

**Changes**:

- After message creation, call `ChatNotificationOrchestrator.handleUserMessageSent()`
- Keep HTTP handling separate from business logic
- Use dependency injection pattern

**File**: `src/app/api/admin/chat/send/route.ts` (POST handler)

**Changes**:

- After message creation, call `ChatNotificationOrchestrator.handleAdminMessageSent()`
- Keep HTTP handling separate from business logic

#### 3.4 Unattended Message Checker

**File**: `src/app/api/admin/chat/check-unattended/route.ts` (NEW)

**Purpose**: Scheduled endpoint to check for unattended messages

**Implementation**:

- Calls `ChatNotificationOrchestrator.checkUnattendedMessages()`
- Can be called by cron job or scheduled task

### Phase 4: Database Enhancements (Optional)

#### 4.1 Chat Sessions Function (SSOT for Conversation Queries)

**File**: `supabase/migrations/XXXXXX_create_chat_sessions_function.sql`

**Purpose**: Optimized query for conversations (SSOT for conversation data)

**Function**: `get_active_chat_sessions()`

- Returns conversation summaries
- Single query instead of multiple

#### 4.2 Email Notification Tracking (Optional)

**File**: `supabase/migrations/XXXXXX_add_chat_email_tracking.sql`

**Purpose**: Track sent emails to prevent spam

**Table**: `chat_email_notifications`

- Tracks sent notifications
- Used for rate limiting

## File Structure

```
src/
├── lib/
│   └── email/
│       ├── config/
│       │   └── chat-email-config.ts (NEW)
│       ├── services/
│       │   └── chat-email-service.ts (NEW)
│       └── templates/
│           └── chat-templates.ts (NEW)
├── features/
│   ├── admin/
│   │   ├── components/
│   │   │   ├── admin-chat-dashboard.tsx (NEW)
│   │   │   ├── conversation-list.tsx (NEW, subcomponent)
│   │   │   └── conversation-header.tsx (NEW, subcomponent)
│   │   ├── hooks/
│   │   │   └── use-admin-chat.ts (NEW)
│   │   └── services/
│   │       ├── admin-chat-service.ts (NEW)
│   │       └── admin-service.ts (EXTEND if exists)
│   ├── chat/
│   │   └── services/
│   │       └── chat-notification-orchestrator.ts (NEW)
│   └── user/
│       └── services/
│           └── user-preferences-service.ts (EXTEND if exists)
└── app/
    └── api/
        ├── chat/
        │   └── route.ts (UPDATE POST handler)
        └── admin/
            └── chat/
                ├── send/route.ts (UPDATE POST handler)
                └── check-unattended/route.ts (NEW)

supabase/
└── migrations/
    ├── XXXXXX_create_chat_sessions_function.sql (NEW, optional)
    └── XXXXXX_add_chat_email_tracking.sql (NEW, optional)
```

## Public Interfaces

### ChatEmailService

```typescript
class ChatEmailService {
  async sendEmail(
    to: string | string[],
    subject: string,
    html: string,
    metadata?: EmailMetadata
  ): Promise<EmailSendResult>;
}
```

### ChatNotificationOrchestrator

```typescript
class ChatNotificationOrchestrator {
  async handleUserMessageSent(userId: string, message: ChatMessage): Promise<void>;
  async handleAdminMessageSent(userId: string, message: ChatMessage, adminId: string): Promise<void>;
  async checkUnattendedMessages(): Promise<void>;
}
```

### AdminChatService

```typescript
class AdminChatService {
  async getConversations(): Promise<ChatConversation[]>;
  async getConversationMessages(userId: string): Promise<ChatMessage[]>;
  async sendAdminMessage(userId: string, content: string, adminId: string): Promise<ChatMessage>;
  async markConversationAsRead(userId: string): Promise<void>;
}
```

## Data Model & RLS

### Tables Used

- `chat_messages` - Existing (no changes)
- `user_preferences` - Existing (read only)
- `user_profiles` - Existing (read only)
- `chat_email_notifications` - New (optional, for tracking)

### RLS Policies

- No new RLS policies needed (existing policies apply)
- Admin chat service uses admin client (bypasses RLS)

## Test Plan

### Unit Tests

- `ChatEmailService.sendEmail()` - Email sending logic
- `ChatNotificationOrchestrator.handleUserMessageSent()` - Business logic
- `AdminChatService.getConversations()` - Data fetching
- Template rendering functions - Template logic

### Integration Tests

- User sends message → Email sent to admin
- Admin responds → Email sent to user (if preferences enabled)
- Unattended message check → Alert sent
- Notification preferences respected

### E2E Tests (Playwright)

- Admin dashboard chat flow
- Email notification delivery
- Real-time updates

## Risks

**Risk**: Service coupling

**Mitigation**: Dependency injection, clear interfaces

**Risk**: Email delivery failures

**Mitigation**: Retry logic, error handling, fallback notifications

**Risk**: Performance with many conversations

**Mitigation**: Pagination, database indexes, efficient queries

**Risk**: Code duplication

**Mitigation**: Reuse existing chat components, shared types

## Open Questions

None - architecture is clear with SRP/SSOT principles applied.

### To-dos

- [ ] Create AdminChatDashboard component with conversation list and chat interface
- [ ] Create use-admin-chat hook for admin chat operations and real-time subscriptions
- [ ] Integrate chat tab into admin dashboard navigation and routing
- [ ] Create chat-email-service.ts with Resend integration for sending chat notifications
- [ ] Create email templates for all chat notification scenarios (EN/RU)
- [ ] Integrate email notification when user sends message (notify admins)
- [ ] Integrate email notification when admin responds (notify user if preferences enabled)
- [ ] Implement unattended message alert system with rate limiting
- [ ] Integrate user notification preferences check before sending emails
- [ ] Create database function for optimized chat sessions query (optional)
- [ ] Add chat-related translations to admin.json (EN/RU)
- [ ] Implement typing indicators using Supabase presence (optional enhancement)
- [ ] Enhance read receipts display in chat messages (optional enhancement)
- [ ] Test complete chat flow with email notifications and admin dashboard