"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/shared/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/shared/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { ContactFormSchema, ContactFormData, ContactSubmissionResponse } from "../types/contact.types";
import { CheckCircle, AlertCircle, Send, Loader2 } from "lucide-react";

interface ContactFormProps {
  className?: string;
}

export function ContactForm({ className = "" }: ContactFormProps) {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const form = useForm<ContactFormData>({
    resolver: zodResolver(ContactFormSchema),
    values: {
      name: '',
      email: '',
      phone: '',
      company: '',
      subject: '',
      message: '',
      inquiryType: 'general',
      preferredContactMethod: 'email',
      urgencyLevel: 'medium',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userAgent: navigator.userAgent,
          referrerUrl: document.referrer,
          locale: document.documentElement.lang || 'en',
        }),
      });

      const result: ContactSubmissionResponse = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        setSubmitMessage(result.message);
        form.reset();
      } else {
        setSubmitStatus('error');
        setSubmitMessage(result.error || t('contact.form.submission.error'));
      }
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage(t('contact.form.submission.networkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl font-semibold text-foreground">
          {t('contact.form.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {submitStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {submitMessage}
            </AlertDescription>
          </Alert>
        )}

        {submitStatus === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {submitMessage}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information Section */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t('contact.form.fields.name.label')} *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('contact.form.fields.name.placeholder')}
                        disabled={isSubmitting}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t('contact.form.fields.email.label')} *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder={t('contact.form.fields.email.placeholder')}
                        disabled={isSubmitting}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t('contact.form.fields.phone.label')}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="tel"
                        placeholder={t('contact.form.fields.phone.placeholder')}
                        disabled={isSubmitting}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t('contact.form.fields.company.label')}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('contact.form.fields.company.placeholder')}
                        disabled={isSubmitting}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Inquiry Details Section */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="inquiryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t('contact.form.fields.inquiryType.label')} *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('contact.form.fields.inquiryType.placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">{t('contact.form.fields.inquiryType.options.general')}</SelectItem>
                        <SelectItem value="purchase">{t('contact.form.fields.inquiryType.options.purchase')}</SelectItem>
                        <SelectItem value="wholesale">{t('contact.form.fields.inquiryType.options.wholesale')}</SelectItem>
                        <SelectItem value="certification">{t('contact.form.fields.inquiryType.options.certification')}</SelectItem>
                        <SelectItem value="support">{t('contact.form.fields.inquiryType.options.support')}</SelectItem>
                        <SelectItem value="partnership">{t('contact.form.fields.inquiryType.options.partnership')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredContactMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t('contact.form.fields.preferredContactMethod.label')} *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('contact.form.fields.preferredContactMethod.placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">{t('contact.form.fields.preferredContactMethod.options.email')}</SelectItem>
                        <SelectItem value="phone">{t('contact.form.fields.preferredContactMethod.options.phone')}</SelectItem>
                        <SelectItem value="whatsapp">{t('contact.form.fields.preferredContactMethod.options.whatsapp')}</SelectItem>
                        <SelectItem value="telegram">{t('contact.form.fields.preferredContactMethod.options.telegram')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="urgencyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t('contact.form.fields.urgencyLevel.label')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('contact.form.fields.urgencyLevel.placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">{t('contact.form.fields.urgencyLevel.options.low')}</SelectItem>
                        <SelectItem value="medium">{t('contact.form.fields.urgencyLevel.options.medium')}</SelectItem>
                        <SelectItem value="high">{t('contact.form.fields.urgencyLevel.options.high')}</SelectItem>
                        <SelectItem value="urgent">{t('contact.form.fields.urgencyLevel.options.urgent')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {t('contact.form.fields.subject.label')} *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('contact.form.fields.subject.placeholder')}
                      disabled={isSubmitting}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {t('contact.form.fields.message.label')} *
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('contact.form.fields.message.placeholder')}
                      rows={6}
                      disabled={isSubmitting}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full sm:w-auto px-8 py-3 min-h-[48px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('contact.form.buttons.sending')}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t('contact.form.buttons.send')}
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              {t('contact.form.privacy.notice')} {' '}
              <span className="text-red-500">*</span> {t('contact.form.requiredFields')}
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
