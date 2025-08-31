// ===== TYPES =====
export type {
    ChatConfig,
    ChatConversation,
    ChatError,
    ChatInputProps,
    ChatInterfaceProps, ChatMessage, ChatMessageProps, DatabaseChatMessage, DEFAULT_CHAT_CONFIG,
    FileUploadProps,
    GetConversationsResponse,
    GetMessagesResponse,
    MarkAsReadResponse,
    SendMessageRequest,
    SendMessageResponse
} from './types/chat.types'

// ===== HOOKS =====
export { useChat, useChatScroll, useChatTyping } from './hooks/use-chat'

// ===== SERVICES =====
export { ChatService, chatService } from './services/chat-service'

// ===== COMPONENTS =====
export { ChatInput } from './components/chat-input'
export { ChatInterface } from './components/chat-interface'
export { ChatMessage as ChatMessageComponent } from './components/chat-message'
export { ChatWidget } from './components/chat-widget'
export { FileUpload } from './components/file-upload'

