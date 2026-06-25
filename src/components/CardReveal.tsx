import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { playTick } from '../utils/audio';
import type { Entry } from './Wheel';
import type { SoundTheme } from '../utils/audio';

interface CardRevealProps {
  entries: Entry[];
  onSpinEnd: (winners: {entry: Entry, index: number}[]) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  soundEnabled: boolean;
  spinDuration: number;
  numWinners: number;
  soundTheme: SoundTheme;
}

export const CardReveal: FC<CardRevealProps> = ({
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
  
  const [winners, setWinners] = useState<{entry: Entry, index: number}[] | null>(null);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [phase, setPhase] = useState<'idle' | 'shuffling' | 'revealing' | 'done'>('idle');

  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);

  const getCryptoRandom = () => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  };

  useEffect(() => {
    if (isSpinning && phase === 'idle') {
      startCardReveal();
    }
  }, [isSpinning, phase]);

  const startCardReveal = () => {
    if (entries.length === 0 || totalWeight === 0) {
      setIsSpinning(false);
      return;
    }

    setPhase('shuffling');
    setFlippedCards([]);
    setWinners(null);

    // Pick Winners
    const chosenWinners: {entry: Entry, index: number}[] = [];
    
    // Pick first winner using weights
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
    for (let i = 1; i < numWinners && availableIndices.length > 0; i++) {
      const randIdx = Math.floor(getCryptoRandom() * availableIndices.length);
      const selected = availableIndices.splice(randIdx, 1)[0];
      chosenWinners.push({ entry: entries[selected], index: selected });
    }

    setWinners(chosenWinners);

    // Shuffle phase simulation
    let shuffles = 0;
    const shuffleInterval = setInterval(() => {
      playTick(soundEnabled, soundTheme);
      shuffles++;
      if (shuffles > 15) {
        clearInterval(shuffleInterval);
        setPhase('revealing');
      }
    }, (spinDuration * 1000) / 15);
  };

  // Revealing Phase
  useEffect(() => {
    if (phase === 'revealing' && winners) {
      let currentFlipped = 0;
      const revealInterval = setInterval(() => {
        setFlippedCards(prev => [...prev, currentFlipped]);
        playTick(soundEnabled, soundTheme);
        currentFlipped++;
        
        if (currentFlipped >= winners.length) {
          clearInterval(revealInterval);
          setPhase('done');
          setTimeout(() => {
            setIsSpinning(false);
            onSpinEnd(winners);
            setPhase('idle');
          }, 1500);
        }
      }, 800); // 800ms between each card flip
      
      return () => clearInterval(revealInterval);
    }
  }, [phase, winners]);

  if (entries.length === 0) {
    return (
      <div className="w-full max-w-[800px] h-[400px] bg-zinc-200 dark:bg-zinc-800/50 rounded-3xl flex items-center justify-center shadow-inner border border-zinc-300 dark:border-zinc-700">
        <p className="text-zinc-500 font-medium">Add entries to play</p>
      </div>
    );
  }

  // Create placeholders for the cards
  const cardCount = Math.min(numWinners, entries.length);
  const cards = Array.from({ length: cardCount }, (_, i) => i);

  return (
    <div 
      className="relative w-full max-w-[800px] min-h-[400px] flex flex-col items-center justify-center p-8 cursor-pointer"
      onClick={() => { if(!isSpinning) setIsSpinning(true); }}
    >
      <div className="absolute top-4 text-center z-20">
        {phase === 'idle' && <h3 className="text-2xl font-bold text-zinc-400 dark:text-zinc-500">{t('spin')} (Press Space)</h3>}
        {phase === 'shuffling' && <h3 className="text-2xl font-bold text-amber-500 animate-pulse">Shuffling Cards...</h3>}
        {phase === 'revealing' && <h3 className="text-2xl font-bold text-emerald-400">Revealing Winners...</h3>}
      </div>

      <div className="flex flex-wrap justify-center gap-6 mt-12 w-full perspective-1000">
        {cards.map((cardIndex) => {
          const isFlipped = flippedCards.includes(cardIndex);
          const winnerData = winners ? winners[cardIndex] : null;

          return (
            <div 
              key={cardIndex}
              className={`relative w-48 h-64 transition-all duration-700 preserve-3d ${
                isFlipped ? 'rotate-y-180 scale-105' : ''
              } ${phase === 'shuffling' ? 'animate-bounce' : ''}`}
              style={{
                animationDelay: phase === 'shuffling' ? `${cardIndex * 0.1}s` : '0s'
              }}
            >
              {/* Back of Card */}
              <div className="absolute inset-0 backface-hidden w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl border-4 border-white/20 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
                  <span className="text-3xl font-black text-white/50">?</span>
                </div>
                <div className="mt-4 opacity-50 text-white font-bold tracking-widest text-sm">SPIN WHEEL</div>
              </div>

              {/* Front of Card */}
              <div className="absolute inset-0 backface-hidden w-full h-full bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] border-4 border-emerald-500 flex flex-col items-center justify-center rotate-y-180 p-4 text-center">
                <span className="text-emerald-500 font-bold mb-2">WINNER #{cardIndex + 1}</span>
                <span className="text-2xl font-black text-zinc-800 dark:text-white break-words w-full">
                  {winnerData?.entry.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
