"use client";

import { MessageCircle, X } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { ChatInterface } from "./chat-interface";
import { useAuth } from "@/features/auth/context/auth-context";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { user } = useAuth();
  const t = useTranslations("chat");

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
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleOpen}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>

        {/* Notification badge for unread messages */}
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
          0
        </div>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white border rounded-lg shadow-lg p-3 flex items-center space-x-3 min-w-64">
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
    <div className="fixed bottom-6 right-6 z-50">
      <ChatInterface
        userId={user.id}
        onClose={handleClose}
        className="shadow-2xl"
      />
    </div>
  );
}
