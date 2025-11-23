import type {
  ChatConversation,
  ChatMessage,
  GetConversationsResponse,
  GetMessagesResponse,
  MarkAsReadResponse,
  SendMessageRequest,
  SendMessageResponse,
} from "../types/chat.types";
import { ChatError, DEFAULT_CHAT_CONFIG } from "../types/chat.types";

import { supabase } from "@/lib/supabase";
import { createContextLogger } from "@/shared/utils/logger";

export class ChatService {
  private supabase = supabase;
  private logger = createContextLogger("chat-service");

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
        throw new ChatError(
          "MESSAGE_TOO_LONG",
          "Message content cannot be empty"
        );
      }

      if (request.content.length > DEFAULT_CHAT_CONFIG.maxMessageLength) {
        throw new ChatError(
          "MESSAGE_TOO_LONG",
          `Message too long. Maximum ${DEFAULT_CHAT_CONFIG.maxMessageLength} characters allowed.`
        );
      }

      // Handle file attachments if any
      let attachmentUrls: string[] = [];
      if (request.attachments && request.attachments.length > 0) {
        attachmentUrls = await this.uploadAttachments(
          userId,
          request.attachments
        );
      }

      // Use API route instead of direct database access
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: request.content.trim(),
          attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new ChatError(
          "NETWORK_ERROR",
          errorData.error || "Failed to send message"
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new ChatError(
          "NETWORK_ERROR",
          result.error || "Failed to send message"
        );
      }

      this.logger.info("Message sent successfully", {
        messageId: result.message.id,
        userId,
        contentLength: request.content.length,
        attachmentCount: attachmentUrls.length,
      });

      return {
        success: true,
        message: result.message as ChatMessage,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Failed to send message", error as Error, { userId });

      if (error instanceof ChatError) {
        return { success: false, error: error.message };
      }

      return {
        success: false,
        error: "Failed to send message. Please try again.",
      };
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
      // Use API route instead of direct database access
      const response = await fetch(
        `/api/chat?limit=${limit}&offset=${offset}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new ChatError(
          "NETWORK_ERROR",
          errorData.error || "Failed to load messages"
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new ChatError(
          "NETWORK_ERROR",
          result.error || "Failed to load messages"
        );
      }

      this.logger.info("Messages fetched successfully", {
        userId,
        messageCount: result.messages.length,
        hasMore: result.hasMore,
      });

      return {
        success: true,
        messages: result.messages as ChatMessage[],
        hasMore: result.hasMore,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Failed to fetch messages", error as Error, { userId });

      if (error instanceof ChatError) {
        return {
          success: false,
          error: error.message,
          messages: [],
          hasMore: false,
        };
      }

      return {
        success: false,
        error: "Failed to load messages. Please try again.",
        messages: [],
        hasMore: false,
      };
    }
  }

  /**
   * Mark a message as read
   */
  async markAsRead(
    messageId: string,
    userId: string
  ): Promise<MarkAsReadResponse> {
    try {
      // Use API route instead of direct database access
      const response = await fetch(`/api/chat/${messageId}/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new ChatError(
          "NETWORK_ERROR",
          errorData.error || "Failed to mark message as read"
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new ChatError(
          "NETWORK_ERROR",
          result.error || "Failed to mark message as read"
        );
      }

      this.logger.info("Message marked as read", { messageId, userId });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Failed to mark message as read", error as Error, {
        messageId,
        userId,
      });

      if (error instanceof ChatError) {
        return { success: false, error: error.message };
      }

      return {
        success: false,
        error: "Failed to mark message as read. Please try again.",
      };
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
        .from("chat_messages")
        .select(
          `
          user_id,
          created_at,
          content,
          attachments
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        // Fallback to manual query if RPC doesn't exist
        this.logger.warn(
          "RPC get_active_chat_sessions not found, using fallback query",
          error
        );

        const { data: messages, error: messagesError } = await this.supabase
          .from("chat_messages")
          .select(
            `
             user_id,
             content,
             created_at,
             attachments,
             sender_type,
             is_read
           `
          )
          .order("created_at", { ascending: false });

        if (messagesError) {
          throw new ChatError("NETWORK_ERROR", "Failed to load conversations");
        }

        // Group messages by user_id and create conversation summaries
        const conversationMap = new Map<string, ChatConversation>();

        messages?.forEach((message: any) => {
          if (!conversationMap.has(message.user_id)) {
            conversationMap.set(message.user_id, {
              user_id: message.user_id,
              user: { name: "Unknown User", email: "" },
              last_message: message.content,
              last_message_at: message.created_at,
              unread_count:
                message.sender_type === "user" && !message.is_read ? 1 : 0,
              has_attachments: message.attachments
                ? message.attachments.length > 0
                : false,
              is_online: false, // Would need presence tracking
            } as ChatConversation);
          } else {
            const existing = conversationMap.get(message.user_id)!;
            if (message.sender_type === "user" && !message.is_read) {
              (existing as any).unread_count++;
            }
            if (message.attachments && message.attachments.length > 0) {
              (existing as any).has_attachments = true;
            }
          }
        });

        const conversations = Array.from(conversationMap.values());

        this.logger.info("Conversations fetched successfully (fallback)", {
          conversationCount: conversations.length,
        });

        return {
          success: true,
          conversations,
        };
      }

      this.logger.info("Conversations fetched successfully", {
        conversationCount: conversations?.length || 0,
      });

      return {
        success: true,
        conversations: (conversations as unknown as ChatConversation[]) || [],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Failed to fetch conversations", error as Error);

      if (error instanceof ChatError) {
        return { success: false, error: error.message, conversations: [] };
      }

      return {
        success: false,
        error: "Failed to load conversations. Please try again.",
        conversations: [],
      };
    }
  }

  /**
   * Upload chat attachments
   */
  private async uploadAttachments(
    userId: string,
    files: File[]
  ): Promise<string[]> {
    const uploadPromises = files.map(async (file) => {
      // Validate file
      this.validateFile(file);

      // Sanitize filename to remove invalid characters
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);

      // Check if filename contains an extension
      const lastDotIndex = sanitizedFileName.lastIndexOf(".");
      const hasExtension =
        lastDotIndex > 0 && lastDotIndex < sanitizedFileName.length - 1;

      let baseName: string;
      let fileExtension: string;

      if (hasExtension) {
        baseName = sanitizedFileName.substring(0, lastDotIndex);
        fileExtension = sanitizedFileName.substring(lastDotIndex + 1);
      } else {
        baseName = sanitizedFileName;
        fileExtension = "";
      }

      const fileName = fileExtension
        ? `${timestamp}_${randomId}_${baseName}.${fileExtension}`
        : `${timestamp}_${randomId}_${baseName}`;

      // Create path structure: {userId}/{filename}
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from("chat-attachments")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type, // Explicitly set content type
        });

      if (error) {
        this.logger.error("Failed to upload attachment", error, {
          fileName: file.name,
          filePath,
          fileType: file.type,
          fileSize: file.size,
          errorMessage: error.message,
          errorStatus: (error as any).statusCode,
        });
        throw new ChatError(
          "NETWORK_ERROR",
          `Failed to upload ${file.name}: ${
            error.message || JSON.stringify(error)
          }`
        );
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new ChatError(
          "NETWORK_ERROR",
          `Failed to get public URL for ${file.name}`
        );
      }

      return urlData.publicUrl;
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: File): void {
    // Check file size
    if (file.size > DEFAULT_CHAT_CONFIG.maxFileSize) {
      throw new ChatError(
        "FILE_TOO_LARGE",
        `File ${file.name} is too large. Maximum size is ${
          DEFAULT_CHAT_CONFIG.maxFileSize / 1024 / 1024
        }MB.`
      );
    }

    // Check file type
    const isSupported = DEFAULT_CHAT_CONFIG.supportedFileTypes.some((type) => {
      if (type.startsWith(".")) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      } else {
        return file.type.match(type);
      }
    });

    if (!isSupported) {
      throw new ChatError(
        "UNSUPPORTED_FILE",
        `File type ${
          file.type
        } is not supported. Supported types: ${DEFAULT_CHAT_CONFIG.supportedFileTypes.join(
          ", "
        )}`
      );
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
