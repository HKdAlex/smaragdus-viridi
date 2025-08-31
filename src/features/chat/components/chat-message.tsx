"use client";

import { Download, FileText, Image } from "lucide-react";

import type { ChatMessageProps } from "../types/chat.types";
import { format } from "date-fns";

export function ChatMessage({
  message,
  isOwn,
  onAttachmentClick,
}: ChatMessageProps) {
  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "HH:mm");
    } catch {
      return "";
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return <Image className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getFileSize = (url: string) => {
    // This would typically come from the attachment metadata
    // For now, we'll show a placeholder
    return "Unknown size";
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-none"
            : message.is_auto_response
            ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800/30 rounded-bl-none"
            : "bg-muted text-foreground rounded-bl-none"
        }`}
      >
        {/* Message Content */}
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.attachments.map((attachment, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 p-2 rounded ${
                  isOwn
                    ? "bg-primary/80 hover:bg-primary/90"
                    : "bg-background hover:bg-muted border border-border"
                } transition-colors cursor-pointer`}
                onClick={() => onAttachmentClick?.(attachment)}
              >
                {getFileIcon(attachment.split("/").pop() || "file")}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs truncate ${
                      isOwn ? "text-primary-foreground/90" : "text-foreground"
                    }`}
                  >
                    {attachment.split("/").pop()}
                  </p>
                  <p
                    className={`text-xs ${
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {getFileSize(attachment)}
                  </p>
                </div>
                <Download
                  className={`w-3 h-3 ${
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Message Footer */}
        <div
          className={`flex items-center justify-between mt-2 text-xs ${
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          <span>{formatTime(message.created_at)}</span>
          {message.is_auto_response && (
            <span className="text-xs opacity-75">
              {isOwn ? "Auto-reply" : "Automated response"}
            </span>
          )}
          {message.is_read && !isOwn && <span className="text-xs">✓✓</span>}
        </div>
      </div>
    </div>
  );
}
