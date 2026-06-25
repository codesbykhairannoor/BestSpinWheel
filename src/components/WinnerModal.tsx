import { useEffect } from 'react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { X, UserMinus, Trophy } from 'lucide-react';

interface WinnerModalProps {
  winners: string[];
  onClose: () => void;
  onRemoveWinner: () => void;
}

export const WinnerModal: FC<WinnerModalProps> = ({ winners, onClose, onRemoveWinner }) => {
  const { t } = useTranslation();

  useEffect(() => {
    // Fire confetti when mounted
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-end shrink-0 mb-2">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="text-center mb-6 shrink-0">
          <h3 className="text-2xl font-bold text-gray-500 dark:text-gray-400">{t('we_have_a_winner')}</h3>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 mb-8 custom-scrollbar px-2">
          <div className="flex flex-col gap-4">
            {winners.map((w, i) => (
              <div 
                key={i} 
                className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-600 animate-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}
              >
                <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-black text-lg ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-primary/10 text-primary'}`}>
                  {i === 0 ? <Trophy size={20} /> : `#${i + 1}`}
                </div>
                <p className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-gray-100 tracking-tight break-all">
                  {w}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <button 
            onClick={onRemoveWinner}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 font-semibold transition-colors"
          >
            <UserMinus size={18} />
            Remove Winner{winners.length > 1 ? 's' : ''}
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 font-semibold transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
