/**
 * Contact Notification Service (SRP: Contact Notification Orchestration)
 * 
 * Orchestrates contact form notifications:
 * - Admin email notifications for new submissions
 * - Auto-response emails to users
 * - Fetches admin emails from database
 */

import { Resend } from 'resend';
import { createContextLogger } from '@/shared/utils/logger';
import { supabaseAdmin } from '@/lib/supabase';
import {
  getAdminNotificationTemplate,
  getUserAutoResponseTemplate,
  ContactEmailTemplateType,
  type ContactEmailTemplateData,
} from '@/lib/email/templates/contact-templates';
import {
  getContactEmailFromAddress,
  getAdminFallbackEmail,
  isAutoResponseEnabled,
  isAdminNotificationEnabled,
  getContactSiteName,
} from '@/lib/email/config/contact-email-config';
import type { ContactFormData } from '../types/contact.types';

export interface ContactSubmission extends ContactFormData {
  id: string;
  locale: string;
}

export interface NotificationResult {
  success: boolean;
  adminNotificationSent?: boolean;
  autoResponseSent?: boolean;
  adminEmailError?: string;
  autoResponseError?: string;
}

export class ContactNotificationService {
  private resend: Resend | null = null;
  private logger = createContextLogger('contact-notification-service');

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('Resend API key not configured - emails will not be sent');
    }
  }

  /**
   * Send all notifications for a contact form submission
   * Does not throw - returns result with success/failure details
   */
  async sendNotifications(submission: ContactSubmission): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: true,
      adminNotificationSent: false,
      autoResponseSent: false,
    };

    if (!this.resend) {
      this.logger.warn('Resend not configured - skipping notifications');
      return result;
    }

    // Send admin notification
    if (isAdminNotificationEnabled()) {
      try {
        await this.notifyAdmins(submission);
        result.adminNotificationSent = true;
      } catch (error) {
        this.logger.error('Failed to send admin notification', error as Error, {
          contactId: submission.id,
        });
        result.adminEmailError = error instanceof Error ? error.message : 'Unknown error';
        result.success = false;
      }
    }

    // Send auto-response to user
    if (isAutoResponseEnabled()) {
      try {
        await this.sendAutoResponse(
          submission.email,
          submission.name,
          submission.locale as 'en' | 'ru',
          submission.subject,
          submission.id
        );
        result.autoResponseSent = true;
      } catch (error) {
        this.logger.error('Failed to send auto-response', error as Error, {
          contactId: submission.id,
          userEmail: submission.email,
        });
        result.autoResponseError = error instanceof Error ? error.message : 'Unknown error';
        // Don't mark as failure - auto-response is secondary
      }
    }

    return result;
  }

  /**
   * Notify all admins about a new contact form submission
   */
  async notifyAdmins(submission: ContactSubmission): Promise<void> {
    if (!this.resend) {
      throw new Error('Resend not configured');
    }

    const adminEmails = await this.getAdminEmails();
    
    if (adminEmails.length === 0) {
      this.logger.warn('No admin emails found - using fallback');
      adminEmails.push(getAdminFallbackEmail());
    }

    const templateData: ContactEmailTemplateData = {
      name: submission.name,
      email: submission.email,
      phone: submission.phone || undefined,
      company: submission.company || undefined,
      subject: submission.subject,
      message: submission.message,
      inquiryType: submission.inquiryType,
      urgencyLevel: submission.urgencyLevel,
      preferredContactMethod: submission.preferredContactMethod,
      locale: (submission.locale as 'en' | 'ru') || 'en',
      contactId: submission.id,
    };

    const template = getAdminNotificationTemplate(templateData);
    const fromAddress = getContactEmailFromAddress();
    const siteName = getContactSiteName();

    this.logger.info('Sending admin notification', {
      contactId: submission.id,
      adminCount: adminEmails.length,
      urgency: submission.urgencyLevel,
    });

    const { error } = await this.resend.emails.send({
      from: `${siteName} Contact <${fromAddress}>`,
      to: adminEmails,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [
        { name: 'notification_type', value: ContactEmailTemplateType.ADMIN_NOTIFICATION },
        { name: 'contact_id', value: submission.id },
        { name: 'urgency', value: submission.urgencyLevel },
      ],
    });

    if (error) {
      throw new Error(error.message || 'Failed to send admin notification');
    }

    this.logger.info('Admin notification sent successfully', {
      contactId: submission.id,
      recipientCount: adminEmails.length,
    });
  }

  /**
   * Send auto-response email to the user who submitted the contact form
   */
  async sendAutoResponse(
    email: string,
    name: string,
    locale: 'en' | 'ru',
    subject?: string,
    contactId?: string
  ): Promise<void> {
    if (!this.resend) {
      throw new Error('Resend not configured');
    }

    const template = getUserAutoResponseTemplate({
      name,
      locale,
      subject,
      contactId,
    });

    const fromAddress = getContactEmailFromAddress();
    const siteName = getContactSiteName();

    this.logger.info('Sending auto-response', {
      email,
      locale,
      contactId,
    });

    const { error } = await this.resend.emails.send({
      from: `${siteName} <${fromAddress}>`,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [
        { name: 'notification_type', value: ContactEmailTemplateType.USER_AUTO_RESPONSE },
        ...(contactId ? [{ name: 'contact_id', value: contactId }] : []),
      ],
    });

    if (error) {
      throw new Error(error.message || 'Failed to send auto-response');
    }

    this.logger.info('Auto-response sent successfully', {
      email,
      contactId,
    });
  }

  /**
   * Fetch admin emails from user_profiles table
   * Returns emails of users with role = 'admin' who have email_notifications enabled
   */
  private async getAdminEmails(): Promise<string[]> {
    try {
      if (!supabaseAdmin) {
        this.logger.warn('Supabase admin client not available');
        return [];
      }

      // Get admin users from user_profiles
      const { data: adminProfiles, error: profilesError } = await supabaseAdmin
        .from('user_profiles')
        .select('user_id, email, name')
        .eq('role', 'admin');

      if (profilesError) {
        this.logger.error('Failed to fetch admin profiles', profilesError);
        return [];
      }

      if (!adminProfiles || adminProfiles.length === 0) {
        this.logger.warn('No admin profiles found');
        return [];
      }

      // Get notification preferences for admins
      const adminIds = adminProfiles.map(p => p.user_id);
      const { data: preferences, error: prefsError } = await supabaseAdmin
        .from('user_preferences')
        .select('user_id, email_notifications')
        .in('user_id', adminIds);

      if (prefsError) {
        this.logger.warn('Failed to fetch admin preferences - using all admins', prefsError);
      }

      // Filter admins by notification preference
      const prefsMap = new Map(
        (preferences || []).map(p => [p.user_id, p.email_notifications])
      );

      const adminEmails = adminProfiles
        .filter(admin => {
          // Include if preference not set (default true) or explicitly enabled
          const notificationsEnabled = prefsMap.get(admin.user_id);
          return notificationsEnabled === undefined || notificationsEnabled === true;
        })
        .map(admin => admin.email)
        .filter((email): email is string => !!email);

      this.logger.info('Fetched admin emails', {
        totalAdmins: adminProfiles.length,
        withNotificationsEnabled: adminEmails.length,
      });

      return adminEmails;
    } catch (error) {
      this.logger.error('Exception fetching admin emails', error as Error);
      return [];
    }
  }
}

