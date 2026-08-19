import { CLICK_PRESETS, DEFAULT_PRESET_ID } from "./clickSounds";

const PRESET_STORAGE_KEY = "baduk-sound-preset";
const VOLUME_STORAGE_KEY = "baduk-sound-volume";
const DEFAULT_VOLUME = 1;

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let safetyLimiter: DynamicsCompressorNode | null = null;

// Just a gentle safety net against literal digital clipping when a few notes overlap —
// NOT a loudness tool. A previous version chained a hard limiter after a fixed 2.6x
// makeup gain to force more loudness; combined with overlapping multi-note "correct"
// sounds, that slammed the limiter hard enough to audibly distort ("찢어짐"). Real
// loudness now comes only from clickSounds.ts's own gain/duration/envelope choices,
// kept low enough headroom that this limiter should rarely even engage.
function getSafetyLimiter(ctx: AudioContext): DynamicsCompressorNode {
  if (!safetyLimiter) {
    safetyLimiter = ctx.createDynamicsCompressor();
    safetyLimiter.threshold.value = -2;
    safetyLimiter.knee.value = 4;
    safetyLimiter.ratio.value = 3;
    safetyLimiter.attack.value = 0.003;
    safetyLimiter.release.value = 0.15;
    safetyLimiter.connect(ctx.destination);
  }
  return safetyLimiter;
}

function getMasterGain(ctx: AudioContext): GainNode {
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.value = getVolume();
    masterGain.connect(getSafetyLimiter(ctx));
  }
  return masterGain;
}

function getContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  // Defensive: some browsers leave a freshly-created context "suspended" until resumed,
  // which would otherwise play sound at effectively zero volume with no error.
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

export function getSelectedPresetId(): string {
  return localStorage.getItem(PRESET_STORAGE_KEY) ?? DEFAULT_PRESET_ID;
}

export function setSelectedPresetId(id: string): void {
  localStorage.setItem(PRESET_STORAGE_KEY, id);
}

function getSelectedPreset() {
  return CLICK_PRESETS.find((p) => p.id === getSelectedPresetId()) ?? CLICK_PRESETS[0];
}

/** 0 (silent) to 2 (200% — may start to sound rough at the very top since it's raw gain, not magic). Defaults to 1 (100%). */
export function getVolume(): number {
  const raw = localStorage.getItem(VOLUME_STORAGE_KEY);
  const parsed = raw !== null ? Number(raw) : DEFAULT_VOLUME;
  return Number.isFinite(parsed) ? parsed : DEFAULT_VOLUME;
}

export function setVolume(value: number): void {
  localStorage.setItem(VOLUME_STORAGE_KEY, String(value));
  if (masterGain) masterGain.gain.value = value;
}

export function playClickSound(): void {
  const ctx = getContext();
  getSelectedPreset().play(ctx, "click", getMasterGain(ctx));
}

export function playCorrectSound(): void {
  const ctx = getContext();
  getSelectedPreset().play(ctx, "correct", getMasterGain(ctx));
}

export function playIncorrectSound(): void {
  const ctx = getContext();
  getSelectedPreset().play(ctx, "incorrect", getMasterGain(ctx));
}

export function previewPreset(id: string): void {
  const preset = CLICK_PRESETS.find((p) => p.id === id);
  const ctx = getContext();
  preset?.play(ctx, "click", getMasterGain(ctx));
}
