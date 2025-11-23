"use client";

import { MessageCircle, X } from "lucide-react";

import { useAuth } from "@/features/auth/context/auth-context";
import { Button } from "@/shared/components/ui/button";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useUnreadCount } from "../hooks/use-chat";
import { ChatInterface } from "./chat-interface";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { user } = useAuth();
  const t = useTranslations("chat");
  const unreadCount = useUnreadCount(user?.id);

  // Don't show widget if user is not logged in
  if (!user) return null;

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 left-6 z-50">
        <div className="relative">
          <Button
            onClick={handleOpen}
            size="lg"
            className="group relative rounded-full h-14 w-14 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 border-2 border-blue-400/20 hover:border-blue-300/40 hover:scale-110 active:scale-105"
          >
            <MessageCircle className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />

            {/* Pulse animation when there are unread messages */}
            {unreadCount > 0 && (
              <span className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping opacity-75" />
            )}
          </Button>

          {/* Notification badge for unread messages */}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full min-w-[24px] h-6 flex items-center justify-center font-bold px-2 shadow-lg border-2 border-white dark:border-gray-900 animate-bounce">
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 left-6 z-50">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 flex items-center space-x-3 min-w-64">
          <div className="flex-1">
            <p className="text-sm font-medium">{t("supportChat")}</p>
            <p className="text-xs text-muted-foreground">{t("online")}</p>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
              className="h-8 w-8 p-0"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <ChatInterface
        userId={user.id}
        onClose={handleClose}
        className="shadow-2xl"
      />
    </div>
  );
}
