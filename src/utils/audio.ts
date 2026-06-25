export const initAudio = () => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
};

let audioCtx: AudioContext | null = null;

export const playTick = (enabled: boolean = true) => {
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

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);

  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
};

export const playWinnerSound = (enabled: boolean = true) => {
  if (!enabled) return;
  if (!audioCtx) {
    audioCtx = initAudio();
  }
  if (!audioCtx) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // Play a happy chord
  const frequencies = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
  
  frequencies.forEach((freq, i) => {
    const osc = audioCtx!.createOscillator();
    const gainNode = audioCtx!.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx!.currentTime + (i * 0.1));
    
    gainNode.gain.setValueAtTime(0, audioCtx!.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioCtx!.currentTime + (i * 0.1) + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx!.currentTime + (i * 0.1) + 1);

    osc.connect(gainNode);
    gainNode.connect(audioCtx!.destination);

    osc.start(audioCtx!.currentTime + (i * 0.1));
    osc.stop(audioCtx!.currentTime + (i * 0.1) + 1);
  });
};
