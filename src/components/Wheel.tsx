import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { playTick } from '../utils/audio';

export interface Entry {
  text: string;
  weight: number;
}

import type { SoundTheme } from '../utils/audio';

interface WheelProps {
  entries: Entry[];
  colors: string[];
  onSpinEnd: (winners: {entry: Entry, index: number}[]) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  soundEnabled: boolean;
  spinDuration: number;
  numWinners: number;
  soundTheme: SoundTheme;
}

export const Wheel: FC<WheelProps> = ({ 
  entries, colors, onSpinEnd, isSpinning, setIsSpinning, 
  soundEnabled, spinDuration, numWinners, soundTheme 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useTranslation();
  
  const [currentRotation, setCurrentRotation] = useState(0);

  // Wheel physics variables
  const spinVelocity = useRef(0);
  const rotation = useRef(0);
  const animationFrameId = useRef<number | null>(null);
  const lastHoveredSegment = useRef<number>(-1);
  
  // Calculate total weight for proportional drawing
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, width, height);

    if (entries.length === 0 || totalWeight === 0) {
      // Draw empty wheel
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#e5e7eb';
      ctx.fill();
      ctx.stroke();
      return;
    }

    let currentAngle = rotation.current;

    for (let i = 0; i < entries.length; i++) {
      const arcSize = (entries[i].weight / totalWeight) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + arcSize);
      ctx.closePath();

      // Add slight gradient for depth
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, colors[i % colors.length] + 'cc'); // slightly transparent inside
      gradient.addColorStop(1, colors[i % colors.length]);

      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Separator lines
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(currentAngle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      
      // Calculate font size dynamically based on slice arc and text length
      // Max height available at the outer edge is arcSize * radius. We use 0.85 for padding.
      const maxHeight = arcSize * radius * 0.85;
      
      // Max width available is radius - 60
      const maxWidth = radius - 60;
      
      // Rough estimation: each character takes about 0.55 of the font size in width
      const maxCharWidth = entries[i].text.length > 0 ? maxWidth / (entries[i].text.length * 0.55) : 60;
      
      const fontSize = Math.max(12, Math.min(64, Math.min(maxHeight, maxCharWidth)));
      
      ctx.font = `800 ${fontSize}px var(--font-sans, Inter, sans-serif)`;
      
      const text = entries[i].text;
      
      // Draw text with a safe offset from the edge and a max width to prevent spilling into the center
      ctx.fillText(text, radius - 35, 0, maxWidth);
      ctx.restore();
      
      currentAngle += arcSize;
    }

    // Draw premium glassmorphic center pin
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 45, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.shadowColor = 'transparent'; // Reset shadow
    
    // Inner metallic ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f4f4f5';
    ctx.stroke();

    // Draw premium pointer (Ticker)
    ctx.save();
    ctx.translate(centerX + radius + 5, centerY);
    // If we wanted the pointer to flick, we could use rotation % something, but static is fine for now
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-25, -15);
    ctx.lineTo(-25, 15);
    ctx.closePath();
    ctx.fillStyle = '#f43f5e'; // Rose-500 accent
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  };

  useEffect(() => {
    drawWheel();
  }, [entries, colors, currentRotation]);

  const getCryptoRandom = () => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  };

  const spin = () => {
    if (isSpinning || entries.length === 0 || totalWeight === 0) return;
    
    setIsSpinning(true);
    
    // True randomness using Crypto API
    // We want the wheel to spin for approximately `spinDuration` seconds.
    // Physics: v = u - at. Time to stop t = u/a.
    // If we fix t = spinDuration * 1000 (ms), we need to choose u and a such that t is met.
    // Instead of precise time, we'll pick an initial velocity and a deceleration factor.
    
    const randomFactor = getCryptoRandom();
    const baseVelocity = 0.4 + (randomFactor * 0.2); // 0.4 to 0.6 rad/frame
    spinVelocity.current = baseVelocity;
    
    // Deceleration = u / (time_in_frames)
    // Time in frames approx = spinDuration * 60 (assuming 60fps)
    const targetFrames = spinDuration * 60;
    const deceleration = baseVelocity / targetFrames;
    
    let lastTime = performance.now();
    lastHoveredSegment.current = -1;
    
    const animate = (time: number) => {
      const delta = time - lastTime;
      // Normalizing delta to 16.66ms (60fps)
      const frameDelta = delta / (1000 / 60); 
      lastTime = time;
      
      if (spinVelocity.current > 0) {
        rotation.current += spinVelocity.current * frameDelta;
        rotation.current %= 2 * Math.PI;
        
        spinVelocity.current -= deceleration * frameDelta;
        
        // Find which segment is currently at the pointer (0 radians relative to canvas)
        let normalizedRotation = (2 * Math.PI - (rotation.current % (2 * Math.PI))) % (2 * Math.PI);
        let accumulatedAngle = 0;
        let currentSegment = 0;
        
        for (let i = 0; i < entries.length; i++) {
          const arcSize = (entries[i].weight / totalWeight) * 2 * Math.PI;
          if (normalizedRotation >= accumulatedAngle && normalizedRotation < accumulatedAngle + arcSize) {
            currentSegment = i;
            break;
          }
          accumulatedAngle += arcSize;
        }
        
        if (currentSegment !== lastHoveredSegment.current) {
            if (lastHoveredSegment.current !== -1) {
                playTick(soundEnabled, soundTheme);
            }
            lastHoveredSegment.current = currentSegment;
        }

        if (spinVelocity.current <= 0) {
          spinVelocity.current = 0;
          setIsSpinning(false);
          
          let winnerIndex = currentSegment;
          const winners = [{ entry: entries[winnerIndex], index: winnerIndex }];
          
          // Pick additional random winners if numWinners > 1
          const availableIndices = Array.from({ length: entries.length }, (_, i) => i).filter(i => i !== winnerIndex);
          for (let i = 1; i < numWinners && availableIndices.length > 0; i++) {
            const randIdx = Math.floor(Math.random() * availableIndices.length);
            const selected = availableIndices.splice(randIdx, 1)[0];
            winners.push({ entry: entries[selected], index: selected });
          }
          
          onSpinEnd(winners);
          return;
        }
        
        setCurrentRotation(rotation.current);
        animationFrameId.current = requestAnimationFrame(animate);
      }
    };
    
    animationFrameId.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[600px] aspect-square mx-auto cursor-pointer" onClick={spin}>
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className="w-full h-full max-w-[600px] max-h-[600px] drop-shadow-2xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
        style={{
          filter: isSpinning ? 'blur(0.5px)' : 'none',
        }}
      />
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
         <span className="text-gray-800 font-bold text-2xl drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)] z-10">{t('spin')}</span>
      </div>
    </div>
  );
};
