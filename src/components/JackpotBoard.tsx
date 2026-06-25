import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { playTick } from '../utils/audio';
import type { Entry } from './Wheel';
import type { SoundTheme } from '../utils/audio';

interface JackpotBoardProps {
  entries: Entry[];
  onSpinEnd: (winners: {entry: Entry, index: number}[]) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  soundEnabled: boolean;
  spinDuration: number;
  numWinners: number;
  soundTheme: SoundTheme;
}

export const JackpotBoard: FC<JackpotBoardProps> = ({
  entries,
  onSpinEnd,
  isSpinning,
  setIsSpinning,
  soundEnabled,
  spinDuration,
  numWinners,
  soundTheme
}) => {
  const { t } = useTranslation();
  

  const [lockedSlots, setLockedSlots] = useState<number[]>([]);
  const [currentDisplay, setCurrentDisplay] = useState<string[]>([]);
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'done'>('idle');
  const animationRef = useRef<number | null>(null);

  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);

  const getCryptoRandom = () => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  };

  useEffect(() => {
    if (isSpinning && phase === 'idle') {
      startJackpot();
    }
  }, [isSpinning, phase]);

  const startJackpot = () => {
    if (entries.length === 0 || totalWeight === 0) {
      setIsSpinning(false);
      return;
    }

    setPhase('spinning');
    setLockedSlots([]);


    const actualNumWinners = Math.min(numWinners, entries.length);
    setCurrentDisplay(Array(actualNumWinners).fill('READY...'));

    // Pick Winners
    const chosenWinners: {entry: Entry, index: number}[] = [];
    
    // Pick first winner
    let randomVal = getCryptoRandom() * totalWeight;
    let winnerIndex = 0;
    for (let i = 0; i < entries.length; i++) {
      randomVal -= entries[i].weight;
      if (randomVal <= 0) {
        winnerIndex = i;
        break;
      }
    }
    chosenWinners.push({ entry: entries[winnerIndex], index: winnerIndex });

    // Pick remaining random winners without replacement
    const availableIndices = Array.from({ length: entries.length }, (_, i) => i).filter(i => i !== winnerIndex);
    for (let i = 1; i < actualNumWinners && availableIndices.length > 0; i++) {
      const randIdx = Math.floor(getCryptoRandom() * availableIndices.length);
      const selected = availableIndices.splice(randIdx, 1)[0];
      chosenWinners.push({ entry: entries[selected], index: selected });
    }



    const durationMs = spinDuration * 1000;
    const startTime = performance.now();
    const lockInterval = durationMs / actualNumWinners; // Time between each slot locking
    
    const localLocked = new Set<number>();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      
      setCurrentDisplay(prev => {
        const next = [...prev];
        let madeTick = false;
        
        for (let i = 0; i < actualNumWinners; i++) {
          const isLockTime = elapsed > (i + 1) * lockInterval;
          if (isLockTime) {
            next[i] = chosenWinners[i].entry.text;
            if (!localLocked.has(i)) {
              localLocked.add(i);
              setLockedSlots(Array.from(localLocked));
              playTick(soundEnabled, soundTheme);
            }
          } else {
            // Rapidly change text
            if (Math.random() < 0.3) { // Control speed of flickering
              const randomEntry = entries[Math.floor(Math.random() * entries.length)];
              next[i] = randomEntry.text;
              madeTick = true;
            }
          }
        }
        
        if (madeTick && elapsed % 100 < 20) {
           // occasional tick sound during spinning
           playTick(soundEnabled, soundTheme);
        }
        return next;
      });

      if (elapsed < durationMs + 200) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setPhase('done');
        setTimeout(() => {
          setIsSpinning(false);
          onSpinEnd(chosenWinners);
          setPhase('idle');
        }, 1500);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  if (entries.length === 0) {
    return (
      <div className="w-full max-w-[800px] h-[400px] bg-zinc-200 dark:bg-zinc-800/50 rounded-3xl flex items-center justify-center shadow-inner border border-zinc-300 dark:border-zinc-700">
        <p className="text-zinc-500 font-medium">Add entries to play</p>
      </div>
    );
  }

  const actualNumWinners = Math.min(numWinners, entries.length);
  const slots = Array.from({ length: actualNumWinners }, (_, i) => i);

  return (
    <div 
      className="relative w-full max-w-[900px] min-h-[400px] flex flex-col items-center justify-center p-8 cursor-pointer overflow-hidden rounded-3xl bg-zinc-950 border-4 border-zinc-900 shadow-2xl"
      onClick={() => { if(!isSpinning) setIsSpinning(true); }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-900/20 pointer-events-none"></div>

      <div className="absolute top-6 text-center z-20">
        {phase === 'idle' && <h3 className="text-2xl font-black text-zinc-600 tracking-widest">{t('spin').toUpperCase()} (PRESS SPACE)</h3>}
        {phase === 'spinning' && <h3 className="text-2xl font-black text-emerald-500 animate-pulse tracking-widest">DRAWING WINNERS...</h3>}
        {phase === 'done' && <h3 className="text-3xl font-black text-emerald-400 tracking-widest drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">WINNERS FOUND!</h3>}
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-16 w-full z-10">
        {slots.map((slotIndex) => {
          const isLocked = lockedSlots.includes(slotIndex);
          const text = phase === 'idle' ? 'READY...' : currentDisplay[slotIndex];

          return (
            <div 
              key={slotIndex}
              className={`relative flex-grow-0 flex-shrink-0 w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1rem)] h-32 rounded-xl border-4 flex flex-col items-center justify-center transition-all duration-300 ${
                isLocked 
                  ? 'bg-emerald-500/10 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.4)] scale-105' 
                  : 'bg-zinc-900 border-zinc-800 shadow-inner'
              }`}
            >
              <span className={`absolute top-2 left-3 text-xs font-bold ${isLocked ? 'text-emerald-400' : 'text-zinc-600'}`}>
                WINNER {slotIndex + 1}
              </span>
              <span 
                className={`font-mono font-black text-center px-4 w-full break-words ${
                  isLocked 
                    ? 'text-white text-3xl drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-in zoom-in' 
                    : 'text-zinc-500 text-2xl blur-[1px]'
                }`}
                style={{ lineHeight: '1.1' }}
              >
                {text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
