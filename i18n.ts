import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is always a string
  const validLocale = locale || 'en';

  return {
    locale: validLocale,
    messages: (await import(`./src/messages/${validLocale}.json`)).default,
  };
});
