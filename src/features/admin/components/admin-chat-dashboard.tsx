/**
 * Admin Chat Dashboard Component (SRP: UI Only)
 * 
 * Main component for admin chat dashboard.
 * No business logic - calls hooks/services only.
 */

"use client";

import { Card, CardContent } from "@/shared/components/ui/card";
import { ConversationHeader } from "./conversation-header";
import { ConversationList } from "./conversation-list";
import { useAdminChat } from "../hooks/use-admin-chat";
import { useTranslations } from "next-intl";
import { ChatMessage } from "@/features/chat/components/chat-message";
import { ChatInput } from "@/features/chat/components/chat-input";
import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";

export function AdminChatDashboard() {
  const {
    conversations,
    selectedConversation,
    messages,
    isLoading,
    error,
    selectConversation,
    sendMessage,
    markAsRead,
  } = useAdminChat();

  const t = useTranslations("admin.chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const previousMessageCountRef = useRef<number>(0);
  const previousConversationRef = useRef<string | null>(null);

  // Auto-scroll to bottom only when:
  // 1. New messages are added (not when switching conversations)
  // 2. When a conversation is first selected (to show latest messages)
  useEffect(() => {
    if (!selectedConversation || messages.length === 0) {
      previousMessageCountRef.current = 0;
      previousConversationRef.current = selectedConversation;
      return;
    }

    const isNewConversation = previousConversationRef.current !== selectedConversation;
    const hasNewMessages = messages.length > previousMessageCountRef.current;
    
    // Only scroll if it's a new conversation (to show latest) or new messages arrived
    if (isNewConversation || hasNewMessages) {
      // Use a small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: isNewConversation ? "auto" : "smooth" });
      }, 100);
    }

    previousMessageCountRef.current = messages.length;
    previousConversationRef.current = selectedConversation;
  }, [messages, selectedConversation]);

  // Mark conversation as read when viewing
  useEffect(() => {
    if (selectedConversation) {
      markAsRead();
    }
  }, [selectedConversation, markAsRead]);

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!content.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(content);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const selectedConversationData = conversations.find(
    (c) => c.user_id === selectedConversation
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        {/* Conversation List Sidebar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0 h-full">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold">{t("conversations")}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {conversations.length} {t("totalConversations")}
                </p>
              </div>
              <ConversationList
                conversations={conversations}
                selectedConversation={selectedConversation}
                onSelectConversation={selectConversation}
                isLoading={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <div className="h-full flex flex-col">
              <ConversationHeader
                userName={selectedConversationData?.user_name}
                userEmail={undefined} // Could be fetched if needed
                unreadCount={selectedConversationData?.unread_count || 0}
                onMarkAsRead={markAsRead}
              />
              <CardContent className="flex-1 overflow-hidden p-0">
                <div className="h-full flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <div className="text-2xl mb-2">💬</div>
                        <p className="text-sm">{t("noMessages")}</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <ChatMessage
                          key={message.id}
                          message={message}
                          isOwn={message.sender_type === "admin"}
                          onAttachmentClick={(url) => {
                            // Open attachment in new tab
                            window.open(url, "_blank", "noopener,noreferrer");
                          }}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t p-3">
                    <ChatInput
                      onSendMessage={handleSendMessage}
                      disabled={isSending}
                      placeholder={t("typeMessage")}
                    />
                  </div>
                </div>
              </CardContent>
            </div>
          ) : (
            <CardContent className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-sm">{t("selectConversation")}</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

