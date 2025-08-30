"use client"

import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, X, Wifi, WifiOff } from 'lucide-react'
import { useChat } from '../hooks/use-chat'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { useTranslations } from 'next-intl'
import type { ChatInterfaceProps } from '../types/chat.types'

export function ChatInterface({
  userId,
  onClose,
  className = ''
}: ChatInterfaceProps) {
  const { messages, isConnected, sendMessage, markAsRead } = useChat(userId)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('chat')

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isMinimized])

  // Mark messages as read when they come into view
  useEffect(() => {
    const unreadMessages = messages.filter(
      msg => msg.sender_type === 'admin' && !msg.is_read
    )

    unreadMessages.forEach(msg => {
      markAsRead(msg.id)
    })
  }, [messages, markAsRead])

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    try {
      await sendMessage(content, attachments)
    } catch (error) {
      console.error('Failed to send message:', error)
      // Error handling would be done via toast notifications
    }
  }

  if (isMinimized) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {t('supportChat')}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(false)}
                className="h-6 w-6 p-0"
              >
                ↗
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={`w-96 h-[500px] flex flex-col ${className}`}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-sm font-medium">
              {t('supportChat')}
            </CardTitle>
            <Badge
              variant="outline"
              className={`text-xs ${
                isConnected ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'
              }`}
            >
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  {t('online')}
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  {t('offline')}
                </>
              )}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="h-6 w-6 p-0"
            >
              ↙
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-2xl mb-2">💬</div>
                <p className="text-sm">{t('noMessages')}</p>
                <p className="text-xs mt-1">{t('startConversation')}</p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwn={message.sender_type === 'user'}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={!isConnected}
              placeholder={t('typeMessage')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
