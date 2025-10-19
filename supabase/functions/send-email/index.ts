// @ts-ignore
import { Resend } from "npm:resend";
// @ts-ignore
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

// @ts-ignore
const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
// @ts-ignore
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

// Email templates by locale
const emailTemplates = {
  en: {
    signup: {
      subject: "Confirm Your Email - Crystallique",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to Crystallique</h1>
            <p style="color: #6b7280; font-size: 16px;">Your premium gemstone collection awaits</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Confirm your email</h2>
            <p style="color: #4b5563; margin-bottom: 20px;">Thank you for joining our community! Please confirm your email address to complete your registration.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{confirmation_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Confirm Your Email</a>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Alternative:</strong> You can also enter this verification code: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">{{token}}</code>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p style="margin-top: 20px;">
              <a href="{{site_url}}" style="color: #2563eb;">Visit Crystallique</a>
            </p>
          </div>
        </div>
      `,
    },
    recovery: {
      subject: "Reset Your Password - Crystallique",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Password Reset</h1>
            <p style="color: #6b7280; font-size: 16px;">Crystallique</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Reset your password</h2>
            <p style="color: #4b5563; margin-bottom: 20px;">We received a request to reset your password. Click the button below to create a new password.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{confirmation_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Reset Password</a>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Alternative:</strong> You can also enter this verification code: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">{{token}}</code>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p style="margin-top: 20px;">
              <a href="{{site_url}}" style="color: #2563eb;">Visit Crystallique</a>
            </p>
          </div>
        </div>
      `,
    },
  },
  ru: {
    signup: {
      subject: "Подтвердите ваш email - Crystallique",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Добро пожаловать в Crystallique</h1>
            <p style="color: #6b7280; font-size: 16px;">Ваша премиальная коллекция драгоценных камней ждет вас</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Подтвердите ваш email</h2>
            <p style="color: #4b5563; margin-bottom: 20px;">Спасибо за присоединение к нашему сообществу! Пожалуйста, подтвердите ваш email адрес для завершения регистрации.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{confirmation_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Подтвердить Email</a>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Альтернативно:</strong> Вы также можете ввести этот код подтверждения: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">{{token}}</code>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>Если вы не создавали аккаунт, можете проигнорировать это письмо.</p>
            <p style="margin-top: 20px;">
              <a href="{{site_url}}" style="color: #2563eb;">Посетить Crystallique</a>
            </p>
          </div>
        </div>
      `,
    },
    recovery: {
      subject: "Сброс пароля - Crystallique",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Сброс пароля</h1>
            <p style="color: #6b7280; font-size: 16px;">Crystallique</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Сбросить пароль</h2>
            <p style="color: #4b5563; margin-bottom: 20px;">Мы получили запрос на сброс вашего пароля. Нажмите кнопку ниже, чтобы создать новый пароль.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{confirmation_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Сбросить пароль</a>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Альтернативно:</strong> Вы также можете ввести этот код подтверждения: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">{{token}}</code>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>Если вы не запрашивали сброс пароля, можете проигнорировать это письмо.</p>
            <p style="margin-top: 20px;">
              <a href="{{site_url}}" style="color: #2563eb;">Посетить Crystallique</a>
            </p>
          </div>
        </div>
      `,
    },
  },
};

function generateConfirmationURL(
  emailData: any,
  locale: string = "en"
): string {
  // Use locale-specific domain
  const baseUrl =
    locale === "ru" ? "https://crystallique.ru" : "https://crystalllique.com";

  return `${baseUrl}/api/auth/callback?token_hash=${emailData.token_hash}&type=${emailData.email_action_type}&locale=${locale}&next=/profile`;
}

function detectLocale(userEmail: string, userMetadata: any): string {
  // Try to detect locale from user metadata first
  if (userMetadata?.locale) {
    return userMetadata.locale;
  }

  // Fallback: detect from email domain or other heuristics
  // For now, default to English
  return "en";
}

// @ts-ignore
Deno.serve(async (req: any) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    if (!hookSecret) {
      console.error("SEND_EMAIL_HOOK_SECRET not configured");
      return new Response("Server configuration error", { status: 500 });
    }

    const wh = new Webhook(hookSecret.replace("v1,whsec_", ""));
    const { user, email_data } = wh.verify(payload, headers) as {
      user: {
        email: string;
        user_metadata: any;
      };
      email_data: {
        token: string;
        token_hash: string;
        email_action_type: string;
        site_url: string;
      };
    };

    // Detect locale
    const locale = detectLocale(user.email, user.user_metadata);

    // Get template for the action type and locale
    const template =
      (emailTemplates as any)[locale]?.[email_data.email_action_type] ||
      (emailTemplates as any)["en"][email_data.email_action_type];

    if (!template) {
      console.error(
        `No template found for action: ${email_data.email_action_type}, locale: ${locale}`
      );
      return new Response("Template not found", { status: 500 });
    }

    // Generate confirmation URL with locale
    const confirmationUrl = generateConfirmationURL(email_data, locale);

    // Replace template variables
    const siteUrl =
      locale === "ru" ? "https://crystallique.ru" : "https://crystalllique.com";
    let htmlBody = template.html
      .replace(/{{confirmation_url}}/g, confirmationUrl)
      .replace(/{{token}}/g, email_data.token || "")
      .replace(/{{site_url}}/g, siteUrl);

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: "Crystallique <noreply@crystalllique.com>",
      to: [user.email],
      subject: template.subject,
      html: htmlBody,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to send email",
            details: error.message,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Email sent successfully to ${user.email} (${locale})`);

    return new Response(
      JSON.stringify({
        message: "Email sent successfully",
        locale: locale,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Send email hook error:", error);
    return new Response(
      JSON.stringify({
        error: {
          message: "Failed to process email request",
          details: error.message,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
