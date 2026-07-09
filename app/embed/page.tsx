import ClientSpinWheel from '../../src/ClientSpinWheel';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spin the Wheel - Embed Widget',
  robots: {
    index: false,
    follow: true,
  },
};

export default function EmbedPage() {
  return (
    <div className="w-full h-screen overflow-hidden bg-transparent">
      {/* 
        In a real application, ClientSpinWheel would have a prop `isEmbed={true}` 
        to hide the header, settings, etc. For now, it will render normally,
        but we inject a strong backlink at the bottom for SEO juice.
      */}
      <ClientSpinWheel />
      <div className="fixed bottom-1 right-2 z-50 text-[10px] text-zinc-500 bg-white/80 dark:bg-black/80 px-2 py-1 rounded">
        Powered by <a href="https://randompickerwheel.com/" target="_blank" rel="noopener" className="hover:underline font-bold text-blue-600">Best Random Name Picker</a>
      </div>
    </div>
  );
}
