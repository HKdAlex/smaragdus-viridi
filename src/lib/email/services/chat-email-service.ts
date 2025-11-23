/**
 * Chat Email Service (SRP: Email Sending Only)
 * 
 * Pure email sending service with no business logic.
 * Only handles email delivery via Resend SDK.
 */

import { Resend } from 'resend';
import { getEmailFromAddress } from '../config/chat-email-config';
import type { ChatEmailTemplateType } from '../templates/chat-templates';
import { createContextLogger } from '@/shared/utils/logger';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailMetadata {
  chatMessageId?: string;
  userId?: string;
  notificationType: ChatEmailTemplateType;
}

export class ChatEmailService {
  private resend: Resend;
  private logger = createContextLogger('chat-email-service');

  constructor(resendApiKey: string) {
    if (!resendApiKey) {
      throw new Error('Resend API key is required');
    }
    this.resend = new Resend(resendApiKey);
  }

  /**
   * Send email via Resend
   * Pure function - no business logic, only email delivery
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    html: string,
    metadata?: EmailMetadata
  ): Promise<EmailSendResult> {
    try {
      const recipients = Array.isArray(to) ? to : [to];
      const fromAddress = getEmailFromAddress();

      this.logger.info('Sending email', {
        to: recipients,
        subject,
        notificationType: metadata?.notificationType,
        chatMessageId: metadata?.chatMessageId,
      });

      // Format from address: "Site Name <email@domain.com>"
      const fromParts = fromAddress.split('@');
      const domainName = fromParts.length > 1 ? fromParts[1].split('.')[0] : 'Crystallique';
      const formattedFrom = `${domainName.charAt(0).toUpperCase() + domainName.slice(1)} <${fromAddress}>`;

      const { data, error } = await this.resend.emails.send({
        from: formattedFrom,
        to: recipients,
        subject,
        html,
        tags: metadata
          ? [
              { name: 'notification_type', value: metadata.notificationType },
              ...(metadata.chatMessageId
                ? [{ name: 'chat_message_id', value: metadata.chatMessageId }]
                : []),
              ...(metadata.userId ? [{ name: 'user_id', value: metadata.userId }] : []),
            ]
          : undefined,
      });

      if (error) {
        this.logger.error('Failed to send email', error, {
          to: recipients,
          subject,
          notificationType: metadata?.notificationType,
        });

        return {
          success: false,
          error: error.message || 'Failed to send email',
        };
      }

      this.logger.info('Email sent successfully', {
        messageId: data?.id,
        to: recipients,
        notificationType: metadata?.notificationType,
      });

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Exception while sending email', error as Error, {
        to: Array.isArray(to) ? to : [to],
        subject,
        notificationType: metadata?.notificationType,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

