import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = ['en', 'id', 'es', 'fr', 'de', 'zh', 'ja', 'pt', 'hi'];

export const SEOHelper = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  useEffect(() => {
    // 1. Update <html lang="xx">
    document.documentElement.lang = currentLang;

    // 2. Set Dynamic Title & Meta Description based on Language
    // We target high volume keywords: "Wheel of Names", "Random Name Picker", "Spin the Wheel"
    const titles: Record<string, string> = {
      en: 'Random Name Picker - Spin the Wheel of Names Generator',
      id: 'Putar Roda - Acak Nama & Spin Wheel Generator',
      es: 'Ruleta Aleatoria - Generador de Nombres al Azar',
      fr: 'Roue Aléatoire - Générateur de Noms et Choix',
      de: 'Glücksrad - Zufälliger Namensgenerator',
      zh: '随机名字抽取 - 幸运转盘生成器',
      ja: 'ランダム名前ピッカー - ルーレットメーカー',
      pt: 'Roleta Aleatória - Gerador de Nomes e Escolhas',
      hi: 'रैंडम नाम पिकर - स्पिन द व्हील जेनरेटर'
    };
    
    document.title = titles[currentLang] || titles['en'];
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      // Basic dynamic injection
      metaDesc.setAttribute('content', `The fastest, ad-free random name picker for classroom and giveaways in ${currentLang.toUpperCase()}. Import names instantly. The ultimate random choice generator and wheel of names.`);
    }

    // 3. Inject Hreflang Tags for Super GEO
    // First, clear existing dynamic hreflang tags if any
    const existingTags = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingTags.forEach(tag => tag.remove());

    const origin = window.location.origin;

    LANGUAGES.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      // In a real multi-route Next.js app this would be /es, /fr etc.
      // Since it's an SPA, query params are safer for Google indexing SPA states
      link.href = `${origin}/?lng=${lang}`;
      document.head.appendChild(link);
    });

    // x-default hreflang
    const xDefault = document.createElement('link');
    xDefault.rel = 'alternate';
    xDefault.hreflang = 'x-default';
    xDefault.href = `${origin}/`;
    document.head.appendChild(xDefault);

  }, [currentLang]);

  return null; // This component does not render anything
};
