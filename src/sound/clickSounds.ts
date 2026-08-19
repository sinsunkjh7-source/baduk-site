export type ClickVariant = "click" | "correct" | "incorrect";

export interface ClickPreset {
  id: string;
  label: string;
  play: (ctx: AudioContext, variant: ClickVariant) => void;
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
  gainNode.connect(ctx.destination);
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
  gainNode.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export const CLICK_PRESETS: ClickPreset[] = [
  {
    id: "soft-wood",
    label: "또각 (부드러운 나무)",
    play(ctx, variant) {
      if (variant === "click") {
        playNoiseClick(ctx, { frequency: 900, q: 2, duration: 0.05, gain: 0.45 });
      } else if (variant === "correct") {
        playNoiseClick(ctx, { frequency: 900, q: 2, duration: 0.04, gain: 0.4 });
        playNoiseClick(ctx, { frequency: 1300, q: 2, duration: 0.05, gain: 0.45, delay: 0.09 });
      } else {
        playNoiseClick(ctx, { frequency: 500, q: 1.5, duration: 0.09, gain: 0.4 });
      }
    },
  },
  {
    id: "sharp-click",
    label: "딱 (또렷한 클릭)",
    play(ctx, variant) {
      if (variant === "click") {
        playNoiseClick(ctx, { frequency: 2200, q: 3, duration: 0.03, gain: 0.5 });
      } else if (variant === "correct") {
        playNoiseClick(ctx, { frequency: 2200, q: 3, duration: 0.03, gain: 0.45 });
        playNoiseClick(ctx, { frequency: 2800, q: 3, duration: 0.03, gain: 0.5, delay: 0.07 });
      } else {
        playNoiseClick(ctx, { frequency: 1200, q: 2.5, duration: 0.05, gain: 0.45 });
      }
    },
  },
  {
    id: "deep-tok",
    label: "톡 (낮고 묵직한 톤)",
    play(ctx, variant) {
      if (variant === "click") {
        playToneClick(ctx, { frequency: 260, duration: 0.07, gain: 0.32 });
        playNoiseClick(ctx, { frequency: 700, q: 2, duration: 0.03, gain: 0.2 });
      } else if (variant === "correct") {
        playToneClick(ctx, { frequency: 260, duration: 0.06, gain: 0.3 });
        playToneClick(ctx, { frequency: 380, duration: 0.07, gain: 0.32, delay: 0.09 });
      } else {
        playToneClick(ctx, { frequency: 190, duration: 0.12, gain: 0.3 });
      }
    },
  },
  {
    id: "bright-double",
    label: "또르르 (경쾌한 이중음)",
    play(ctx, variant) {
      if (variant === "click") {
        playNoiseClick(ctx, { frequency: 1600, q: 3, duration: 0.02, gain: 0.4 });
        playNoiseClick(ctx, { frequency: 1900, q: 3, duration: 0.02, gain: 0.3, delay: 0.02 });
      } else if (variant === "correct") {
        playNoiseClick(ctx, { frequency: 1600, q: 3, duration: 0.02, gain: 0.4 });
        playNoiseClick(ctx, { frequency: 1900, q: 3, duration: 0.02, gain: 0.4, delay: 0.06 });
        playNoiseClick(ctx, { frequency: 2300, q: 3, duration: 0.03, gain: 0.45, delay: 0.12 });
      } else {
        playNoiseClick(ctx, { frequency: 1100, q: 1.5, duration: 0.06, gain: 0.35 });
        playNoiseClick(ctx, { frequency: 900, q: 1.5, duration: 0.07, gain: 0.3, delay: 0.05 });
      }
    },
  },
];

export const DEFAULT_PRESET_ID = CLICK_PRESETS[0].id;
