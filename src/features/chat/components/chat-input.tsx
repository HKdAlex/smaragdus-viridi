"use client";

import { Send, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import type { ChatInputProps } from "../types/chat.types";
import { FileUpload } from "./file-upload";
import { Textarea } from "@/shared/components/ui/textarea";

export function ChatInput({
  onSendMessage,
  isTyping = false,
  disabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(message, attachments);
      setMessage("");
      setAttachments([]);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend =
    (message.trim() || attachments.length > 0) && !isSending && !disabled;

  return (
    <div className="space-y-2">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/30 dark:bg-muted/50 rounded-lg">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 bg-background rounded px-2 py-1 text-xs"
            >
              <span className="truncate max-w-24">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAttachment(index)}
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-2">
        {/* File Upload */}
        <FileUpload
          onFilesSelected={handleFilesSelected}
          disabled={disabled || isSending}
        />

        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? "Chat unavailable..." : placeholder}
            disabled={disabled || isSending}
            className="min-h-[40px] max-h-32 resize-none pr-12"
            rows={1}
          />

          {/* Character count indicator */}
          {message.length > 800 && (
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {message.length}/2000
            </div>
          )}
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="sm"
          className="h-10 w-10 p-0"
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <div className="text-xs text-muted-foreground flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-current rounded-full animate-bounce" />
            <div
              className="w-1 h-1 bg-current rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="w-1 h-1 bg-current rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
          <span>Someone is typing...</span>
        </div>
      )}
    </div>
  );
}
