export type ClickVariant = "click" | "correct" | "incorrect";

export interface ClickPreset {
  id: string;
  label: string;
  play: (ctx: AudioContext, variant: ClickVariant, destination: AudioNode) => void;
}

let noiseBufferCache: AudioBuffer | null = null;

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBufferCache && noiseBufferCache.sampleRate === ctx.sampleRate) return noiseBufferCache;
  const length = Math.floor(ctx.sampleRate * 0.5);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  noiseBufferCache = buffer;
  return buffer;
}

/**
 * Holds at full gain for a short moment before decaying, instead of decaying from the
 * instant it starts. A pure instant-decay envelope buries most of its energy in the
 * first few milliseconds, so it reads as quiet no matter how high the peak gain is —
 * the hold is what actually raises perceived loudness (along with total duration).
 */
function applyEnvelope(gainNode: GainNode, start: number, duration: number, gain: number) {
  const holdEnd = start + Math.min(0.03, duration * 0.3);
  gainNode.gain.setValueAtTime(gain, start);
  gainNode.gain.setValueAtTime(gain, holdEnd);
  gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
}

interface NoiseClickOptions {
  filterType?: BiquadFilterType;
  frequency?: number;
  q?: number;
  duration?: number;
  gain?: number;
  delay?: number;
}

function playNoiseClick(
  ctx: AudioContext,
  destination: AudioNode,
  { filterType = "bandpass", frequency = 1200, q = 1, duration = 0.05, gain = 0.5, delay = 0 }: NoiseClickOptions
) {
  const start = ctx.currentTime + delay;
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const gainNode = ctx.createGain();
  applyEnvelope(gainNode, start, duration, gain);
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(destination);
  source.start(start);
  source.stop(start + duration + 0.02);
}

interface ToneClickOptions {
  frequency?: number;
  type?: OscillatorType;
  duration?: number;
  gain?: number;
  delay?: number;
}

function playToneClick(
  ctx: AudioContext,
  destination: AudioNode,
  { frequency = 400, type = "triangle", duration = 0.06, gain = 0.35, delay = 0 }: ToneClickOptions
) {
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.72, start + duration);
  const gainNode = ctx.createGain();
  applyEnvelope(gainNode, start, duration, gain);
  osc.connect(gainNode);
  gainNode.connect(destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

interface SweepClickOptions {
  startFrequency?: number;
  endFrequency?: number;
  type?: OscillatorType;
  duration?: number;
  gain?: number;
  delay?: number;
}

/** Rising/falling pitch glide — the classic playful "boing" shape. */
function playSweepClick(
  ctx: AudioContext,
  destination: AudioNode,
  { startFrequency = 300, endFrequency = 900, type = "sine", duration = 0.1, gain = 0.4, delay = 0 }: SweepClickOptions
) {
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(startFrequency, start);
  osc.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
  const gainNode = ctx.createGain();
  applyEnvelope(gainNode, start, duration, gain);
  osc.connect(gainNode);
  gainNode.connect(destination);
  osc.start(start);
  osc.stop(start + duration + 0.04);
}

// Durations run noticeably longer than a "true" click, and the envelope holds at peak
// briefly before decaying (see applyEnvelope) — very short instant-decay bursts read as
// quiet to the ear no matter how high the gain is. Trim with the volume slider in
// soundSettings.ts if this ends up too loud rather than shortening these back down.
export const CLICK_PRESETS: ClickPreset[] = [
  {
    id: "soft-wood",
    label: "또각 (부드러운 나무)",
    play(ctx, variant, dest) {
      if (variant === "click") {
        playNoiseClick(ctx, dest, { frequency: 900, q: 2, duration: 0.16, gain: 0.95 });
      } else if (variant === "correct") {
        playNoiseClick(ctx, dest, { frequency: 900, q: 2, duration: 0.12, gain: 0.85 });
        playNoiseClick(ctx, dest, { frequency: 1300, q: 2, duration: 0.16, gain: 0.95, delay: 0.13 });
      } else {
        playNoiseClick(ctx, dest, { frequency: 500, q: 1.5, duration: 0.26, gain: 0.85 });
      }
    },
  },
  {
    id: "sharp-click",
    label: "딱 (또렷한 클릭)",
    play(ctx, variant, dest) {
      if (variant === "click") {
        playNoiseClick(ctx, dest, { frequency: 2200, q: 3, duration: 0.1, gain: 1.0 });
      } else if (variant === "correct") {
        playNoiseClick(ctx, dest, { frequency: 2200, q: 3, duration: 0.1, gain: 0.95 });
        playNoiseClick(ctx, dest, { frequency: 2800, q: 3, duration: 0.1, gain: 1.0, delay: 0.1 });
      } else {
        playNoiseClick(ctx, dest, { frequency: 1200, q: 2.5, duration: 0.15, gain: 0.95 });
      }
    },
  },
  {
    id: "deep-tok",
    label: "톡 (낮고 묵직한 톤)",
    play(ctx, variant, dest) {
      if (variant === "click") {
        playToneClick(ctx, dest, { frequency: 260, duration: 0.2, gain: 0.75 });
        playNoiseClick(ctx, dest, { frequency: 700, q: 2, duration: 0.1, gain: 0.45 });
      } else if (variant === "correct") {
        playToneClick(ctx, dest, { frequency: 260, duration: 0.16, gain: 0.7 });
        playToneClick(ctx, dest, { frequency: 380, duration: 0.2, gain: 0.75, delay: 0.13 });
      } else {
        playToneClick(ctx, dest, { frequency: 190, duration: 0.32, gain: 0.7 });
      }
    },
  },
  {
    id: "bright-double",
    label: "또르르 (경쾌한 이중음)",
    play(ctx, variant, dest) {
      if (variant === "click") {
        playNoiseClick(ctx, dest, { frequency: 1600, q: 3, duration: 0.07, gain: 0.88 });
        playNoiseClick(ctx, dest, { frequency: 1900, q: 3, duration: 0.07, gain: 0.7, delay: 0.04 });
      } else if (variant === "correct") {
        playNoiseClick(ctx, dest, { frequency: 1600, q: 3, duration: 0.07, gain: 0.88 });
        playNoiseClick(ctx, dest, { frequency: 1900, q: 3, duration: 0.07, gain: 0.88, delay: 0.08 });
        playNoiseClick(ctx, dest, { frequency: 2300, q: 3, duration: 0.08, gain: 0.95, delay: 0.16 });
      } else {
        playNoiseClick(ctx, dest, { frequency: 1100, q: 1.5, duration: 0.17, gain: 0.75 });
        playNoiseClick(ctx, dest, { frequency: 900, q: 1.5, duration: 0.19, gain: 0.7, delay: 0.08 });
      }
    },
  },
  {
    id: "playful-boing",
    label: "뿅 (통통 튀는 소리)",
    play(ctx, variant, dest) {
      if (variant === "click") {
        playSweepClick(ctx, dest, { startFrequency: 320, endFrequency: 900, duration: 0.22, gain: 0.78 });
      } else if (variant === "correct") {
        playSweepClick(ctx, dest, { startFrequency: 500, endFrequency: 1000, duration: 0.2, gain: 0.78 });
        playSweepClick(ctx, dest, { startFrequency: 700, endFrequency: 1500, duration: 0.22, gain: 0.85, delay: 0.14 });
      } else {
        playSweepClick(ctx, dest, { startFrequency: 500, endFrequency: 220, duration: 0.34, gain: 0.75 });
      }
    },
  },
];

export const DEFAULT_PRESET_ID = CLICK_PRESETS[0].id;
