"use client";

import type {
  ChatMessage,
  GetMessagesResponse,
  SendMessageRequest,
  UseChatReturn,
  UseChatTypingReturn,
} from "../types/chat.types";
import { useCallback, useEffect, useRef, useState } from "react";

import { chatService } from "../services/chat-service";
import { createContextLogger } from "@/shared/utils/logger";
import { supabase } from "@/lib/supabase";

export function useChat(userId?: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const logger = createContextLogger("use-chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial messages
  useEffect(() => {
    if (!userId) return;

    loadMessages();
  }, [userId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    logger.info("Setting up chat subscription", { userId });

    const subscription = supabase
      .channel(`chat-${userId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: userId },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          logger.info("Real-time INSERT received", {
            messageId: newMessage.id,
            senderType: newMessage.sender_type,
            userId,
            payload,
          });

          setMessages((prev) => {
            // Check if message already exists (avoid duplicates)
            const exists = prev.some((msg) => msg.id === newMessage.id);
            if (exists) {
              logger.debug(
                "Message already exists in state, skipping real-time update",
                {
                  messageId: newMessage.id,
                  currentMessageCount: prev.length,
                }
              );
              return prev;
            }

            // Check if there's an optimistic message that should be replaced
            const optimisticIndex = prev.findIndex((msg) =>
              msg.id.startsWith("temp-")
            );
            if (optimisticIndex !== -1 && newMessage.sender_type === "user") {
              logger.info(
                "Replacing optimistic message with real-time message",
                {
                  optimisticId: prev[optimisticIndex].id,
                  realId: newMessage.id,
                  content: newMessage.content.substring(0, 50),
                }
              );
              const newMessages = [...prev];
              newMessages[optimisticIndex] = newMessage;
              return newMessages;
            }

            logger.info("Adding new message from real-time subscription", {
              messageId: newMessage.id,
              senderType: newMessage.sender_type,
              currentMessageCount: prev.length,
            });
            return [...prev, newMessage];
          });

          // Update unread count if message is from admin and not read
          if (newMessage.sender_type === "admin" && !newMessage.is_read) {
            setUnreadCount((prev) => prev + 1);
          }

          // Scroll to bottom when new message arrives
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          const oldMessage = payload.old as ChatMessage;

          logger.info("Real-time UPDATE received", {
            messageId: updatedMessage.id,
            userId,
            payload,
          });

          // Update message in state
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );

          // Update unread count if message was marked as read
          if (
            updatedMessage.sender_type === "admin" &&
            !oldMessage.is_read &&
            updatedMessage.is_read
          ) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
            logger.info("Message marked as read via subscription", {
              messageId: updatedMessage.id,
              userId,
            });
          }
        }
      )
      .subscribe((status, err) => {
        setIsConnected(status === "SUBSCRIBED");
        if (err) {
          logger.error("Subscription error", err, { userId, status });
        } else {
          logger.info("Chat subscription status", { status, userId });
        }
      });

    return () => {
      logger.info("Cleaning up chat subscription", { userId });
      subscription.unsubscribe();
    };
  }, [userId]);

  const loadMessages = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response: GetMessagesResponse = await chatService.getMessages(
        userId
      );

      if (response.success) {
        setMessages(response.messages);
        // Calculate unread count (admin messages that are not read)
        const unread = response.messages.filter(
          (msg) => msg.sender_type === "admin" && !msg.is_read
        ).length;
        setUnreadCount(unread);
        logger.info("Messages loaded successfully", {
          messageCount: response.messages.length,
          unreadCount: unread,
          userId,
        });
      } else {
        logger.error("Failed to load messages", {
          error: response.error,
          userId,
        });
      }
    } catch (error) {
      logger.error("Failed to load messages", error as Error, { userId });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const sendMessage = useCallback(
    async (content: string, attachments?: File[]): Promise<void> => {
      if (!userId || !content.trim()) return;

      // Optimistically add message to state immediately for instant feedback
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`, // Temporary ID
        user_id: userId,
        admin_id: null,
        content: content.trim(),
        attachments: attachments?.map(() => "") || null,
        sender_type: "user",
        is_auto_response: false,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      // Add optimistic message immediately
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const request: SendMessageRequest = {
          content: content.trim(),
          attachments,
        };

        const response = await chatService.sendMessage(userId, request);

        if (response.success && response.message) {
          // Replace optimistic message with real message from server
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === optimisticMessage.id ? response.message! : msg
            )
          );

          logger.info("Message sent successfully", {
            messageId: response.message.id,
            userId,
          });
        } else {
          // Remove optimistic message on error
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== optimisticMessage.id)
          );
          logger.error("Failed to send message", {
            error: response.error,
            userId,
          });
          throw new Error(response.error || "Failed to send message");
        }
      } catch (error) {
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticMessage.id)
        );
        logger.error("Failed to send message", error as Error, { userId });
        throw error;
      }
    },
    [userId]
  );

  const markAsRead = useCallback(
    async (messageId: string): Promise<void> => {
      if (!userId) return;

      try {
        const response = await chatService.markAsRead(messageId, userId);

        if (response.success) {
          // Update local state
          setMessages((prev) =>
            prev.map((msg) => {
              if (
                msg.id === messageId &&
                msg.sender_type === "admin" &&
                !msg.is_read
              ) {
                // Decrement unread count when marking admin message as read
                setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
              }
              return msg.id === messageId ? { ...msg, is_read: true } : msg;
            })
          );

          logger.info("Message marked as read", { messageId, userId });
        } else {
          logger.error("Failed to mark message as read", {
            error: response.error,
            messageId,
            userId,
          });
        }
      } catch (error) {
        logger.error("Failed to mark message as read", error as Error, {
          messageId,
          userId,
        });
      }
    },
    [userId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    logger.info("Messages cleared", { userId });
  }, [userId]);

  return {
    messages,
    isConnected,
    isTyping: false, // Would be implemented with typing indicators
    unreadCount,
    sendMessage,
    markAsRead,
    clearMessages,
  };
}

export function useChatTyping(userId?: string): UseChatTypingReturn {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logger = createContextLogger("use-chat-typing");

  const startTyping = useCallback(() => {
    setIsTyping(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      logger.info("Typing stopped automatically", { userId });
    }, 3000);

    logger.info("Typing started", { userId });
  }, [userId]);

  const stopTyping = useCallback(() => {
    setIsTyping(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    logger.info("Typing stopped manually", { userId });
  }, [userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isTyping,
    startTyping,
    stopTyping,
  };
}

// Hook for tracking unread messages (works even when chat is closed)
export function useUnreadCount(userId?: string): number {
  const [unreadCount, setUnreadCount] = useState(0);
  const logger = createContextLogger("use-unread-count");

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    // Load initial unread count
    const loadUnreadCount = async () => {
      try {
        const response = await chatService.getMessages(userId);
        if (response.success) {
          const unread = response.messages.filter(
            (msg) => msg.sender_type === "admin" && !msg.is_read
          ).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        logger.error("Failed to load unread count", error as Error, { userId });
      }
    };

    loadUnreadCount();

    // Set up real-time subscription for unread messages
    logger.info("Setting up unread count subscription", { userId });

    const subscription = supabase
      .channel(`unread-count-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          // Only count admin messages that are unread
          if (newMessage.sender_type === "admin" && !newMessage.is_read) {
            setUnreadCount((prev) => prev + 1);
            logger.info("Unread count incremented", {
              messageId: newMessage.id,
              unreadCount: unreadCount + 1,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          // If message was marked as read, decrement count
          if (
            updatedMessage.sender_type === "admin" &&
            updatedMessage.is_read
          ) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status) => {
        logger.info("Unread count subscription status", { status, userId });
      });

    return () => {
      logger.info("Cleaning up unread count subscription", { userId });
      subscription.unsubscribe();
    };
  }, [userId]);

  return unreadCount;
}

// Hook for chat scrolling
export function useChatScroll() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(
    (behavior: "smooth" | "auto" = "smooth") => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    },
    []
  );

  useEffect(() => {
    // Scroll to bottom on mount
    scrollToBottom("auto");
  }, []);

  return {
    messagesEndRef,
    scrollToBottom,
  };
}
