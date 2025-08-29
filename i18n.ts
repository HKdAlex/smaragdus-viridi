import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is always a string
  const validLocale = locale || 'en';

  // Load all translation files for this locale
  const [
    common,
    auth,
    cart,
    errors,
    footer,
    forms,
    gemstones,
    navigation,
    admin,
    catalog,
  ] = await Promise.all([
    import(`./src/messages/${validLocale}/common.json`).then(m => m.default),
    import(`./src/messages/${validLocale}/auth.json`).then(m => m.default),
    import(`./src/messages/${validLocale}/cart.json`).then(m => m.default),
    import(`./src/messages/${validLocale}/errors.json`).then(m => m.default),
    import(`./src/messages/${validLocale}/footer.json`).then(m => m.default),
    import(`./src/messages/${validLocale}/forms.json`).then(m => m.default),
    import(`./src/messages/${validLocale}/gemstones.json`).then(m => m.default),
    import(`./src/messages/${validLocale}/navigation.json`).then(m => m.default),
    import(`./src/messages/${validLocale}/admin.json`).then(m => m.default),
    import(`./src/messages/${validLocale}/catalog.json`).then(m => m.default),
  ]);

  // Merge all translation files
  const messages = {
    ...common,
    ...auth,
    ...cart,
    ...errors,
    ...footer,
    ...forms,
    ...gemstones,
    ...navigation,
    ...admin,
    ...catalog,
  };

  return {
    locale: validLocale,
    messages,
  };
});
