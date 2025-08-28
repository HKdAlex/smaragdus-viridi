import { useTranslations } from 'next-intl';

export const useTranslationsClient = (namespace?: string) => {
  return useTranslations(namespace);
};
