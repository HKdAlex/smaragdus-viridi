/**
 * Chat Notification Orchestrator (SRP: Business Logic)
 * 
 * Decides WHEN and TO WHOM to send notifications.
 * Business logic only - delegates email sending to services.
 */

import type { ChatMessage } from '../types/chat.types';
import { ChatEmailService, type EmailMetadata } from '@/lib/email/services/chat-email-service';
import { ChatEmailTemplateType, getChatEmailTemplate, renderChatEmailTemplate } from '@/lib/email/templates/chat-templates';
import { getSiteUrl, getUnattendedAlertThreshold } from '@/lib/email/config/chat-email-config';
import { UserPreferencesService } from '@/features/user/services/user-preferences-service';
import { AdminService } from '@/features/admin/services/admin-service';
import { createContextLogger } from '@/shared/utils/logger';
import { supabaseAdmin } from '@/lib/supabase';

export class ChatNotificationOrchestrator {
  private emailService: ChatEmailService;
  private userPreferencesService: UserPreferencesService;
  private adminService: AdminService;
  private logger = createContextLogger('chat-notification-orchestrator');

  constructor(
    emailService: ChatEmailService,
    userPreferencesService: UserPreferencesService,
    adminService: AdminService
  ) {
    this.emailService = emailService;
    this.userPreferencesService = userPreferencesService;
    this.adminService = adminService;
  }

  /**
   * Handle user message sent - notify admins
   */
  async handleUserMessageSent(userId: string, message: ChatMessage): Promise<void> {
    try {
      this.logger.info('Handling user message sent', {
        userId,
        messageId: message.id,
      });

      // Get admin emails
      const adminEmails = await this.adminService.getAdminEmails();
      if (adminEmails.length === 0) {
        this.logger.warn('No admin emails found, skipping notification');
        return;
      }

      // Get user profile for name/email
      const userProfile = await this.getUserProfile(userId);
      const userName = userProfile?.name || 'User';
      const userEmail = userProfile?.email || undefined;

      // Determine locale (default to 'en' for admin notifications)
      const locale = 'en';

      // Get template
      const template = getChatEmailTemplate(ChatEmailTemplateType.NEW_USER_MESSAGE_TO_ADMIN, locale);
      
      // Render template
      const { subject, html } = renderChatEmailTemplate(template, {
        userName,
        userEmail,
        messageContent: message.content,
        messagePreview: message.content.substring(0, 200),
        conversationUrl: `${getSiteUrl()}/admin/dashboard?tab=chat&userId=${userId}`,
        locale,
      });

      // Send email to all admins
      const metadata: EmailMetadata = {
        chatMessageId: message.id,
        userId,
        notificationType: ChatEmailTemplateType.NEW_USER_MESSAGE_TO_ADMIN,
      };

      const result = await this.emailService.sendEmail(adminEmails, subject, html, metadata);
      
      if (!result.success) {
        this.logger.error('Failed to send admin notification', {
          userId,
          messageId: message.id,
          error: result.error,
        });
      } else {
        this.logger.info('Admin notification sent successfully', {
          userId,
          messageId: message.id,
          recipientCount: adminEmails.length,
        });
      }
    } catch (error) {
      this.logger.error('Exception in handleUserMessageSent', error as Error, {
        userId,
        messageId: message.id,
      });
      // Don't throw - email failures shouldn't break chat flow
    }
  }

  /**
   * Handle admin message sent - notify user if preferences enabled
   */
  async handleAdminMessageSent(userId: string, message: ChatMessage, adminId: string): Promise<void> {
    try {
      this.logger.info('Handling admin message sent', {
        userId,
        adminId,
        messageId: message.id,
      });

      // Check user preferences
      const shouldNotify = await this.userPreferencesService.shouldSendChatNotification(userId);
      if (!shouldNotify) {
        this.logger.info('User has disabled chat notifications', { userId });
        return;
      }

      // Get user profile for email and locale
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile?.email) {
        this.logger.warn('User email not found, skipping notification', { userId });
        return;
      }

      const userName = userProfile.name || 'User';
      const locale = (userProfile.language_preference === 'ru' ? 'ru' : 'en') as 'en' | 'ru';

      // Get admin profile for name
      const adminProfile = await this.getUserProfile(adminId);
      const adminName = adminProfile?.name || 'Support Team';

      // Get template
      const template = getChatEmailTemplate(ChatEmailTemplateType.ADMIN_RESPONSE_TO_USER, locale);
      
      // Render template
      const { subject, html } = renderChatEmailTemplate(template, {
        userName,
        userEmail: userProfile.email,
        messageContent: message.content,
        conversationUrl: `${getSiteUrl()}/profile?tab=chat`,
        locale,
        adminName,
      });

      // Send email to user
      const metadata: EmailMetadata = {
        chatMessageId: message.id,
        userId,
        notificationType: ChatEmailTemplateType.ADMIN_RESPONSE_TO_USER,
      };

      const result = await this.emailService.sendEmail(userProfile.email, subject, html, metadata);
      
      if (!result.success) {
        this.logger.error('Failed to send user notification', {
          userId,
          messageId: message.id,
          error: result.error,
        });
      } else {
        this.logger.info('User notification sent successfully', {
          userId,
          messageId: message.id,
        });
      }
    } catch (error) {
      this.logger.error('Exception in handleAdminMessageSent', error as Error, {
        userId,
        adminId,
        messageId: message.id,
      });
      // Don't throw - email failures shouldn't break chat flow
    }
  }

  /**
   * Check for unattended messages and send alerts
   */
  async checkUnattendedMessages(): Promise<void> {
    try {
      if (!supabaseAdmin) {
        this.logger.error('Supabase admin client not available');
        return;
      }

      const thresholdMinutes = getUnattendedAlertThreshold();
      const thresholdDate = new Date();
      thresholdDate.setMinutes(thresholdDate.getMinutes() - thresholdMinutes);

      this.logger.info('Checking for unattended messages', {
        thresholdMinutes,
        thresholdDate: thresholdDate.toISOString(),
      });

      // Find user messages older than threshold without admin response
      const { data: unattendedMessages, error } = await supabaseAdmin
        .from('chat_messages')
        .select('id, user_id, content, created_at')
        .eq('sender_type', 'user')
        .lt('created_at', thresholdDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error('Failed to fetch unattended messages', error);
        return;
      }

      if (!unattendedMessages || unattendedMessages.length === 0) {
        this.logger.info('No unattended messages found');
        return;
      }

      type UnattendedMessage = { id: string; user_id: string; content: string; created_at: string | null };

      // Group by user_id and get the oldest message per user
      const userMessages = new Map<string, UnattendedMessage>();
      for (const message of unattendedMessages) {
        if (!userMessages.has(message.user_id)) {
          userMessages.set(message.user_id, message);
        }
      }

      // Check if there's an admin response after each user message
      const adminEmails = await this.adminService.getAdminEmails();
      if (adminEmails.length === 0) {
        this.logger.warn('No admin emails found, skipping alerts');
        return;
      }

      for (const [userId, message] of userMessages.entries()) {
        // Check if there's an admin response after this message
        const { data: adminResponse } = await supabaseAdmin
          .from('chat_messages')
          .select('id')
          .eq('user_id', userId)
          .eq('sender_type', 'admin')
          .gt('created_at', message.created_at || '')
          .limit(1)
          .single();

        if (adminResponse) {
          // Admin has responded, skip
          continue;
        }

        // Send alert
        await this.sendUnattendedAlert(userId, message, adminEmails);
      }
    } catch (error) {
      this.logger.error('Exception in checkUnattendedMessages', error as Error);
    }
  }

  /**
   * Send unattended message alert to admins
   */
  private async sendUnattendedAlert(
    userId: string,
    message: { id: string; user_id: string; content: string; created_at: string | null },
    adminEmails: string[]
  ): Promise<void> {
    try {
      const userProfile = await this.getUserProfile(userId);
      const userName = userProfile?.name || 'User';
      const userEmail = userProfile?.email || undefined;

      // Calculate wait time
      const messageDate = message.created_at ? new Date(message.created_at) : new Date();
      const waitMinutes = Math.floor((Date.now() - messageDate.getTime()) / 60000);
      const waitTime = waitMinutes < 60 
        ? `${waitMinutes} minutes`
        : `${Math.floor(waitMinutes / 60)} hours`;

      const locale = 'en'; // Admin notifications default to English

      // Get template
      const template = getChatEmailTemplate(ChatEmailTemplateType.UNATTENDED_MESSAGE_ALERT, locale);
      
      // Render template
      const { subject, html } = renderChatEmailTemplate(template, {
        userName,
        userEmail,
        messageContent: message.content,
        messagePreview: message.content.substring(0, 200),
        conversationUrl: `${getSiteUrl()}/admin/dashboard?tab=chat&userId=${userId}`,
        locale,
        waitTime,
      });

      // Send email
      const metadata: EmailMetadata = {
        chatMessageId: message.id,
        userId,
        notificationType: ChatEmailTemplateType.UNATTENDED_MESSAGE_ALERT,
      };

      const result = await this.emailService.sendEmail(adminEmails, subject, html, metadata);
      
      if (!result.success) {
        this.logger.error('Failed to send unattended alert', {
          userId,
          messageId: message.id,
          error: result.error,
        });
      } else {
        this.logger.info('Unattended alert sent successfully', {
          userId,
          messageId: message.id,
          waitMinutes,
        });
      }
    } catch (error) {
      this.logger.error('Exception in sendUnattendedAlert', error as Error, {
        userId,
        messageId: message.id,
      });
    }
  }

  /**
   * Get user profile (helper method)
   */
  private async getUserProfile(userId: string): Promise<{ name: string; email: string | null; language_preference: string | null } | null> {
    if (!supabaseAdmin) {
      return null;
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('name, email, language_preference')
        .eq('user_id', userId)
        .single();

      if (error) {
        this.logger.warn('Failed to get user profile', { userId, error: error.message });
        return null;
      }

      return data;
    } catch (error) {
      this.logger.error('Exception getting user profile', error as Error, { userId });
      return null;
    }
  }
}

