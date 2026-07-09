import { Metadata } from 'next';
import ClientSpinWheel from '../../src/ClientSpinWheel';

const LANGUAGES = ['en', 'id', 'es', 'fr', 'de', 'zh', 'ja', 'pt', 'hi'] as const;

export async function generateStaticParams() {
  return LANGUAGES.map((lang) => ({
    lang,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
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

  const title = titles[resolvedParams.lang] || titles.en;

  return {
    title,
    description: `The fastest, ad-free random name picker for classroom and giveaways in ${resolvedParams.lang.toUpperCase()}.`,
    alternates: {
      canonical: `https://randompickerwheel.com/${resolvedParams.lang}`,
      languages: Object.fromEntries(LANGUAGES.map(l => [l, `https://randompickerwheel.com/${l}`]))
    }
  };
}

export default async function LangPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  // In Next.js App Router, we can pass the language to the client or let i18next handle it via URL.
  // Since i18next-browser-languagedetector detects the path (if configured), it will work automatically.
  return <ClientSpinWheel />;
}
