import { useEffect } from 'react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { X, UserMinus } from 'lucide-react';

interface WinnerModalProps {
  winner: string;
  onClose: () => void;
  onRemoveWinner: () => void;
}

export const WinnerModal: FC<WinnerModalProps> = ({ winner, onClose, onRemoveWinner }) => {
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
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-700">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="text-center mt-2 mb-8">
          <h3 className="text-2xl font-bold text-gray-500 dark:text-gray-400 mb-4">{t('we_have_a_winner')}</h3>
          <p className="text-5xl font-black text-primary dark:text-primary-dark tracking-tight break-words">
            {winner}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={onRemoveWinner}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 font-semibold transition-colors"
          >
            <UserMinus size={18} />
            {t('remove_winner')}
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
