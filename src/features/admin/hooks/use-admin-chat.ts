/**
 * Admin Chat Hook (SRP: State Management)
 * 
 * State management for admin chat (React hook).
 * No business logic - only state and side effects.
 */

"use client";

import type { ChatConversation, ChatMessage } from '@/features/chat/types/chat.types';
import { AdminChatService } from '../services/admin-chat-service';
import { useCallback, useEffect, useState } from 'react';
import { createContextLogger } from '@/shared/utils/logger';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '../context/admin-context';

export interface UseAdminChatReturn {
  conversations: ChatConversation[];
  selectedConversation: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  selectConversation: (userId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: () => Promise<void>;
  refreshConversations: () => Promise<void>;
}

export function useAdminChat(): UseAdminChatReturn {
  const { user } = useAdmin();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logger = createContextLogger('use-admin-chat');

  // Use regular supabase client on client side (RLS will handle admin checks)
  const adminChatService = new AdminChatService(supabase);

  // Load conversations on mount
  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  // Set up real-time subscription for all chat messages
  useEffect(() => {
    if (!user) return;

    logger.info('Setting up admin chat subscription');

    const subscription = supabase
      .channel('admin-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          // Refresh conversations when new message arrives
          loadConversations();
          
          // If message is for selected conversation, refresh messages
          if (selectedConversation) {
            loadMessages(selectedConversation);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          // Refresh conversations when message is updated (e.g., marked as read)
          loadConversations();
        }
      )
      .subscribe((status) => {
        logger.info('Admin chat subscription status', { status });
      });

    return () => {
      logger.info('Cleaning up admin chat subscription');
      subscription.unsubscribe();
    };
  }, [user, selectedConversation]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  const loadConversations = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const conversationsList = await adminChatService.getConversations();
      setConversations(conversationsList);
      logger.info('Conversations loaded successfully', {
        conversationCount: conversationsList.length,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(errorMessage);
      logger.error('Failed to load conversations', err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadMessages = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const messagesList = await adminChatService.getConversationMessages(userId);
      setMessages(messagesList);
      logger.info('Messages loaded successfully', {
        messageCount: messagesList.length,
        userId,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
      setError(errorMessage);
      logger.error('Failed to load messages', err as Error, { userId });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectConversation = useCallback((userId: string) => {
    setSelectedConversation(userId);
    logger.info('Conversation selected', { userId });
  }, []);

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!user || !selectedConversation || !content.trim()) {
      throw new Error('Cannot send message: missing user, conversation, or content');
    }

    try {
      const message = await adminChatService.sendAdminMessage(
        selectedConversation,
        content.trim(),
        user.id
      );

      // Add message to local state immediately
      setMessages((prev) => [...prev, message]);

      // Refresh conversations to update last message
      await loadConversations();

      logger.info('Admin message sent successfully', {
        messageId: message.id,
        userId: selectedConversation,
      });
    } catch (err) {
      logger.error('Failed to send message', err as Error, {
        userId: selectedConversation,
      });
      throw err;
    }
  }, [user, selectedConversation, loadConversations]);

  const markAsRead = useCallback(async (): Promise<void> => {
    if (!selectedConversation) return;

    try {
      await adminChatService.markConversationAsRead(selectedConversation);

      // Update local state
      setMessages((prev) =>
        prev.map((msg) => ({ ...msg, is_read: true }))
      );

      // Refresh conversations to update unread count
      await loadConversations();

      logger.info('Conversation marked as read', {
        userId: selectedConversation,
      });
    } catch (err) {
      logger.error('Failed to mark conversation as read', err as Error, {
        userId: selectedConversation,
      });
    }
  }, [selectedConversation, loadConversations]);

  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    selectedConversation,
    messages,
    isLoading,
    error,
    selectConversation,
    sendMessage,
    markAsRead,
    refreshConversations,
  };
}

