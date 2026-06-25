export const initAudio = () => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
};

let audioCtx: AudioContext | null = null;

export type SoundTheme = 'classic' | 'arcade' | 'casino';

export const playTick = (enabled: boolean = true, theme: SoundTheme = 'classic') => {
  if (!enabled) return;
  if (!audioCtx) {
    audioCtx = initAudio();
  }
  if (!audioCtx) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  if (theme === 'classic') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } else if (theme === 'arcade') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.02);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } else if (theme === 'casino') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.08);
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  }
};

export const playWinnerSound = (enabled: boolean = true, theme: SoundTheme = 'classic') => {
  if (!enabled) return;
  if (!audioCtx) {
    audioCtx = initAudio();
  }
  if (!audioCtx) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  let frequencies: number[] = [];
  let type: OscillatorType = 'triangle';
  let duration = 1;
  let stagger = 0.1;

  if (theme === 'classic') {
    frequencies = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    type = 'triangle';
  } else if (theme === 'arcade') {
    frequencies = [523.25, 659.25, 783.99, 1046.50, 1567.98]; // C5, E5, G5, C6, G6
    type = 'square';
    duration = 0.5;
    stagger = 0.08;
  } else if (theme === 'casino') {
    frequencies = [880, 880, 1108.73, 1318.51, 1760]; // A5, A5, C#6, E6, A6
    type = 'sine';
    duration = 1.5;
    stagger = 0.15;
  }

  frequencies.forEach((freq, i) => {
    const osc = audioCtx!.createOscillator();
    const gainNode = audioCtx!.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx!.currentTime + (i * stagger));
    
    gainNode.gain.setValueAtTime(0, audioCtx!.currentTime);
    gainNode.gain.linearRampToValueAtTime(theme === 'arcade' ? 0.05 : 0.2, audioCtx!.currentTime + (i * stagger) + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx!.currentTime + (i * stagger) + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx!.destination);

    osc.start(audioCtx!.currentTime + (i * stagger));
    osc.stop(audioCtx!.currentTime + (i * stagger) + duration);
  });
};
