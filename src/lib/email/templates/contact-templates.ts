/**
 * Contact Email Templates (SSOT)
 * 
 * Single source of truth for all contact form email templates.
 * Pure functions - no side effects, only template rendering.
 */

import { getContactSiteName, getContactSiteUrl } from '../config/contact-email-config';

export enum ContactEmailTemplateType {
  ADMIN_NOTIFICATION = 'contact_admin_notification',
  USER_AUTO_RESPONSE = 'contact_user_auto_response',
}

export interface ContactEmailTemplateData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  inquiryType: string;
  urgencyLevel: string;
  preferredContactMethod?: string;
  locale: 'en' | 'ru';
  contactId?: string;
}

export interface ContactEmailTemplate {
  subject: string;
  html: string;
}

/**
 * Get admin notification email template
 */
export function getAdminNotificationTemplate(
  data: ContactEmailTemplateData
): { subject: string; html: string; text: string } {
  const siteName = getContactSiteName();
  const siteUrl = getContactSiteUrl();
  const locale = data.locale || 'en';
  
  const urgencyBadge = getUrgencyBadge(data.urgencyLevel, locale);
  const inquiryLabel = getInquiryTypeLabel(data.inquiryType, locale);
  
  const templates = {
    en: {
      subject: `[${urgencyBadge}] New Contact Form: ${data.subject} - ${siteName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">New Contact Form Submission</h1>
            <p style="color: #6b7280; font-size: 16px;">${siteName}</p>
          </div>
          
          <div style="background: ${getUrgencyColor(data.urgencyLevel)}; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <span style="background: ${getUrgencyBadgeColor(data.urgencyLevel)}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${urgencyBadge}</span>
              <span style="color: #6b7280; font-size: 14px;">${inquiryLabel}</span>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">${escapeHtml(data.subject)}</h2>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>Name:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937;">${escapeHtml(data.name)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937;"><a href="mailto:${escapeHtml(data.email)}" style="color: #2563eb;">${escapeHtml(data.email)}</a></td>
                </tr>
                ${data.phone ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Phone:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937;">${escapeHtml(data.phone)}</td>
                </tr>
                ` : ''}
                ${data.company ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Company:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937;">${escapeHtml(data.company)}</td>
                </tr>
                ` : ''}
                ${data.preferredContactMethod ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Preferred Contact:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937;">${escapeHtml(data.preferredContactMethod)}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb;">
              <h3 style="color: #1f2937; margin-bottom: 10px; font-size: 14px;">Message:</h3>
              <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:${escapeHtml(data.email)}?subject=Re: ${encodeURIComponent(data.subject)}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Reply to ${escapeHtml(data.name)}</a>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>This is an automated notification from ${siteName}.</p>
            ${data.contactId ? `<p style="font-size: 12px;">Reference ID: ${data.contactId}</p>` : ''}
          </div>
        </div>
      `,
      text: `
New Contact Form Submission - ${siteName}

Priority: ${urgencyBadge}
Type: ${inquiryLabel}
Subject: ${data.subject}

From: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}
${data.company ? `Company: ${data.company}` : ''}
${data.preferredContactMethod ? `Preferred Contact: ${data.preferredContactMethod}` : ''}

Message:
${data.message}

---
Reply to this inquiry by emailing: ${data.email}
${data.contactId ? `Reference ID: ${data.contactId}` : ''}
      `.trim(),
    },
    ru: {
      subject: `[${urgencyBadge}] Новая заявка: ${data.subject} - ${siteName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Новая заявка с формы обратной связи</h1>
            <p style="color: #6b7280; font-size: 16px;">${siteName}</p>
          </div>
          
          <div style="background: ${getUrgencyColor(data.urgencyLevel)}; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <span style="background: ${getUrgencyBadgeColor(data.urgencyLevel)}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${urgencyBadge}</span>
              <span style="color: #6b7280; font-size: 14px;">${inquiryLabel}</span>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">${escapeHtml(data.subject)}</h2>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 140px;"><strong>Имя:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937;">${escapeHtml(data.name)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937;"><a href="mailto:${escapeHtml(data.email)}" style="color: #2563eb;">${escapeHtml(data.email)}</a></td>
                </tr>
                ${data.phone ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Телефон:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937;">${escapeHtml(data.phone)}</td>
                </tr>
                ` : ''}
                ${data.company ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Компания:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937;">${escapeHtml(data.company)}</td>
                </tr>
                ` : ''}
                ${data.preferredContactMethod ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Способ связи:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937;">${escapeHtml(data.preferredContactMethod)}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb;">
              <h3 style="color: #1f2937; margin-bottom: 10px; font-size: 14px;">Сообщение:</h3>
              <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:${escapeHtml(data.email)}?subject=Re: ${encodeURIComponent(data.subject)}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Ответить ${escapeHtml(data.name)}</a>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>Это автоматическое уведомление от ${siteName}.</p>
            ${data.contactId ? `<p style="font-size: 12px;">ID обращения: ${data.contactId}</p>` : ''}
          </div>
        </div>
      `,
      text: `
Новая заявка с формы обратной связи - ${siteName}

Приоритет: ${urgencyBadge}
Тип: ${inquiryLabel}
Тема: ${data.subject}

От: ${data.name}
Email: ${data.email}
${data.phone ? `Телефон: ${data.phone}` : ''}
${data.company ? `Компания: ${data.company}` : ''}
${data.preferredContactMethod ? `Способ связи: ${data.preferredContactMethod}` : ''}

Сообщение:
${data.message}

---
Ответить на обращение: ${data.email}
${data.contactId ? `ID обращения: ${data.contactId}` : ''}
      `.trim(),
    },
  };
  
  return templates[locale] || templates.en;
}

/**
 * Get user auto-response email template
 */
export function getUserAutoResponseTemplate(
  data: { name: string; locale: 'en' | 'ru'; subject?: string; contactId?: string }
): { subject: string; html: string; text: string } {
  const siteName = getContactSiteName();
  const siteUrl = getContactSiteUrl();
  const locale = data.locale || 'en';
  
  const templates = {
    en: {
      subject: `Thank you for contacting ${siteName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Thank You for Contacting Us</h1>
            <p style="color: #6b7280; font-size: 16px;">${siteName}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Dear ${escapeHtml(data.name)},</h2>
            
            <p style="color: #4b5563; margin-bottom: 20px; line-height: 1.6;">
              Thank you for reaching out to us. We have received your message${data.subject ? ` regarding "${escapeHtml(data.subject)}"` : ''} and will get back to you as soon as possible.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="color: #1f2937; margin: 0;">
                <strong>What happens next?</strong><br><br>
                Our team typically responds within 24 hours during business days. For urgent inquiries, we prioritize responses accordingly.
              </p>
            </div>
            
            <p style="color: #4b5563; margin-top: 20px; line-height: 1.6;">
              In the meantime, feel free to explore our collection of exquisite gemstones at <a href="${siteUrl}" style="color: #2563eb;">${siteUrl}</a>.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/catalog" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Browse Our Collection</a>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>Best regards,<br>The ${siteName} Team</p>
            ${data.contactId ? `<p style="font-size: 12px; margin-top: 20px;">Reference: ${data.contactId}</p>` : ''}
          </div>
        </div>
      `,
      text: `
Dear ${data.name},

Thank you for reaching out to us. We have received your message${data.subject ? ` regarding "${data.subject}"` : ''} and will get back to you as soon as possible.

What happens next?
Our team typically responds within 24 hours during business days. For urgent inquiries, we prioritize responses accordingly.

In the meantime, feel free to explore our collection of exquisite gemstones at ${siteUrl}.

Best regards,
The ${siteName} Team
${data.contactId ? `\nReference: ${data.contactId}` : ''}
      `.trim(),
    },
    ru: {
      subject: `Спасибо за обращение в ${siteName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Спасибо за обращение</h1>
            <p style="color: #6b7280; font-size: 16px;">${siteName}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Уважаемый(ая) ${escapeHtml(data.name)},</h2>
            
            <p style="color: #4b5563; margin-bottom: 20px; line-height: 1.6;">
              Благодарим вас за обращение к нам. Мы получили ваше сообщение${data.subject ? ` по теме "${escapeHtml(data.subject)}"` : ''} и свяжемся с вами в ближайшее время.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="color: #1f2937; margin: 0;">
                <strong>Что дальше?</strong><br><br>
                Наша команда обычно отвечает в течение 24 часов в рабочие дни. Срочные запросы обрабатываются приоритетно.
              </p>
            </div>
            
            <p style="color: #4b5563; margin-top: 20px; line-height: 1.6;">
              Тем временем приглашаем вас ознакомиться с нашей коллекцией изысканных драгоценных камней на <a href="${siteUrl}" style="color: #2563eb;">${siteUrl}</a>.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/catalog" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Смотреть коллекцию</a>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>С уважением,<br>Команда ${siteName}</p>
            ${data.contactId ? `<p style="font-size: 12px; margin-top: 20px;">ID обращения: ${data.contactId}</p>` : ''}
          </div>
        </div>
      `,
      text: `
Уважаемый(ая) ${data.name},

Благодарим вас за обращение к нам. Мы получили ваше сообщение${data.subject ? ` по теме "${data.subject}"` : ''} и свяжемся с вами в ближайшее время.

Что дальше?
Наша команда обычно отвечает в течение 24 часов в рабочие дни. Срочные запросы обрабатываются приоритетно.

Тем временем приглашаем вас ознакомиться с нашей коллекцией изысканных драгоценных камней на ${siteUrl}.

С уважением,
Команда ${siteName}
${data.contactId ? `\nID обращения: ${data.contactId}` : ''}
      `.trim(),
    },
  };
  
  return templates[locale] || templates.en;
}

// ===== Helper Functions =====

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getUrgencyBadge(urgency: string, locale: 'en' | 'ru'): string {
  const labels = {
    en: {
      low: 'Low Priority',
      normal: 'Normal',
      high: 'High Priority',
      urgent: 'URGENT',
    },
    ru: {
      low: 'Низкий',
      normal: 'Обычный',
      high: 'Высокий',
      urgent: 'СРОЧНО',
    },
  };
  return labels[locale]?.[urgency as keyof typeof labels.en] || labels.en.normal;
}

function getUrgencyColor(urgency: string): string {
  const colors: Record<string, string> = {
    low: '#f8fafc',
    normal: '#f8fafc',
    high: '#fef3c7',
    urgent: '#fef2f2',
  };
  return colors[urgency] || colors.normal;
}

function getUrgencyBadgeColor(urgency: string): string {
  const colors: Record<string, string> = {
    low: '#6b7280',
    normal: '#2563eb',
    high: '#f59e0b',
    urgent: '#dc2626',
  };
  return colors[urgency] || colors.normal;
}

function getInquiryTypeLabel(type: string, locale: 'en' | 'ru'): string {
  const labels = {
    en: {
      general: 'General Inquiry',
      product: 'Product Question',
      order: 'Order Related',
      partnership: 'Partnership',
      support: 'Support',
      other: 'Other',
    },
    ru: {
      general: 'Общий вопрос',
      product: 'О продукте',
      order: 'По заказу',
      partnership: 'Партнёрство',
      support: 'Поддержка',
      other: 'Другое',
    },
  };
  return labels[locale]?.[type as keyof typeof labels.en] || type;
}

