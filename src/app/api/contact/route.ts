import {
  ContactFormSchema,
  ContactSubmissionResponse,
} from "@/features/contact/types/contact.types";
import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { ContactNotificationService } from "@/features/contact/services/contact-notification-service";
import { createContextLogger } from "@/shared/utils/logger";

const logger = createContextLogger('contact-api');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Validate the form data
    const validationResult = ContactFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          error: "Please check all required fields and try again.",
          validationErrors: validationResult.error.format(),
        } as ContactSubmissionResponse,
        { status: 400 }
      );
    }

    const formData = validationResult.data;

    // Get additional metadata from request
    const userAgent = body.userAgent || request.headers.get("user-agent") || "";
    const referrerUrl =
      body.referrerUrl || request.headers.get("referer") || "";
    const locale = body.locale || "en";

    // Create Supabase client
    const supabase = await createServerSupabaseClient();

    // Insert contact message into database
    const { data, error } = await supabase
      .from("contact_messages")
      .insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company: formData.company || null,
        subject: formData.subject,
        message: formData.message,
        preferred_contact_method: formData.preferredContactMethod,
        inquiry_type: formData.inquiryType,
        urgency_level: formData.urgencyLevel,
        user_agent: userAgent,
        ip_address: clientIP,
        locale: locale,
        referrer_url: referrerUrl,
        status: "unread",
        is_spam: false,
      })
      .select("id")
      .single();

    if (error) {
      logger.error("Database error inserting contact message", error);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to save message",
          error: "There was an error saving your message. Please try again.",
        } as ContactSubmissionResponse,
        { status: 500 }
      );
    }

    // Send notifications (admin notification + user auto-response)
    // Errors are logged but don't fail the submission
    const notificationService = new ContactNotificationService();
    const notificationResult = await notificationService.sendNotifications({
      id: data.id,
      ...formData,
      locale,
    });

    logger.info("Contact form processed", {
      contactId: data.id,
      adminNotificationSent: notificationResult.adminNotificationSent,
      autoResponseSent: notificationResult.autoResponseSent,
      urgency: formData.urgencyLevel,
    });

    // TODO: Integration with CRM system (future enhancement)

    const responseMessages = {
      en: {
        success:
          "Thank you for contacting us! We have received your message and will get back to you within 24 hours.",
        high_urgency:
          "Thank you for contacting us! We have received your urgent message and will prioritize your inquiry.",
        urgent:
          "Thank you for contacting us! We have received your urgent message and will contact you as soon as possible.",
      },
      ru: {
        success:
          "Спасибо за обращение! Мы получили ваше сообщение и свяжемся с вами в течение 24 часов.",
        high_urgency:
          "Спасибо за обращение! Мы получили ваше срочное сообщение и обработаем его приоритетно.",
        urgent:
          "Спасибо за обращение! Мы получили ваше срочное сообщение и свяжемся с вами как можно скорее.",
      },
    };

    const messages =
      responseMessages[locale as keyof typeof responseMessages] ||
      responseMessages.en;

    let successMessage = messages.success;
    if (formData.urgencyLevel === "high") {
      successMessage = messages.high_urgency;
    } else if (formData.urgencyLevel === "urgent") {
      successMessage = messages.urgent;
    }

    return NextResponse.json(
      {
        success: true,
        message: successMessage,
        contactId: data.id,
      } as ContactSubmissionResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error in contact API:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: "An unexpected error occurred. Please try again later.",
      } as ContactSubmissionResponse,
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
