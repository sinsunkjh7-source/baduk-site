export type ClickVariant = "click" | "correct" | "incorrect";

export interface ClickPreset {
  id: string;
  label: string;
  play: (ctx: AudioContext, variant: ClickVariant, destination: AudioNode) => void;
}

let noiseBufferCache: AudioBuffer | null = null;

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBufferCache && noiseBufferCache.sampleRate === ctx.sampleRate) return noiseBufferCache;
  const length = Math.floor(ctx.sampleRate * 0.3);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  noiseBufferCache = buffer;
  return buffer;
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
  gainNode.gain.setValueAtTime(gain, start);
  gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
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
  gainNode.gain.setValueAtTime(gain, start);
  gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
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
  gainNode.gain.setValueAtTime(gain, start);
  gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration + 0.03);
  osc.connect(gainNode);
  gainNode.connect(destination);
  osc.start(start);
  osc.stop(start + duration + 0.04);
}

// Durations run a bit longer than a "true" click (and gains sit fairly high) because very
// short bursts read as quiet to the ear regardless of peak level — the master volume slider
// in soundSettings.ts is the place to trim this back down if it ends up too loud.
export const CLICK_PRESETS: ClickPreset[] = [
  {
    id: "soft-wood",
    label: "또각 (부드러운 나무)",
    play(ctx, variant, dest) {
      if (variant === "click") {
        playNoiseClick(ctx, dest, { frequency: 900, q: 2, duration: 0.08, gain: 0.78 });
      } else if (variant === "correct") {
        playNoiseClick(ctx, dest, { frequency: 900, q: 2, duration: 0.06, gain: 0.68 });
        playNoiseClick(ctx, dest, { frequency: 1300, q: 2, duration: 0.08, gain: 0.78, delay: 0.09 });
      } else {
        playNoiseClick(ctx, dest, { frequency: 500, q: 1.5, duration: 0.13, gain: 0.68 });
      }
    },
  },
  {
    id: "sharp-click",
    label: "딱 (또렷한 클릭)",
    play(ctx, variant, dest) {
      if (variant === "click") {
        playNoiseClick(ctx, dest, { frequency: 2200, q: 3, duration: 0.05, gain: 0.88 });
      } else if (variant === "correct") {
        playNoiseClick(ctx, dest, { frequency: 2200, q: 3, duration: 0.05, gain: 0.78 });
        playNoiseClick(ctx, dest, { frequency: 2800, q: 3, duration: 0.05, gain: 0.88, delay: 0.07 });
      } else {
        playNoiseClick(ctx, dest, { frequency: 1200, q: 2.5, duration: 0.08, gain: 0.78 });
      }
    },
  },
  {
    id: "deep-tok",
    label: "톡 (낮고 묵직한 톤)",
    play(ctx, variant, dest) {
      if (variant === "click") {
        playToneClick(ctx, dest, { frequency: 260, duration: 0.1, gain: 0.58 });
        playNoiseClick(ctx, dest, { frequency: 700, q: 2, duration: 0.05, gain: 0.36 });
      } else if (variant === "correct") {
        playToneClick(ctx, dest, { frequency: 260, duration: 0.09, gain: 0.55 });
        playToneClick(ctx, dest, { frequency: 380, duration: 0.1, gain: 0.58, delay: 0.09 });
      } else {
        playToneClick(ctx, dest, { frequency: 190, duration: 0.17, gain: 0.55 });
      }
    },
  },
  {
    id: "bright-double",
    label: "또르르 (경쾌한 이중음)",
    play(ctx, variant, dest) {
      if (variant === "click") {
        playNoiseClick(ctx, dest, { frequency: 1600, q: 3, duration: 0.035, gain: 0.7 });
        playNoiseClick(ctx, dest, { frequency: 1900, q: 3, duration: 0.035, gain: 0.55, delay: 0.02 });
      } else if (variant === "correct") {
        playNoiseClick(ctx, dest, { frequency: 1600, q: 3, duration: 0.035, gain: 0.7 });
        playNoiseClick(ctx, dest, { frequency: 1900, q: 3, duration: 0.035, gain: 0.7, delay: 0.06 });
        playNoiseClick(ctx, dest, { frequency: 2300, q: 3, duration: 0.04, gain: 0.75, delay: 0.12 });
      } else {
        playNoiseClick(ctx, dest, { frequency: 1100, q: 1.5, duration: 0.09, gain: 0.6 });
        playNoiseClick(ctx, dest, { frequency: 900, q: 1.5, duration: 0.1, gain: 0.55, delay: 0.05 });
      }
    },
  },
  {
    id: "playful-boing",
    label: "뿅 (통통 튀는 소리)",
    play(ctx, variant, dest) {
      if (variant === "click") {
        playSweepClick(ctx, dest, { startFrequency: 320, endFrequency: 900, duration: 0.12, gain: 0.62 });
      } else if (variant === "correct") {
        playSweepClick(ctx, dest, { startFrequency: 500, endFrequency: 1000, duration: 0.11, gain: 0.62 });
        playSweepClick(ctx, dest, { startFrequency: 700, endFrequency: 1500, duration: 0.13, gain: 0.68, delay: 0.09 });
      } else {
        playSweepClick(ctx, dest, { startFrequency: 500, endFrequency: 220, duration: 0.2, gain: 0.58 });
      }
    },
  },
];

export const DEFAULT_PRESET_ID = CLICK_PRESETS[0].id;
