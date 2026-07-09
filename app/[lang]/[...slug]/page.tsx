import { Metadata } from 'next';
import ClientSpinWheel from '../../../src/ClientSpinWheel';

const LANGUAGES = ['en', 'id', 'es', 'fr', 'de', 'zh', 'ja', 'pt', 'hi'] as const;

// Programmatic SEO Database Matrix
const PSEO_INTENTS = [
  'for-teachers',
  'for-giveaways',
  'for-events',
  'vs-wheel-of-names',
  'digital-raffle',
  'casino-jackpot',
  'truth-or-dare',
  'team-generator'
];

export async function generateStaticParams() {
  const params = [];
  for (const lang of LANGUAGES) {
    for (const intent of PSEO_INTENTS) {
      params.push({ lang, slug: [intent] });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string, slug: string[] }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const intent = resolvedParams.slug[0] || 'random';
  const formattedIntent = intent.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    title: `${formattedIntent} - Spin the Wheel | Best Random Picker`,
    description: `The ultimate ${formattedIntent.toLowerCase()} tool. Free, fast, and secure. Use this generator for your needs in ${resolvedParams.lang.toUpperCase()}.`,
    alternates: {
      canonical: `https://randompickerwheel.com/${resolvedParams.lang}/${intent}`
    }
  };
}

export default async function PSEOPage({ params }: { params: Promise<{ lang: string, slug: string[] }> }) {
  const resolvedParams = await params;
  return (
    <>
      <div className="order-last opacity-0 h-0 overflow-hidden pointer-events-none -z-50 text-[1px] leading-[1px]">
        {/* Dynamic Spintax-style injection for Googlebot */}
        <h1>{resolvedParams.slug.join(' ').replace(/-/g, ' ')} Random Picker</h1>
        <p>This is the dedicated page for {resolvedParams.slug.join(' ').replace(/-/g, ' ')} in language {resolvedParams.lang}. 
        Our platform provides realistic physics, massive 10k capacity, and a zero-latency experience.</p>
      </div>
      <ClientSpinWheel />
    </>
  );
}
