/**
 * Conversation Header Component (SRP: UI Only)
 * 
 * Displays user information for selected conversation.
 */

"use client";

import { Badge } from "@/shared/components/ui/badge";
import { CardHeader, CardTitle } from "@/shared/components/ui/card";
import { User } from "lucide-react";
import { useTranslations } from "next-intl";

interface ConversationHeaderProps {
  userName?: string;
  userEmail?: string;
  unreadCount: number;
  onMarkAsRead: () => void;
}

export function ConversationHeader({
  userName,
  userEmail,
  unreadCount,
  onMarkAsRead,
}: ConversationHeaderProps) {
  const t = useTranslations("admin.chat");

  return (
    <CardHeader className="pb-3 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{userName || t("unknownUser")}</CardTitle>
            {userEmail && (
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center space-x-2">
            <Badge variant="destructive">{unreadCount}</Badge>
            <button
              onClick={onMarkAsRead}
              className="text-xs text-primary hover:underline"
            >
              {t("markAsRead")}
            </button>
          </div>
        )}
      </div>
    </CardHeader>
  );
}

