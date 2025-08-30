import { supabase } from '@/lib/supabase'
import { createContextLogger } from '@/shared/utils/logger'
import type {
  ChatMessage,
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesResponse,
  MarkAsReadResponse,
  GetConversationsResponse,
  ChatConversation,
  ChatError,
  DEFAULT_CHAT_CONFIG,
} from '../types/chat.types'

export class ChatService {
  private supabase = supabase
  private logger = createContextLogger('chat-service')

  /**
   * Send a new chat message
   */
  async sendMessage(
    userId: string,
    request: SendMessageRequest
  ): Promise<SendMessageResponse> {
    try {
      // Validate message content
      if (!request.content.trim()) {
        throw new ChatError('MESSAGE_TOO_LONG', 'Message content cannot be empty')
      }

      if (request.content.length > DEFAULT_CHAT_CONFIG.maxMessageLength) {
        throw new ChatError(
          'MESSAGE_TOO_LONG',
          `Message too long. Maximum ${DEFAULT_CHAT_CONFIG.maxMessageLength} characters allowed.`
        )
      }

      // Handle file attachments if any
      let attachmentUrls: string[] = []
      if (request.attachments && request.attachments.length > 0) {
        attachmentUrls = await this.uploadAttachments(request.attachments)
      }

      // Insert message into database
      const { data: message, error } = await this.supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          content: request.content.trim(),
          attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
          sender_type: 'user',
          is_read: false,
        })
        .select()
        .single()

      if (error) {
        this.logger.error('Failed to send message', error, { userId })
        throw new ChatError('NETWORK_ERROR', 'Failed to send message')
      }

      this.logger.info('Message sent successfully', {
        messageId: message.id,
        userId,
        contentLength: request.content.length,
        attachmentCount: attachmentUrls.length
      })

      return {
        success: true,
        message: message as ChatMessage
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('Failed to send message', error as Error, { userId })

      if (error instanceof ChatError) {
        return { success: false, error: error.message }
      }

      return { success: false, error: 'Failed to send message. Please try again.' }
    }
  }

  /**
   * Get messages for a user
   */
  async getMessages(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<GetMessagesResponse> {
    try {
      const { data: messages, error, count } = await this.supabase
        .from('chat_messages')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        this.logger.error('Failed to fetch messages', error, { userId })
        throw new ChatError('NETWORK_ERROR', 'Failed to load messages')
      }

      // Reverse to get chronological order
      const orderedMessages = messages?.reverse() || []

      this.logger.info('Messages fetched successfully', {
        userId,
        messageCount: orderedMessages.length,
        hasMore: (count || 0) > offset + limit
      })

      return {
        success: true,
        messages: orderedMessages as ChatMessage[],
        hasMore: (count || 0) > offset + limit
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('Failed to fetch messages', error as Error, { userId })

      if (error instanceof ChatError) {
        return { success: false, error: error.message, messages: [], hasMore: false }
      }

      return {
        success: false,
        error: 'Failed to load messages. Please try again.',
        messages: [],
        hasMore: false
      }
    }
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string, userId: string): Promise<MarkAsReadResponse> {
    try {
      const { error } = await this.supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('user_id', userId) // Ensure user can only mark their own messages

      if (error) {
        this.logger.error('Failed to mark message as read', error, { messageId, userId })
        throw new ChatError('NETWORK_ERROR', 'Failed to mark message as read')
      }

      this.logger.info('Message marked as read', { messageId, userId })

      return { success: true }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('Failed to mark message as read', error as Error, { messageId, userId })

      if (error instanceof ChatError) {
        return { success: false, error: error.message }
      }

      return { success: false, error: 'Failed to mark message as read. Please try again.' }
    }
  }

  /**
   * Get all conversations for admin dashboard
   */
  async getConversations(): Promise<GetConversationsResponse> {
    try {
      // This would typically use a stored procedure or complex query
      // For now, we'll use a simplified approach
      const { data: conversations, error } = await this.supabase
        .rpc('get_active_chat_sessions')

      if (error) {
        // Fallback to manual query if RPC doesn't exist
        this.logger.warn('RPC get_active_chat_sessions not found, using fallback query', error)

        const { data: messages, error: messagesError } = await this.supabase
          .from('chat_messages')
          .select(`
            user_id,
            content,
            created_at,
            attachments,
            sender_type,
            is_read
          `)
          .order('created_at', { ascending: false })

        if (messagesError) {
          throw new ChatError('NETWORK_ERROR', 'Failed to load conversations')
        }

        // Group messages by user_id and create conversation summaries
        const conversationMap = new Map<string, ChatConversation>()

        messages?.forEach(message => {
          if (!conversationMap.has(message.user_id)) {
            conversationMap.set(message.user_id, {
              user_id: message.user_id,
              last_message: message.content,
              last_message_at: message.created_at,
              unread_count: message.sender_type === 'user' && !message.is_read ? 1 : 0,
              has_attachments: message.attachments ? message.attachments.length > 0 : false,
              is_online: false, // Would need presence tracking
            })
          } else {
            const existing = conversationMap.get(message.user_id)!
            if (message.sender_type === 'user' && !message.is_read) {
              existing.unread_count++
            }
            if (message.attachments && message.attachments.length > 0) {
              existing.has_attachments = true
            }
          }
        })

        const conversations = Array.from(conversationMap.values())

        this.logger.info('Conversations fetched successfully (fallback)', {
          conversationCount: conversations.length
        })

        return {
          success: true,
          conversations
        }
      }

      this.logger.info('Conversations fetched successfully', {
        conversationCount: conversations?.length || 0
      })

      return {
        success: true,
        conversations: conversations as ChatConversation[] || []
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('Failed to fetch conversations', error as Error)

      if (error instanceof ChatError) {
        return { success: false, error: error.message, conversations: [] }
      }

      return {
        success: false,
        error: 'Failed to load conversations. Please try again.',
        conversations: []
      }
    }
  }

  /**
   * Upload chat attachments
   */
  private async uploadAttachments(files: File[]): Promise<string[]> {
    const uploadPromises = files.map(async (file) => {
      // Validate file
      this.validateFile(file)

      // Generate unique filename
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}_${file.name}`
      const filePath = `chat-attachments/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('chat-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        this.logger.error('Failed to upload attachment', error, { fileName: file.name })
        throw new ChatError('NETWORK_ERROR', `Failed to upload ${file.name}`)
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    })

    return Promise.all(uploadPromises)
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: File): void {
    // Check file size
    if (file.size > DEFAULT_CHAT_CONFIG.maxFileSize) {
      throw new ChatError(
        'FILE_TOO_LARGE',
        `File ${file.name} is too large. Maximum size is ${DEFAULT_CHAT_CONFIG.maxFileSize / 1024 / 1024}MB.`
      )
    }

    // Check file type
    const isSupported = DEFAULT_CHAT_CONFIG.supportedFileTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      } else {
        return file.type.match(type)
      }
    })

    if (!isSupported) {
      throw new ChatError(
        'UNSUPPORTED_FILE',
        `File type ${file.type} is not supported. Supported types: ${DEFAULT_CHAT_CONFIG.supportedFileTypes.join(', ')}`
      )
    }
  }
}

// Export singleton instance
export const chatService = new ChatService()
