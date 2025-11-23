# Chat Enhancements Plan: Anonymous Users & Threaded Conversations

## Overview

This document outlines the implementation plan for two major chat enhancements:
1. **Anonymous Chat Support** - Allow non-logged-in users to use chat
2. **Threaded Conversations** - Support multiple conversation threads per user

---

## 1. Anonymous Chat Support

### Current State
- Chat widget only visible to logged-in users (`if (!user) return null`)
- API endpoints require authentication (401 if not logged in)
- Messages linked to authenticated `user_id`

### Requirements

#### 1.1 Anonymous User Identification
- **Session-based tracking**: Use browser session/cookie to identify anonymous users
- **Temporary user ID**: Generate UUID for anonymous sessions (stored in cookie/localStorage)
- **Email collection**: Prompt for email on first message or before sending

#### 1.2 Database Changes

**New Table: `anonymous_chat_sessions`**
```sql
CREATE TABLE anonymous_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL, -- Cookie/session identifier
  email TEXT, -- Collected email (optional initially)
  name TEXT, -- Optional name
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  converted_to_user_id UUID REFERENCES auth.users(id) -- If user signs up
);

CREATE INDEX idx_anonymous_sessions_session_id ON anonymous_chat_sessions(session_id);
CREATE INDEX idx_anonymous_sessions_email ON anonymous_chat_sessions(email);
```

**Modify `chat_messages` table:**
```sql
ALTER TABLE chat_messages 
  ADD COLUMN anonymous_session_id UUID REFERENCES anonymous_chat_sessions(id),
  ADD COLUMN anonymous_email TEXT; -- Denormalized for easier querying

-- Update constraint: either user_id OR anonymous_session_id must be set
ALTER TABLE chat_messages 
  ADD CONSTRAINT chat_messages_user_or_anonymous 
  CHECK ((user_id IS NOT NULL) OR (anonymous_session_id IS NOT NULL));
```

#### 1.3 API Changes

**`/api/chat/route.ts`**
- **GET**: Accept either `user_id` (authenticated) or `session_id` (anonymous)
- **POST**: Accept anonymous messages with `session_id` and optional `email`
- Create anonymous session if doesn't exist
- Link messages to `anonymous_session_id` instead of `user_id`

**New endpoint: `/api/chat/anonymous/session`**
- POST: Create new anonymous session, return `session_id`
- GET: Retrieve session by `session_id`

#### 1.4 UI Changes

**`chat-widget.tsx`**
- Remove `if (!user) return null` check
- Show widget to everyone
- For anonymous users:
  - Show email input field (optional but recommended)
  - Use `session_id` from cookie/localStorage
  - Display "Guest" or "Anonymous" label

**`chat-interface.tsx`**
- Accept `userId` OR `sessionId`
- Handle both authenticated and anonymous flows

**`use-chat.ts` hook**
- Support both `userId` and `sessionId`
- Create anonymous session if needed
- Store `session_id` in cookie/localStorage

#### 1.5 Admin Dashboard Changes

**Conversation List**
- Show both authenticated users and anonymous sessions
- Display "Guest" or email for anonymous sessions
- Group by `user_id` OR `anonymous_session_id`

**Conversation Header**
- Show email if available for anonymous sessions
- Display "Anonymous User" if no email provided
- Option to "Convert to User Account" if email matches existing user

#### 1.6 Email Notifications

- Send notifications to anonymous users if email provided
- Include "Sign up to continue conversation" CTA in emails
- Link anonymous session to user account if they sign up

---

## 2. Threaded Conversations

### Current State
- One conversation thread per user (grouped by `user_id`)
- All messages in single chronological thread
- No topic/subject separation

### Requirements

#### 2.1 Database Changes

**New Table: `conversations`**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_session_id UUID REFERENCES anonymous_chat_sessions(id) ON DELETE CASCADE,
  subject TEXT, -- Optional: "Order #123", "Product Question", etc.
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  assigned_to UUID REFERENCES auth.users(id), -- Assigned admin
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  tags TEXT[], -- For categorization
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_anonymous_session ON conversations(anonymous_session_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_assigned_to ON conversations(assigned_to);
```

**Modify `chat_messages` table:**
```sql
ALTER TABLE chat_messages 
  ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- Update constraint: conversation_id is required
ALTER TABLE chat_messages 
  ALTER COLUMN conversation_id SET NOT NULL;

CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
```

**Migration Strategy:**
```sql
-- Step 1: Create conversations table
-- Step 2: For each existing user_id, create a default conversation
INSERT INTO conversations (id, user_id, subject, status, created_at)
SELECT 
  gen_random_uuid(),
  user_id,
  'Default Conversation',
  'active',
  MIN(created_at)
FROM chat_messages
GROUP BY user_id;

-- Step 3: Link existing messages to conversations
UPDATE chat_messages cm
SET conversation_id = c.id
FROM conversations c
WHERE cm.user_id = c.user_id;

-- Step 4: Add NOT NULL constraint
ALTER TABLE chat_messages 
  ALTER COLUMN conversation_id SET NOT NULL;
```

#### 2.2 API Changes

**`/api/chat/route.ts`**
- **GET**: Accept optional `conversation_id` parameter
  - If provided: return messages for that conversation
  - If not: return all conversations for user (summary)
- **POST**: Accept `conversation_id` or create new conversation
  - If `conversation_id` provided: add message to existing thread
  - If not: create new conversation and add message

**New endpoint: `/api/chat/conversations`**
- GET: List all conversations for user
- POST: Create new conversation (with optional subject)

**New endpoint: `/api/chat/conversations/[id]`**
- GET: Get conversation details
- PATCH: Update conversation (status, subject, assign, etc.)
- DELETE: Archive conversation

#### 2.3 Admin API Changes

**`/api/admin/chat/conversations`**
- GET: List all conversations (with filters: status, assigned_to, priority)
- Support pagination and filtering

**`/api/admin/chat/conversations/[id]`**
- GET: Get conversation with all messages
- PATCH: Update conversation (assign, status, priority, tags)
- POST: Add message to conversation

**`/api/admin/chat/send/route.ts`**
- Update to require `conversation_id` instead of `user_id`
- Link message to conversation

#### 2.4 UI Changes

**User Side (`chat-widget.tsx`, `chat-interface.tsx`)**
- **Conversation Selector**: Dropdown or tabs to switch between conversations
- **New Conversation Button**: "Start New Conversation" button
- **Conversation List**: Show list of user's conversations with:
  - Subject/title
  - Last message preview
  - Unread count per conversation
  - Status indicator

**Admin Side (`admin-chat-dashboard.tsx`)**
- **Conversation List**: Group by conversation, not just user
- **Conversation Details Panel**: Show conversation metadata:
  - Subject
  - Status (active/resolved/archived)
  - Assigned admin
  - Priority
  - Tags
  - Created/resolved dates
- **Actions**: Assign, resolve, archive, change priority
- **Filters**: Filter by status, assigned admin, priority, tags

**New Components:**
- `ConversationSelector` - Dropdown/tabs for switching conversations
- `NewConversationDialog` - Modal to create new conversation with subject
- `ConversationMetadata` - Display conversation details
- `ConversationActions` - Admin actions (assign, resolve, etc.)

#### 2.5 Type Changes

**`chat.types.ts`**
```typescript
export interface Conversation {
  id: string;
  user_id?: string;
  anonymous_session_id?: string;
  subject?: string;
  status: 'active' | 'resolved' | 'archived';
  assigned_to?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: string;
  // Computed fields
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  message_count: number;
}

export interface ChatMessage {
  // ... existing fields
  conversation_id: string; // NEW: Required
}
```

#### 2.6 Service Changes

**`chat-service.ts`**
- `getConversations()`: Return list of conversations (not just grouped by user)
- `getConversationMessages(conversationId)`: Get messages for specific conversation
- `createConversation(subject?)`: Create new conversation
- `updateConversation(id, updates)`: Update conversation metadata

**`admin-chat-service.ts`**
- `getConversations()`: Return all conversations with filters
- `getConversation(id)`: Get conversation with messages
- `updateConversation(id, updates)`: Update conversation (assign, status, etc.)
- `sendMessage(conversationId, content)`: Send message to conversation

---

## Implementation Order

### Phase 1: Anonymous Chat (Foundation)
1. Create `anonymous_chat_sessions` table
2. Modify `chat_messages` to support anonymous sessions
3. Update API endpoints to handle anonymous requests
4. Update UI to show chat widget to everyone
5. Implement session management (cookie/localStorage)
6. Update admin dashboard to show anonymous conversations

### Phase 2: Threaded Conversations
1. Create `conversations` table
2. Migrate existing messages to conversations (one per user)
3. Update `chat_messages` to require `conversation_id`
4. Update API endpoints to support conversations
5. Update user UI with conversation selector
6. Update admin UI with conversation management
7. Add conversation actions (create, assign, resolve, archive)

---

## Considerations

### Anonymous Chat
- **Spam Prevention**: Rate limiting per session, CAPTCHA for anonymous users
- **Session Expiry**: Clean up old anonymous sessions (e.g., 30 days inactive)
- **Email Validation**: Validate email format, prevent abuse
- **Conversion**: Link anonymous session to user account on signup
- **Privacy**: Clear messaging about data collection

### Threaded Conversations
- **Migration**: Careful migration of existing single-thread conversations
- **Default Behavior**: Auto-create conversation if none specified (backward compatibility)
- **Performance**: Indexes on `conversation_id`, efficient queries
- **UI/UX**: Clear conversation switching, visual indicators for active conversation
- **Admin Workflow**: Easy conversation assignment, status management

---

## Testing Checklist

### Anonymous Chat
- [ ] Anonymous user can open chat widget
- [ ] Anonymous user can send messages without email
- [ ] Anonymous user can provide email
- [ ] Anonymous session persists across page refreshes
- [ ] Admin sees anonymous conversations
- [ ] Email notifications work for anonymous users
- [ ] Anonymous session converts to user account on signup
- [ ] Rate limiting prevents spam

### Threaded Conversations
- [ ] User can create new conversation
- [ ] User can switch between conversations
- [ ] Messages are correctly linked to conversations
- [ ] Admin can see all conversations
- [ ] Admin can assign/resolve/archive conversations
- [ ] Migration preserves existing messages
- [ ] Backward compatibility (auto-create conversation if needed)
- [ ] Real-time updates work per conversation

---

## Future Enhancements

- **Conversation Templates**: Pre-defined conversation types (Order Support, Product Question, etc.)
- **Conversation Search**: Search across conversations and messages
- **Conversation Analytics**: Track resolution time, response time, etc.
- **Auto-assignment**: Assign conversations based on rules/tags
- **Conversation Notes**: Internal admin notes per conversation
- **Conversation History**: View conversation timeline/activity log

