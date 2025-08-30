// ===== TYPES =====
export type {
  ChatMessage,
  ChatConversation,
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesResponse,
  MarkAsReadResponse,
  GetConversationsResponse,
  ChatInterfaceProps,
  ChatMessageProps,
  ChatInputProps,
  FileUploadProps,
  ChatConfig,
  ChatError,
  DEFAULT_CHAT_CONFIG,
} from './types/chat.types'

// ===== HOOKS =====
export { useChat, useChatTyping, useChatScroll } from './hooks/use-chat'

// ===== SERVICES =====
export { ChatService, chatService } from './services/chat-service'

// ===== COMPONENTS =====
export { ChatInterface } from './components/chat-interface'
export { ChatMessage } from './components/chat-message'
export { ChatInput } from './components/chat-input'
export { FileUpload } from './components/file-upload'
export { ChatWidget } from './components/chat-widget'
