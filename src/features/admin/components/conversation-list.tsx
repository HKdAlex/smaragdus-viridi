/**
 * Conversation List Component (SRP: UI Only)
 *
 * Sidebar with list of conversations.
 */

"use client";

import type { ChatConversation } from "@/features/chat/types/chat.types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface ConversationListProps {
  conversations: ChatConversation[];
  selectedConversation: string | null;
  onSelectConversation: (userId: string) => void;
  isLoading: boolean;
}

export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  isLoading,
}: ConversationListProps) {
  const t = useTranslations("admin.chat");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <MessageCircle className="w-12 h-12 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{t("noConversations")}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-2 space-y-1">
        {conversations.map((conversation) => {
          const isSelected = selectedConversation === conversation.user_id;
          const lastMessageDate = conversation.last_message_at
            ? new Date(conversation.last_message_at)
            : null;
          const timeAgo = lastMessageDate
            ? formatDistanceToNow(lastMessageDate, { addSuffix: true })
            : "";

          return (
            <Button
              key={conversation.user_id}
              variant={isSelected ? "secondary" : "ghost"}
              className={`w-full justify-start h-auto p-3 ${
                isSelected ? "bg-secondary" : ""
              }`}
              onClick={() => onSelectConversation(conversation.user_id)}
            >
              <div className="flex items-start justify-between w-full min-w-0">
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium text-sm truncate">
                      {conversation.user_name || t("unknownUser")}
                    </p>
                    {conversation.has_attachments && (
                      <span className="text-xs">📎</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {conversation.last_message || t("noMessages")}
                  </p>
                  {timeAgo && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {timeAgo}
                    </p>
                  )}
                </div>
                {conversation.unread_count > 0 && (
                  <Badge variant="destructive" className="ml-2 flex-shrink-0">
                    {conversation.unread_count}
                  </Badge>
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
