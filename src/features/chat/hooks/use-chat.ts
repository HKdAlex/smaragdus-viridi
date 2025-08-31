"use client"

import type {
    ChatMessage,
    GetMessagesResponse,
    SendMessageRequest,
    UseChatReturn,
    UseChatTypingReturn,
} from '../types/chat.types'
import { useCallback, useEffect, useRef, useState } from 'react'

import { chatService } from '../services/chat-service'
import { createContextLogger } from '@/shared/utils/logger'
import { supabase } from '@/lib/supabase'

export function useChat(userId?: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const logger = createContextLogger('use-chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load initial messages
  useEffect(() => {
    if (!userId) return

    loadMessages()
  }, [userId])

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return

    logger.info('Setting up chat subscription', { userId })

    const subscription = supabase
      .channel(`chat-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          setMessages(prev => [...prev, newMessage])

          logger.info('New message received', {
            messageId: newMessage.id,
            senderType: newMessage.sender_type,
            userId
          })

          // Scroll to bottom when new message arrives
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
        logger.info('Chat subscription status', { status, userId })
      })

    return () => {
      logger.info('Cleaning up chat subscription', { userId })
      subscription.unsubscribe()
    }
  }, [userId])

  const loadMessages = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response: GetMessagesResponse = await chatService.getMessages(userId)

      if (response.success) {
        setMessages(response.messages)
        logger.info('Messages loaded successfully', {
          messageCount: response.messages.length,
          userId
        })
      } else {
        logger.error('Failed to load messages', { error: response.error, userId })
      }
    } catch (error) {
      logger.error('Failed to load messages', error as Error, { userId })
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const sendMessage = useCallback(async (
    content: string,
    attachments?: File[]
  ): Promise<void> => {
    if (!userId || !content.trim()) return

    try {
      const request: SendMessageRequest = {
        content: content.trim(),
        attachments
      }

      const response = await chatService.sendMessage(userId, request)

      if (response.success && response.message) {
        // Message will be added via real-time subscription
        logger.info('Message sent successfully', {
          messageId: response.message.id,
          userId
        })
      } else {
        logger.error('Failed to send message', { error: response.error, userId })
        throw new Error(response.error || 'Failed to send message')
      }
    } catch (error) {
      logger.error('Failed to send message', error as Error, { userId })
      throw error
    }
  }, [userId])

  const markAsRead = useCallback(async (messageId: string): Promise<void> => {
    if (!userId) return

    try {
      const response = await chatService.markAsRead(messageId, userId)

      if (response.success) {
        // Update local state
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? { ...msg, is_read: true } : msg
          )
        )

        logger.info('Message marked as read', { messageId, userId })
      } else {
        logger.error('Failed to mark message as read', {
          error: response.error,
          messageId,
          userId
        })
      }
    } catch (error) {
      logger.error('Failed to mark message as read', error as Error, {
        messageId,
        userId
      })
    }
  }, [userId])

  const clearMessages = useCallback(() => {
    setMessages([])
    logger.info('Messages cleared', { userId })
  }, [userId])

  return {
    messages,
    isConnected,
    isTyping: false, // Would be implemented with typing indicators
    sendMessage,
    markAsRead,
    clearMessages,
  }
}

export function useChatTyping(userId?: string): UseChatTypingReturn {
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const logger = createContextLogger('use-chat-typing')

  const startTyping = useCallback(() => {
    setIsTyping(true)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      logger.info('Typing stopped automatically', { userId })
    }, 3000)

    logger.info('Typing started', { userId })
  }, [userId])

  const stopTyping = useCallback(() => {
    setIsTyping(false)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    logger.info('Typing stopped manually', { userId })
  }, [userId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return {
    isTyping,
    startTyping,
    stopTyping,
  }
}

// Hook for chat scrolling
export function useChatScroll() {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    // Scroll to bottom on mount
    scrollToBottom('auto')
  }, [])

  return {
    messagesEndRef,
    scrollToBottom,
  }
}
