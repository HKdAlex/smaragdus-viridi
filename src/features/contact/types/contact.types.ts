import { z } from "zod";

// Enums for contact form
export type ContactInquiryType = 
  | 'general' 
  | 'purchase' 
  | 'wholesale' 
  | 'certification' 
  | 'support' 
  | 'partnership';

export type ContactMethod = 'email' | 'phone' | 'whatsapp' | 'telegram';

export type ContactUrgencyLevel = 'low' | 'medium' | 'high' | 'urgent';

export type ContactMessageStatus = 'unread' | 'read' | 'in_progress' | 'resolved' | 'archived';

// Contact form validation schema
export const ContactFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  
  email: z.string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must not exceed 255 characters'),
  
  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must not exceed 20 characters')
    .optional()
    .or(z.literal('')),
  
  company: z.string()
    .max(100, 'Company name must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
  
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must not exceed 200 characters'),
  
  message: z.string()
    .min(20, 'Message must be at least 20 characters')
    .max(5000, 'Message must not exceed 5000 characters'),
  
  inquiryType: z.enum(['general', 'purchase', 'wholesale', 'certification', 'support', 'partnership']),
  
  preferredContactMethod: z.enum(['email', 'phone', 'whatsapp', 'telegram']),
  
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export type ContactFormData = z.infer<typeof ContactFormSchema>;

// Database interface for contact messages
export interface ContactMessage extends ContactFormData {
  id: string;
  status: ContactMessageStatus;
  isSpam: boolean;
  adminNotes?: string;
  respondedAt?: string;
  respondedBy?: string;
  userAgent?: string;
  ipAddress?: string;
  locale: string;
  referrerUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface ContactSubmissionResponse {
  success: boolean;
  message: string;
  contactId?: string;
  error?: string;
}

export interface ContactFormErrors {
  [key: string]: string | string[];
}

// Contact information types
export interface ContactInfo {
  email: {
    general: string;
    sales: string;
    support: string;
  };
  phone: {
    main: string;
    whatsapp: string;
    workingHours: string;
  };
  address: {
    line1: string;
    line2?: string;
    city: string;
    country: string;
    postalCode: string;
  };
  social: {
    telegram: string;
    whatsapp: string;
    website: string;
  };
  businessHours: {
    timezone: string;
    weekdays: string;
    weekends?: string;
  };
}
