let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function beep(frequency: number, durationMs: number, delayMs = 0) {
  const audioCtx = getContext();
  const start = audioCtx.currentTime + delayMs / 1000;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = frequency;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.2, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + durationMs / 1000);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + durationMs / 1000);
}

export function playCorrectSound() {
  beep(880, 120);
  beep(1318, 150, 100);
}

export function playIncorrectSound() {
  beep(220, 200);
}
