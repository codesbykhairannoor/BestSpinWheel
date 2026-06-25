import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import idTranslation from './locales/id.json';
import esTranslation from './locales/es.json';
import frTranslation from './locales/fr.json';
import deTranslation from './locales/de.json';
import zhTranslation from './locales/zh.json';
import jaTranslation from './locales/ja.json';
import ptTranslation from './locales/pt.json';
import hiTranslation from './locales/hi.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      id: { translation: idTranslation },
      es: { translation: esTranslation },
      fr: { translation: frTranslation },
      de: { translation: deTranslation },
      zh: { translation: zhTranslation },
      ja: { translation: jaTranslation },
      pt: { translation: ptTranslation },
      hi: { translation: hiTranslation }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
