import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX, Monitor } from 'lucide-react';
import type { SoundTheme } from '../utils/audio';

interface SettingsProps {
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  spinDuration: number;
  setSpinDuration: (v: number) => void;
  numWinners: number;
  setNumWinners: (v: number) => void;
  soundTheme: SoundTheme;
  setSoundTheme: (v: SoundTheme) => void;
}

export const Settings: FC<SettingsProps> = ({ 
  soundEnabled, setSoundEnabled, 
  spinDuration, setSpinDuration,
  numWinners, setNumWinners,
  soundTheme, setSoundTheme
}) => {
  const { t } = useTranslation();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">{t('settings')}</h2>
      </div>
      
      <div className="flex-1 p-6 space-y-8 overflow-y-auto">
        
        {/* Number of Winners */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-200">Number of Winners</h3>
            <span className="text-primary font-bold">{numWinners}</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">How many names to pick at once.</p>
          <input 
            type="range" 
            min="1" max="5" 
            value={numWinners}
            onChange={(e) => setNumWinners(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary"
          />
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-700 w-full"></div>

        {/* Spin Duration */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-200">Spin Duration</h3>
            <span className="text-primary font-bold">{spinDuration}s</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">How long the wheel spins before stopping.</p>
          <input 
            type="range" 
            min="1" max="30" 
            value={spinDuration}
            onChange={(e) => setSpinDuration(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary"
          />
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-700 w-full"></div>

        {/* Sound Toggle */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200">Sound Effects</h3>
              <p className="text-sm text-gray-500">Play sounds while spinning</p>
            </div>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3 rounded-full transition-colors ${soundEnabled ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}
            >
              {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>
          </div>

          {soundEnabled && (
            <div className="flex gap-2">
              <button 
                onClick={() => setSoundTheme('classic')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${soundTheme === 'classic' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
              >
                Classic
              </button>
              <button 
                onClick={() => setSoundTheme('arcade')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${soundTheme === 'arcade' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
              >
                Arcade
              </button>
              <button 
                onClick={() => setSoundTheme('casino')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${soundTheme === 'casino' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
              >
                Casino
              </button>
            </div>
          )}
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-700 w-full"></div>

        {/* Fullscreen Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-200">Fullscreen</h3>
            <p className="text-sm text-gray-500">Present mode</p>
          </div>
          <button 
            onClick={toggleFullscreen}
            className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Monitor size={24} />
          </button>
        </div>
        
      </div>
    </div>
  );
};
