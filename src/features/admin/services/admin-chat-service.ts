/**
 * Admin Chat Service (SRP: Admin Chat Operations)
 * 
 * Admin-specific chat operations (separate from user chat service).
 * No UI logic - only data operations.
 */

import type { ChatConversation, ChatMessage } from '@/features/chat/types/chat.types';
import { supabaseAdmin } from '@/lib/supabase';
import { createContextLogger } from '@/shared/utils/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

export class AdminChatService {
  private supabase: SupabaseClient;
  private logger = createContextLogger('admin-chat-service');

  constructor(supabaseClient?: SupabaseClient) {
    if (!supabaseClient) {
      // On client side, supabaseAdmin is null, so we need a client passed in
      // On server side, supabaseAdmin should be available
      if (!supabaseAdmin) {
        throw new Error('Supabase client is required. Pass a client instance or ensure SUPABASE_SERVICE_ROLE_KEY is set (server-side only).');
      }
      this.supabase = supabaseAdmin;
    } else {
      this.supabase = supabaseClient;
    }
  }

  /**
   * Get all conversations for admin dashboard
   * Uses optimized database function if available, falls back to manual query
   */
  async getConversations(): Promise<ChatConversation[]> {
    try {
      // Try to use optimized database function first
      const { data: sessions, error: rpcError } = await this.supabase.rpc('get_active_chat_sessions');

      if (!rpcError && sessions) {
        // Transform RPC result to ChatConversation format
        const conversations: ChatConversation[] = sessions.map((session: any) => ({
          user_id: session.user_id,
          user_name: session.user_name,
          last_message: session.last_message || '',
          last_message_at: session.last_message_at,
          unread_count: Number(session.unread_count) || 0,
          has_attachments: session.has_attachments || false,
          is_online: false, // Would need presence tracking
        }));

        // Sort: unread first, then by last_message_at
        conversations.sort((a, b) => {
          if (a.unread_count > 0 && b.unread_count === 0) return -1;
          if (a.unread_count === 0 && b.unread_count > 0) return 1;
          
          const aDate = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const bDate = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return bDate - aDate;
        });

        this.logger.info('Conversations fetched successfully (using RPC)', {
          conversationCount: conversations.length,
        });

        return conversations;
      }

      // Fallback to manual query if RPC doesn't exist
      this.logger.warn('RPC function not available, using fallback query', rpcError);

      // Get all unique user_ids with their latest message
      const { data: messages, error } = await this.supabase
        .from('chat_messages')
        .select('user_id, content, created_at, attachments, sender_type, is_read')
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error('Failed to fetch messages', error);
        throw error;
      }

      if (!messages || messages.length === 0) {
        return [];
      }

      // Group by user_id and create conversation summaries
      const conversationMap = new Map<string, ChatConversation>();

      for (const message of messages) {
        const userId = message.user_id;
        
        if (!conversationMap.has(userId)) {
          // Get user profile for name
          const { data: profile } = await this.supabase
            .from('user_profiles')
            .select('name, email')
            .eq('user_id', userId)
            .single();

          conversationMap.set(userId, {
            user_id: userId,
            user_name: profile?.name || 'Unknown User',
            last_message: message.content || '',
            last_message_at: message.created_at,
            unread_count: message.sender_type === 'user' && !message.is_read ? 1 : 0,
            has_attachments: message.attachments ? message.attachments.length > 0 : false,
            is_online: false, // Would need presence tracking
          });
        } else {
          const existing = conversationMap.get(userId)!;
          // Update unread count
          if (message.sender_type === 'user' && !message.is_read) {
            (existing as ChatConversation & { unread_count: number }).unread_count += 1;
          }
          // Update has_attachments
          if (message.attachments && message.attachments.length > 0) {
            (existing as ChatConversation & { has_attachments: boolean }).has_attachments = true;
          }
        }
      }

      const conversations = Array.from(conversationMap.values());
      
      // Sort: unread first, then by last_message_at
      conversations.sort((a, b) => {
        if (a.unread_count > 0 && b.unread_count === 0) return -1;
        if (a.unread_count === 0 && b.unread_count > 0) return 1;
        
        const aDate = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bDate = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bDate - aDate;
      });

      this.logger.info('Conversations fetched successfully (fallback)', {
        conversationCount: conversations.length,
      });

      return conversations;
    } catch (error) {
      this.logger.error('Failed to get conversations', error as Error);
      throw error;
    }
  }

  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(userId: string): Promise<ChatMessage[]> {
    try {
      const { data: messages, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        this.logger.error('Failed to fetch conversation messages', error, { userId });
        throw error;
      }

      return (messages || []).map((msg) => ({
        id: msg.id,
        user_id: msg.user_id,
        admin_id: msg.admin_id,
        content: msg.content,
        attachments: msg.attachments,
        sender_type: msg.sender_type as 'user' | 'admin',
        is_auto_response: msg.is_auto_response,
        is_read: msg.is_read,
        created_at: msg.created_at,
      }));
    } catch (error) {
      this.logger.error('Failed to get conversation messages', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Send admin message to user
   */
  async sendAdminMessage(
    userId: string,
    content: string,
    adminId: string
  ): Promise<ChatMessage> {
    try {
      const { data: message, error } = await this.supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          admin_id: adminId,
          content: content.trim(),
          sender_type: 'admin',
          is_read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Failed to send admin message', error, { userId, adminId });
        throw error;
      }

      this.logger.info('Admin message sent successfully', {
        messageId: message.id,
        userId,
        adminId,
      });

      return {
        id: message.id,
        user_id: message.user_id,
        admin_id: message.admin_id,
        content: message.content,
        attachments: message.attachments,
        sender_type: message.sender_type as 'user' | 'admin',
        is_auto_response: message.is_auto_response,
        is_read: message.is_read,
        created_at: message.created_at,
      };
    } catch (error) {
      this.logger.error('Failed to send admin message', error as Error, { userId, adminId });
      throw error;
    }
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        this.logger.error('Failed to mark conversation as read', error, { userId });
        throw error;
      }

      this.logger.info('Conversation marked as read', { userId });
    } catch (error) {
      this.logger.error('Failed to mark conversation as read', error as Error, { userId });
      throw error;
    }
  }
}

