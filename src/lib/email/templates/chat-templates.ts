/**
 * Chat Email Templates (SSOT)
 * 
 * Single source of truth for all chat-related email templates.
 * Pure functions - no side effects, only template rendering.
 */

import { getSiteName, getSiteUrl } from '../config/chat-email-config';

export enum ChatEmailTemplateType {
  NEW_USER_MESSAGE_TO_ADMIN = 'new_user_message_to_admin',
  ADMIN_RESPONSE_TO_USER = 'admin_response_to_user',
  UNATTENDED_MESSAGE_ALERT = 'unattended_message_alert',
  CHAT_SUMMARY = 'chat_summary',
}

export interface ChatEmailTemplateData {
  userName?: string;
  userEmail?: string;
  messageContent: string;
  messagePreview?: string;
  conversationUrl: string;
  siteName?: string;
  locale: 'en' | 'ru';
  waitTime?: string;
  adminName?: string;
}

export interface ChatEmailTemplate {
  subject: string;
  html: string;
}

/**
 * Get email template for chat notification type and locale
 */
export function getChatEmailTemplate(
  type: ChatEmailTemplateType,
  locale: 'en' | 'ru'
): ChatEmailTemplate {
  const templates = emailTemplates[locale];
  return templates[type] || templates[ChatEmailTemplateType.NEW_USER_MESSAGE_TO_ADMIN];
}

/**
 * Render email template with data
 */
export function renderChatEmailTemplate(
  template: ChatEmailTemplate,
  data: ChatEmailTemplateData
): { subject: string; html: string } {
  const siteName = data.siteName || getSiteName();
  const siteUrl = getSiteUrl();
  
  let subject = template.subject;
  let html = template.html;

  // Replace placeholders
  const replacements: Record<string, string> = {
    '{{userName}}': data.userName || 'User',
    '{{userEmail}}': data.userEmail || '',
    '{{messageContent}}': escapeHtml(data.messageContent),
    '{{messagePreview}}': escapeHtml(data.messagePreview || data.messageContent.substring(0, 100)),
    '{{conversationUrl}}': data.conversationUrl,
    '{{siteName}}': siteName,
    '{{siteUrl}}': siteUrl,
    '{{waitTime}}': data.waitTime || '15 minutes',
    '{{adminName}}': data.adminName || 'Support Team',
  };

  Object.entries(replacements).forEach(([key, value]) => {
    subject = subject.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    html = html.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });

  // Handle conditional blocks (simple handlebars-style conditionals)
  // Remove {{#userEmail}}...{{/userEmail}} blocks if userEmail is empty
  if (!data.userEmail) {
    html = html.replace(/\{\{#userEmail\}\}[\s\S]*?\{\{\/userEmail\}\}/g, '');
  } else {
    html = html.replace(/\{\{#userEmail\}\}/g, '').replace(/\{\{\/userEmail\}\}/g, '');
  }

  return { subject, html };
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  // Server-side fallback
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Email templates by locale
 */
const emailTemplates: Record<'en' | 'ru', Record<ChatEmailTemplateType, ChatEmailTemplate>> = {
  en: {
    [ChatEmailTemplateType.NEW_USER_MESSAGE_TO_ADMIN]: {
      subject: 'New Chat Message from {{userName}} - {{siteName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">New Chat Message</h1>
            <p style="color: #6b7280; font-size: 16px;">{{siteName}} Support</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">New message from {{userName}}</h2>
            <p style="color: #4b5563; margin-bottom: 20px;">
              <strong>User:</strong> {{userName}} {{#userEmail}}({{userEmail}}){{/userEmail}}
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0;">
              <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">{{messagePreview}}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{conversationUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Conversation</a>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>This is an automated notification from {{siteName}}.</p>
          </div>
        </div>
      `,
    },
    [ChatEmailTemplateType.ADMIN_RESPONSE_TO_USER]: {
      subject: 'Response from {{siteName}} Support',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Support Response</h1>
            <p style="color: #6b7280; font-size: 16px;">{{siteName}}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Hello {{userName}},</h2>
            <p style="color: #4b5563; margin-bottom: 20px;">We've responded to your message:</p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">{{messageContent}}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{conversationUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Reply in Chat</a>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>Continue the conversation at <a href="{{conversationUrl}}" style="color: #2563eb;">{{siteUrl}}</a></p>
          </div>
        </div>
      `,
    },
    [ChatEmailTemplateType.UNATTENDED_MESSAGE_ALERT]: {
      subject: 'Unanswered Chat Message - {{waitTime}} - {{siteName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin-bottom: 10px;">⚠️ Unattended Message Alert</h1>
            <p style="color: #6b7280; font-size: 16px;">{{siteName}} Support</p>
          </div>
          
          <div style="background: #fef2f2; padding: 30px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #dc2626;">
            <h2 style="color: #991b1b; margin-bottom: 15px;">Action Required</h2>
            <p style="color: #7f1d1d; margin-bottom: 20px;">
              A user message has been waiting for <strong>{{waitTime}}</strong> without a response.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #4b5563; margin-bottom: 10px;"><strong>User:</strong> {{userName}} {{#userEmail}}({{userEmail}}){{/userEmail}}</p>
              <div style="border-left: 4px solid #dc2626; padding-left: 15px; margin-top: 15px;">
                <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">{{messagePreview}}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{conversationUrl}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Respond Now</a>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>This is an automated alert from {{siteName}}.</p>
          </div>
        </div>
      `,
    },
    [ChatEmailTemplateType.CHAT_SUMMARY]: {
      subject: 'Chat Summary - {{siteName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Chat Summary</h1>
            <p style="color: #6b7280; font-size: 16px;">{{siteName}}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Hello {{userName}},</h2>
            <p style="color: #4b5563; margin-bottom: 20px;">Here's a summary of your recent conversation:</p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">{{messageContent}}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{conversationUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Full Conversation</a>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>Thank you for contacting {{siteName}} support.</p>
          </div>
        </div>
      `,
    },
  },
  ru: {
    [ChatEmailTemplateType.NEW_USER_MESSAGE_TO_ADMIN]: {
      subject: 'Новое сообщение в чате от {{userName}} - {{siteName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Новое сообщение в чате</h1>
            <p style="color: #6b7280; font-size: 16px;">Поддержка {{siteName}}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Новое сообщение от {{userName}}</h2>
            <p style="color: #4b5563; margin-bottom: 20px;">
              <strong>Пользователь:</strong> {{userName}} {{#userEmail}}({{userEmail}}){{/userEmail}}
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0;">
              <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">{{messagePreview}}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{conversationUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Открыть разговор</a>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>Это автоматическое уведомление от {{siteName}}.</p>
          </div>
        </div>
      `,
    },
    [ChatEmailTemplateType.ADMIN_RESPONSE_TO_USER]: {
      subject: 'Ответ от поддержки {{siteName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Ответ поддержки</h1>
            <p style="color: #6b7280; font-size: 16px;">{{siteName}}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Здравствуйте, {{userName}}!</h2>
            <p style="color: #4b5563; margin-bottom: 20px;">Мы ответили на ваше сообщение:</p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">{{messageContent}}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{conversationUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Ответить в чате</a>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>Продолжите разговор на <a href="{{conversationUrl}}" style="color: #2563eb;">{{siteUrl}}</a></p>
          </div>
        </div>
      `,
    },
    [ChatEmailTemplateType.UNATTENDED_MESSAGE_ALERT]: {
      subject: 'Неотвеченное сообщение - {{waitTime}} - {{siteName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin-bottom: 10px;">⚠️ Предупреждение о неотвеченном сообщении</h1>
            <p style="color: #6b7280; font-size: 16px;">Поддержка {{siteName}}</p>
          </div>
          
          <div style="background: #fef2f2; padding: 30px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #dc2626;">
            <h2 style="color: #991b1b; margin-bottom: 15px;">Требуется действие</h2>
            <p style="color: #7f1d1d; margin-bottom: 20px;">
              Сообщение пользователя ждет ответа уже <strong>{{waitTime}}</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #4b5563; margin-bottom: 10px;"><strong>Пользователь:</strong> {{userName}} {{#userEmail}}({{userEmail}}){{/userEmail}}</p>
              <div style="border-left: 4px solid #dc2626; padding-left: 15px; margin-top: 15px;">
                <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">{{messagePreview}}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{conversationUrl}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Ответить сейчас</a>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>Это автоматическое предупреждение от {{siteName}}.</p>
          </div>
        </div>
      `,
    },
    [ChatEmailTemplateType.CHAT_SUMMARY]: {
      subject: 'Сводка чата - {{siteName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Сводка чата</h1>
            <p style="color: #6b7280; font-size: 16px;">{{siteName}}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Здравствуйте, {{userName}}!</h2>
            <p style="color: #4b5563; margin-bottom: 20px;">Вот сводка вашего недавнего разговора:</p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">{{messageContent}}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{conversationUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Просмотреть весь разговор</a>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>Спасибо за обращение в поддержку {{siteName}}.</p>
          </div>
        </div>
      `,
    },
  },
};

