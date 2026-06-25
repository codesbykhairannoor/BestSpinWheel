import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

interface ResultsProps {
  winners: string[];
  clearWinners: () => void;
}

export const Results: FC<ResultsProps> = ({ winners, clearWinners }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">{t('results')} ({winners.length})</h2>
        <div className="flex space-x-2">
          <button onClick={clearWinners} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title={t('clear')}>
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {winners.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-10">No winners yet!</p>
        ) : (
          winners.map((winner, idx) => (
            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl font-bold text-lg border border-gray-100 dark:border-gray-600 flex items-center justify-between">
              <span>{winner}</span>
              <span className="text-sm font-medium text-gray-400">#{winners.length - idx}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
