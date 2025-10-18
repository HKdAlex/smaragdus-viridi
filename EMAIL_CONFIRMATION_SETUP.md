# Email Confirmation Setup Guide

This guide explains how to configure email confirmation with locale support and proper redirect URLs for the Smaragdus Viridi application.

## Current Implementation Status

✅ **Completed:**

- Check-email page with locale support (`/{locale}/check-email`)
- Auth callback route with locale preservation
- Signup flow with locale-aware redirects
- English and Russian translations for email confirmation

## Required Configuration

### 1. Environment Variables

Set these environment variables in your production environment:

```bash
# Production Configuration
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Supabase Configuration

#### A. Site URL Configuration

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Set **Site URL** to your primary domain:
   ```
   https://crystalllique.com
   ```

#### B. Send Email Hook Configuration

1. Go to **Authentication** → **Hooks**
2. Enable the **Send Email** hook
3. Set the hook URL to your deployed Edge Function:
   ```
   https://dpqapyojcdtrjwuhybky.supabase.co/functions/v1/send-email
   ```
4. Generate a webhook secret and set it as `SEND_EMAIL_HOOK_SECRET`
5. Deploy the Edge Function:
   ```bash
   supabase functions deploy send-email --no-verify-jwt
   ```

#### C. Redirect URLs Configuration

1. In **Authentication** → **URL Configuration**
2. Add these **Redirect URLs**:
   ```
   https://crystalllique.com/api/auth/callback
   https://crystallique.ru/api/auth/callback
   https://crystalllique.com/api/auth/callback?locale=en&next=/en/profile
   https://crystallique.ru/api/auth/callback?locale=ru&next=/ru/profile
   ```

### 3. Resend Configuration

The application uses Resend for sending emails with locale support:

1. **Resend API Key**: Already configured in environment variables
2. **Sender Domain**: Configure `noreply@crystalllique.com` in Resend
3. **Templates**: Handled by the Edge Function with locale detection
4. **Fallback**: Defaults to English if locale detection fails

## Deployment Steps

### 1. Deploy Edge Function

```bash
# Deploy the send-email Edge Function
supabase functions deploy send-email --no-verify-jwt

# Set environment variables for the function
supabase secrets set RESEND_API_KEY=re_QXoBVHyH_7UQwkH6mbLdxzk9acyTzPwYY
supabase secrets set NEXT_PUBLIC_APP_URL=https://crystalllique.com
supabase secrets set SEND_EMAIL_HOOK_SECRET=your-webhook-secret-here
```

### 2. Configure Supabase Dashboard

1. Go to **Authentication** → **Hooks**
2. Enable **Send Email** hook
3. Set URL: `https://dpqapyojcdtrjwuhybky.supabase.co/functions/v1/send-email`
4. Set webhook secret (same as `SEND_EMAIL_HOOK_SECRET`)

### 3. Test Email Flow

1. Register a new user with locale detection
2. Check email delivery via Resend dashboard
3. Verify email contains correct locale content
4. Test confirmation link functionality

## Testing the Flow

### 1. Development Testing

```bash
# Set development environment
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Production Testing

1. Deploy with production environment variables
2. Test signup flow:
   - User registers → redirected to `/{locale}/check-email`
   - User receives email with confirmation link
   - User clicks link → redirected to `/{locale}/profile`

## Troubleshooting

### Common Issues

1. **Email not received**

   - Check spam folder
   - Verify SMTP configuration
   - Check Supabase email logs

2. **Redirect to localhost in production**

   - Verify `NEXT_PUBLIC_APP_URL` is set correctly
   - Check Supabase Site URL configuration

3. **Locale not preserved**
   - Ensure locale parameter is passed in signup
   - Check auth callback route configuration

### Debug Steps

1. Check environment variables:

   ```bash
   echo $NEXT_PUBLIC_APP_URL
   ```

2. Check Supabase configuration:

   - Site URL matches production domain
   - Redirect URLs include callback route

3. Check email templates:
   - Templates use correct language
   - Confirmation URL includes locale parameters

## Security Considerations

1. **HTTPS Required**: Always use HTTPS in production
2. **Domain Validation**: Ensure redirect URLs match your domain
3. **Email Verification**: Require email confirmation for new accounts
4. **Rate Limiting**: Supabase provides built-in rate limiting

## Next Steps

After completing this setup:

1. Test the complete signup flow in production
2. Monitor email delivery rates
3. Set up email analytics if needed
4. Consider adding email templates for other languages

## Support

If you encounter issues:

1. Check Supabase logs in the dashboard
2. Review application logs for errors
3. Verify environment variable configuration
4. Test with a fresh email address
