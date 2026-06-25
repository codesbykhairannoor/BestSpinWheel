import { useEffect, useState, useRef } from 'react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { playTick } from '../utils/audio';
import type { Entry } from './Wheel';

interface FastScrollerProps {
  entries: Entry[];
  onSpinEnd: (winner: Entry, winnerIndex: number) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  soundEnabled: boolean;
  spinDuration: number;
}

export const FastScroller: FC<FastScrollerProps> = ({ 
  entries, 
  onSpinEnd, 
  isSpinning, 
  setIsSpinning, 
  soundEnabled, 
  spinDuration 
}) => {
  const { t } = useTranslation();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [winnerData, setWinnerData] = useState<{entry: Entry, index: number} | null>(null);
  const [revealed, setRevealed] = useState(false);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);

  const getCryptoRandom = () => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  };

  useEffect(() => {
    if (isSpinning) {
      startRaffle();
    }
  }, [isSpinning]);

  const startRaffle = () => {
    if (entries.length === 0 || totalWeight === 0) {
      setIsSpinning(false);
      return;
    }

    setRevealed(false);
    setWinnerData(null);

    // Determine absolute winner
    let randomVal = getCryptoRandom() * totalWeight;
    let winnerIndex = 0;
    for (let i = 0; i < entries.length; i++) {
      randomVal -= entries[i].weight;
      if (randomVal <= 0) {
        winnerIndex = i;
        break;
      }
    }

    const durationMs = spinDuration * 1000;
    const startTime = performance.now();
    
    // Non-linear tick interval for dramatic slow-down
    const tick = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      
      if (progress < 1) {
        // Randomly pick an index to flash
        setCurrentIndex(Math.floor(Math.random() * entries.length));
        playTick(soundEnabled);
        
        // Interval slows down as progress reaches 1
        // Ease-out cubic formula
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const nextTickMs = 20 + (easeOut * 300); 
        
        spinTimeoutRef.current = setTimeout(tick, nextTickMs);
      } else {
        // End
        setCurrentIndex(winnerIndex);
        setWinnerData({ entry: entries[winnerIndex], index: winnerIndex });
        setRevealed(true);
        playTick(soundEnabled);
        
        setTimeout(() => {
          setIsSpinning(false);
          onSpinEnd(entries[winnerIndex], winnerIndex);
        }, 1500);
      }
    };
    
    tick();
  };

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    };
  }, []);

  if (entries.length === 0) {
    return (
      <div className="w-full max-w-[800px] h-[400px] bg-zinc-200 dark:bg-zinc-800/50 rounded-3xl flex items-center justify-center shadow-inner border border-zinc-300 dark:border-zinc-700">
        <p className="text-zinc-500 font-medium">Add entries to play</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[800px] h-[400px] flex flex-col items-center justify-center perspective-1000">
      
      {/* Title / Instruction */}
      <div className="absolute top-4 text-center z-20">
        {!isSpinning && !revealed && <h3 className="text-2xl font-bold text-zinc-400 dark:text-zinc-500">{t('spin')} (Press Space)</h3>}
        {isSpinning && !revealed && <h3 className="text-2xl font-bold text-emerald-500 animate-pulse">Calculating Winner...</h3>}
        {revealed && <h3 className="text-3xl font-extrabold text-emerald-400">Winner Found!</h3>}
      </div>

      {/* The Matrix Display Area */}
      <div 
        className="w-full max-w-[600px] h-[200px] bg-zinc-950 rounded-xl shadow-[0_0_40px_rgba(16,185,129,0.2)] border-2 border-zinc-800 flex items-center justify-center overflow-hidden relative cursor-pointer group"
        onClick={() => { if(!isSpinning) setIsSpinning(true); }}
      >
        {/* Scanline effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 pointer-events-none opacity-50"></div>
        
        {/* Glow */}
        <div className="absolute inset-0 bg-emerald-500/5 mix-blend-screen pointer-events-none"></div>

        <div className="relative z-20 text-center px-4 w-full">
          <span 
            className={`font-mono font-black break-words transition-all duration-75 text-center block w-full
              ${revealed ? 'text-emerald-400 text-5xl md:text-6xl drop-shadow-[0_0_15px_rgba(16,185,129,0.8)] scale-110' : 'text-zinc-300 text-4xl md:text-5xl blur-[0.5px]'}
              ${isSpinning && !revealed ? 'text-emerald-200/80 scale-105' : ''}
            `}
          >
            {winnerData ? winnerData.entry.text : entries[currentIndex]?.text || '???'}
          </span>
        </div>
      </div>
      
    </div>
  );
};
