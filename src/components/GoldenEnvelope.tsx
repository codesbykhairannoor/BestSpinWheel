import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { playTick } from '../utils/audio';
import type { Entry } from './Wheel';

import type { SoundTheme } from '../utils/audio';

interface GoldenEnvelopeProps {
  entries: Entry[];
  onSpinEnd: (winners: {entry: Entry, index: number}[]) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  soundEnabled: boolean;
  spinDuration: number;
  numWinners: number;
  soundTheme: SoundTheme;
}

type Phase = 'idle' | 'opening' | 'revealed';

export const GoldenEnvelope: FC<GoldenEnvelopeProps> = ({ 
  entries, 
  onSpinEnd, 
  isSpinning, 
  setIsSpinning, 
  soundEnabled, 
  spinDuration, // We use this as the opening delay
  numWinners,
  soundTheme
}) => {
  const { t } = useTranslation();
  
  const [phase, setPhase] = useState<Phase>('idle');
  const [winnerData, setWinnerData] = useState<{entry: Entry, index: number}[] | null>(null);
  
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);

  const getCryptoRandom = () => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  };

  useEffect(() => {
    if (isSpinning && phase === 'idle') {
      startReveal();
    }
  }, [isSpinning, phase]);

  const startReveal = () => {
    if (entries.length === 0 || totalWeight === 0) {
      setIsSpinning(false);
      return;
    }

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
    const winners = [{ entry: entries[winnerIndex], index: winnerIndex }];
    
    const availableIndices = Array.from({ length: entries.length }, (_, i) => i).filter(i => i !== winnerIndex);
    for (let i = 1; i < numWinners && availableIndices.length > 0; i++) {
      const randIdx = Math.floor(Math.random() * availableIndices.length);
      const selected = availableIndices.splice(randIdx, 1)[0];
      winners.push({ entry: entries[selected], index: selected });
    }
    
    setWinnerData(winners);

    // Transition to opening phase immediately
    setPhase('opening');
    playTick(soundEnabled, soundTheme); // Play an initial sound
    
    // Wait for the duration of the tension
    setTimeout(() => {
      setPhase('revealed');
      playTick(soundEnabled, soundTheme);
      
      // End the spin shortly after revealing
      setTimeout(() => {
        setIsSpinning(false);
        onSpinEnd(winners);
        setTimeout(() => setPhase('idle'), 500); // reset
      }, 1500);
      
    }, Math.min(spinDuration * 1000, 3000)); // cap at 3 seconds for envelope
  };

  if (entries.length === 0) {
    return (
      <div className="w-full max-w-[800px] h-[400px] bg-zinc-200 dark:bg-zinc-800/50 rounded-3xl flex items-center justify-center shadow-inner border border-zinc-300 dark:border-zinc-700">
        <p className="text-zinc-500 font-medium">Add entries to play</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[800px] h-[500px] flex flex-col items-center justify-center perspective-1000">
      
      {/* Title / Instruction */}
      <div className="absolute top-4 text-center z-20">
        {phase === 'idle' && <h3 className="text-2xl font-bold text-zinc-400 dark:text-zinc-500">{t('spin')} (Press Space)</h3>}
        {phase === 'opening' && <h3 className="text-2xl font-bold text-amber-500 animate-pulse">And the winner is...</h3>}
        {phase === 'revealed' && <h3 className="text-3xl font-extrabold text-amber-400">Congratulations!</h3>}
      </div>

      {/* The Envelope Area */}
      <div className="relative mt-20 w-[300px] h-[200px] flex justify-center items-end" onClick={() => { if(phase === 'idle') setIsSpinning(true); }}>
        
        {/* Back of Envelope */}
        <div className="absolute inset-0 bg-amber-600 rounded-b-xl shadow-inner border-x border-b border-amber-700"></div>

        {/* The Paper (Slides Up) */}
        <div 
          className="absolute bottom-0 w-[280px] bg-[#fdfbf7] rounded-t-sm shadow-md border border-zinc-200 flex items-center justify-center p-6 text-center"
          style={{
            height: '240px',
            transition: 'transform 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: phase === 'revealed' ? 'translateY(-160px)' : 'translateY(0)',
            zIndex: 10
          }}
        >
          <div className="w-full h-full border-4 border-double border-zinc-300 flex flex-col items-center justify-center p-2">
            <span className="text-xs uppercase tracking-widest text-zinc-400 mb-2 font-serif">Winner{winnerData && winnerData.length > 1 ? 's' : ''}</span>
            <div className="flex flex-col gap-1 overflow-hidden h-[130px] justify-center w-full">
              {phase !== 'idle' && winnerData ? (
                winnerData.map((w, i) => (
                  <span key={i} className="font-serif italic font-black text-zinc-900 leading-tight truncate px-2" style={{ fontSize: numWinners === 1 ? '1.875rem' : numWinners <= 3 ? '1.25rem' : '1rem' }}>
                    {w.entry.text}
                  </span>
                ))
              ) : (
                <span className="font-serif italic font-black text-3xl text-zinc-900 leading-tight">???</span>
              )}
            </div>
          </div>
        </div>

        {/* Envelope Top Flap (Opens Up) */}
        <div 
          className="absolute top-0 w-0 h-0 border-l-[150px] border-l-transparent border-r-[150px] border-r-transparent border-t-[100px] border-t-amber-400 drop-shadow-md origin-top"
          style={{
            transition: 'transform 0.8s ease-in-out',
            transform: phase !== 'idle' ? 'rotateX(180deg)' : 'rotateX(0deg)',
            zIndex: phase === 'idle' ? 20 : 5 // drops behind paper when open
          }}
        ></div>

        {/* Envelope Left/Right/Bottom Flaps (Front Cover) */}
        <div className="absolute inset-0 overflow-hidden rounded-b-xl z-15 pointer-events-none">
           {/* Left Flap */}
           <div className="absolute top-0 left-0 w-0 h-0 border-l-[150px] border-l-amber-500 border-t-[100px] border-t-transparent border-b-[100px] border-b-transparent"></div>
           {/* Right Flap */}
           <div className="absolute top-0 right-0 w-0 h-0 border-r-[150px] border-r-amber-500 border-t-[100px] border-t-transparent border-b-[100px] border-b-transparent"></div>
           {/* Bottom Flap */}
           <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[150px] border-l-transparent border-r-[150px] border-r-transparent border-b-[100px] border-b-amber-400 drop-shadow-[0_-4px_4px_rgba(0,0,0,0.1)]"></div>
        </div>

        {/* Wax Seal */}
        <div 
          className="absolute top-[80px] left-1/2 -ml-6 w-12 h-12 bg-red-700 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] border-2 border-red-800 flex items-center justify-center z-30"
          style={{
            transition: 'opacity 0.3s ease-in-out',
            opacity: phase === 'idle' ? 1 : 0
          }}
        >
          <span className="text-red-900 font-serif font-black text-xl">W</span>
        </div>
        
      </div>
      
      {phase === 'idle' && !isSpinning && (
        <div 
          className="absolute inset-0 z-40 cursor-pointer" 
          onClick={() => setIsSpinning(true)}
        ></div>
      )}
    </div>
  );
};
