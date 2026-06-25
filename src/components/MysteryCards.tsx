import { useEffect, useState, useRef } from 'react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { playTick } from '../utils/audio';
import type { Entry } from './Wheel';

interface MysteryCardsProps {
  entries: Entry[];
  onSpinEnd: (winner: Entry, winnerIndex: number) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  soundEnabled: boolean;
  spinDuration: number;
}

type Phase = 'idle' | 'shuffling' | 'picking' | 'revealed';

export const MysteryCards: FC<MysteryCardsProps> = ({ 
  entries, 
  onSpinEnd, 
  isSpinning, 
  setIsSpinning, 
  soundEnabled, 
  spinDuration 
}) => {
  const { t } = useTranslation();
  
  const numCards = Math.max(1, Math.min(entries.length, 5));
  const [phase, setPhase] = useState<Phase>('idle');
  const [cards, setCards] = useState<number[]>([]); 
  const [winnerData, setWinnerData] = useState<{entry: Entry, index: number} | null>(null);
  const [pickedCard, setPickedCard] = useState<number | null>(null);
  const [fakeNames, setFakeNames] = useState<string[]>([]);
  
  const shuffleInterval = useRef<number | null>(null);
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);

  // Initialize cards array when entries change or on mount
  useEffect(() => {
    if (phase === 'idle') {
      setCards(Array.from({length: numCards}, (_, i) => i));
    }
  }, [entries.length, numCards, phase]);

  const getCryptoRandom = () => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  };

  useEffect(() => {
    if (isSpinning && phase === 'idle') {
      startShuffle();
    }
  }, [isSpinning, phase]);

  const startShuffle = () => {
    if (entries.length === 0 || totalWeight === 0) {
      setIsSpinning(false);
      return;
    }

    setPhase('shuffling');
    setPickedCard(null);

    // 1. Determine absolute winner
    let randomVal = getCryptoRandom() * totalWeight;
    let winnerIndex = 0;
    for (let i = 0; i < entries.length; i++) {
      randomVal -= entries[i].weight;
      if (randomVal <= 0) {
        winnerIndex = i;
        break;
      }
    }
    setWinnerData({ entry: entries[winnerIndex], index: winnerIndex });

    // 2. Pick fake names for other cards
    const others = entries.filter((_, idx) => idx !== winnerIndex);
    const fakes: string[] = [];
    const numFakesNeeded = numCards - 1;
    
    for (let i = 0; i < numFakesNeeded; i++) {
      if (others.length > 0) {
        const r = Math.floor(Math.random() * others.length);
        fakes.push(others[r].text);
        others.splice(r, 1);
      } else {
        fakes.push(entries[Math.floor(Math.random() * entries.length)].text);
      }
    }
    setFakeNames(fakes);

    // 3. Shuffle animation
    let elapsed = 0;
    const intervalTime = 150; 
    
    shuffleInterval.current = window.setInterval(() => {
      setCards(prev => {
        if (prev.length <= 1) return prev;
        const newCards = [...prev];
        const i = Math.floor(Math.random() * prev.length);
        let j = Math.floor(Math.random() * prev.length);
        while(j === i) j = Math.floor(Math.random() * prev.length);
        [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
        return newCards;
      });
      playTick(soundEnabled);
      elapsed += intervalTime;
      
      if (elapsed >= spinDuration * 1000) {
        if (shuffleInterval.current) clearInterval(shuffleInterval.current);
        setPhase('picking');
      }
    }, intervalTime);
  };

  const handleCardPick = (cardId: number) => {
    if (phase !== 'picking' || !winnerData) return;
    
    setPhase('revealed');
    setPickedCard(cardId);
    
    setTimeout(() => {
      setIsSpinning(false);
      onSpinEnd(winnerData.entry, winnerData.index);
      setTimeout(() => setPhase('idle'), 500);
    }, 1500);
  };

  if (entries.length === 0) {
    return (
      <div className="w-full max-w-[800px] h-[400px] bg-zinc-200 dark:bg-zinc-800/50 rounded-3xl flex items-center justify-center shadow-inner border border-zinc-300 dark:border-zinc-700">
        <p className="text-zinc-500 font-medium">Add entries to play</p>
      </div>
    );
  }

  // Calculate layout logic based on number of cards
  // We center them horizontally. Width of card = 140px, gap = 20px
  const cardWidth = numCards > 3 ? 140 : 180;
  const cardHeight = numCards > 3 ? 200 : 260;
  const gap = 20;
  const totalWidth = (cardWidth * numCards) + (gap * (numCards - 1));
  const startX = -(totalWidth / 2) + (cardWidth / 2);

  return (
    <div className="relative w-full max-w-[900px] h-[500px] flex flex-col items-center justify-center perspective-1000">
      
      {/* Title / Instruction */}
      <div className="absolute top-4 text-center z-20">
        {phase === 'idle' && <h3 className="text-2xl font-bold text-zinc-400 dark:text-zinc-500">{t('spin')} (Press Space)</h3>}
        {phase === 'shuffling' && <h3 className="text-2xl font-bold text-accent animate-pulse">Shuffling...</h3>}
        {phase === 'picking' && <h3 className="text-3xl font-extrabold text-amber-500 animate-bounce">Pick Your Fate!</h3>}
        {phase === 'revealed' && <h3 className="text-3xl font-extrabold text-green-500">Winner Revealed!</h3>}
      </div>

      {/* The Cards Area */}
      <div className="relative w-full h-[300px] flex justify-center items-center mt-12">
        {Array.from({length: numCards}, (_, i) => i).map((cardId) => {
          const posIndex = cards.indexOf(cardId);
          const translateX = startX + (posIndex * (cardWidth + gap));
          
          const isRevealed = phase === 'revealed';
          const isPicked = pickedCard === cardId;
          
          let cardText = '';
          if (isRevealed && winnerData) {
            if (isPicked) {
              cardText = winnerData.entry.text;
            } else {
              const otherCardIds = Array.from({length: numCards}, (_, i) => i).filter(id => id !== pickedCard);
              const fakeIndex = otherCardIds.indexOf(cardId);
              cardText = fakeNames[fakeIndex] || 'Zonk';
            }
          }

          return (
            <div 
              key={cardId}
              onClick={() => handleCardPick(cardId)}
              className={`absolute top-1/2 left-1/2 transition-all duration-300 ease-in-out cursor-pointer group`}
              style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                marginLeft: `-${cardWidth/2}px`,
                marginTop: `-${cardHeight/2}px`,
                transform: `translateX(${translateX}px) ${isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)'} ${isPicked ? 'scale(1.1) translateY(-20px)' : (isRevealed && !isPicked ? 'scale(0.9) opacity-50' : 'scale(1)')}`,
                zIndex: isPicked ? 50 : 10,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Back of Card */}
              <div 
                className="absolute inset-0 w-full h-full rounded-2xl border-4 border-zinc-200 dark:border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center shadow-xl backface-hidden"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
              >
                <div className={`w-[80%] h-[85%] border-2 border-dashed border-zinc-500/30 rounded-xl flex items-center justify-center bg-zinc-900/50`}>
                   <span className={`${numCards > 3 ? 'text-4xl' : 'text-6xl'} font-black text-zinc-700/50`}>?</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 rounded-xl pointer-events-none"></div>
              </div>

              {/* Front of Card */}
              <div 
                className={`absolute inset-0 w-full h-full rounded-2xl border-4 flex flex-col items-center justify-center p-4 shadow-2xl backface-hidden ${isPicked ? 'bg-gradient-to-br from-amber-200 to-amber-500 border-white' : 'bg-zinc-100 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-600'}`}
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                 <div className="w-full h-full border-2 border-white/30 rounded-xl flex items-center justify-center p-2 text-center break-words bg-white/20 backdrop-blur-sm shadow-inner">
                    <span className={`font-black tracking-tight leading-tight ${cardText.length > 15 ? 'text-lg' : 'text-2xl'} ${isPicked ? 'text-zinc-950' : 'text-zinc-600 dark:text-zinc-300'}`}>
                      {cardText}
                    </span>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {phase === 'idle' && !isSpinning && (
        <div 
          className="absolute inset-0 z-30 cursor-pointer" 
          onClick={() => setIsSpinning(true)}
        ></div>
      )}
    </div>
  );
};
