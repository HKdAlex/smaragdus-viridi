import type { DatabaseChatMessage } from '@/shared/types'

// ===== DATABASE LAYER =====
// Database types are imported from shared types
export type { DatabaseChatMessage }

// ===== APPLICATION LAYER EXTENSIONS =====

// Extended chat message with additional UI properties
export interface ChatMessage {
  readonly id: string
  readonly user_id: string
  readonly admin_id: string | null
  readonly content: string
  readonly attachments: string[] | null
  readonly sender_type: 'user' | 'admin'
  readonly is_auto_response: boolean | null
  readonly is_read: boolean | null
  readonly created_at: string | null
}

// Chat conversation/session
export interface ChatConversation {
  readonly user_id: string
  readonly user_name?: string
  readonly last_message: string
  readonly last_message_at: string | null
  readonly unread_count: number
  readonly has_attachments: boolean
  readonly is_online: boolean
}

// Chat participant types
export type ChatSenderType = 'user' | 'admin'

// ===== API REQUEST/RESPONSE TYPES =====

export interface SendMessageRequest {
  content: string
  attachments?: File[]
}

export interface SendMessageResponse {
  success: boolean
  message?: ChatMessage
  error?: string
}

export interface GetMessagesResponse {
  success: boolean
  messages: ChatMessage[]
  hasMore: boolean
  error?: string
}

export interface MarkAsReadRequest {
  messageId: string
}

export interface MarkAsReadResponse {
  success: boolean
  error?: string
}

export interface GetConversationsResponse {
  success: boolean
  conversations: ChatConversation[]
  error?: string
}

// ===== UI COMPONENT PROPS =====

export interface ChatMessageProps {
  message: ChatMessage
  isOwn: boolean
  onAttachmentClick?: (attachmentUrl: string) => void
}

export interface ChatInterfaceProps {
  userId?: string
  onClose?: () => void
  className?: string
}

export interface ChatInputProps {
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>
  isTyping?: boolean
  disabled?: boolean
  placeholder?: string
}

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  acceptedTypes?: string
  maxSize?: number // in bytes
  maxFiles?: number
  disabled?: boolean
}

// ===== CHAT CONFIGURATION =====

export interface ChatConfig {
  maxMessageLength: number
  maxAttachments: number
  maxFileSize: number // in bytes
  supportedFileTypes: string[]
  autoResponseDelay: number // in milliseconds
}

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  maxMessageLength: 2000,
  maxAttachments: 5,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFileTypes: ['image/*', '.pdf', '.doc', '.docx'],
  autoResponseDelay: 2000,
}

// ===== CHAT EVENT TYPES =====

export interface ChatEventMap {
  'message:new': ChatMessage
  'message:read': { messageId: string; userId: string }
  'user:typing': { userId: string; isTyping: boolean }
  'user:online': { userId: string }
  'user:offline': { userId: string }
}

// ===== UTILITY TYPES =====

export type ChatMessageId = string
export type ChatUserId = string
export type ChatAdminId = string

// File attachment types
export interface ChatAttachment {
  name: string
  url: string
  type: string
  size: number
}

// Typing indicator state
export interface TypingState {
  userId: string
  isTyping: boolean
  timestamp: number
}

// Online status
export interface OnlineStatus {
  userId: string
  isOnline: boolean
  lastSeen?: string
}

// ===== ERROR TYPES =====

export class ChatError extends Error {
  constructor(
    public code: 'MESSAGE_TOO_LONG' | 'FILE_TOO_LARGE' | 'UNSUPPORTED_FILE' | 'NETWORK_ERROR' | 'PERMISSION_DENIED',
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ChatError'
  }
}

// ===== HOOK TYPES =====

export interface UseChatReturn {
  messages: ChatMessage[]
  isConnected: boolean
  isTyping: boolean
  sendMessage: (content: string, attachments?: File[]) => Promise<void>
  markAsRead: (messageId: string) => Promise<void>
  clearMessages: () => void
}

export interface UseChatTypingReturn {
  isTyping: boolean
  startTyping: () => void
  stopTyping: () => void
}

// ===== ADMIN DASHBOARD TYPES =====

export interface AdminChatSession extends ChatConversation {
  readonly total_messages: number
  readonly last_admin_response?: string | null
  readonly priority: 'low' | 'medium' | 'high'
  readonly tags?: string[]
}

export interface AdminChatStats {
  total_conversations: number
  active_conversations: number
  unread_messages: number
  average_response_time: number
  satisfaction_score?: number
}
