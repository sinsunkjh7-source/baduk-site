import { CLICK_PRESETS, DEFAULT_PRESET_ID } from "./clickSounds";

const PRESET_STORAGE_KEY = "baduk-sound-preset";
const VOLUME_STORAGE_KEY = "baduk-sound-volume";
const DEFAULT_VOLUME = 1;

// Applied unconditionally, after compression, so "100%" itself is loud — not just the
// slider's upper end. A limiter after this catches whatever it pushes over the top.
const MAKEUP_GAIN = 2.6;

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let makeupGain: GainNode | null = null;
let limiter: DynamicsCompressorNode | null = null;

// Chain: masterGain (user's slider) -> compressor (tames dynamics) -> fixed makeup gain
// (the actual loudness boost) -> limiter (brick-walls whatever the makeup gain pushes
// over 0dB) -> destination. A limiter alone (no makeup gain) can only prevent clipping —
// it can't make quiet audio louder, which was the mistake in an earlier version of this
// file. The makeup stage is what actually raises perceived loudness.
function getCompressor(ctx: AudioContext): DynamicsCompressorNode {
  if (!compressor) {
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 8;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;

    makeupGain = ctx.createGain();
    makeupGain.gain.value = MAKEUP_GAIN;

    limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1;
    limiter.knee.value = 2;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.1;

    compressor.connect(makeupGain);
    makeupGain.connect(limiter);
    limiter.connect(ctx.destination);
  }
  return compressor;
}

function getMasterGain(ctx: AudioContext): GainNode {
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.value = getVolume();
    masterGain.connect(getCompressor(ctx));
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

/** 0 (silent) to 2 (200%). Defaults to 1 (100%) — the processing chain itself is tuned loud now,
 * so 100% no longer means "quiet baseline you have to boost past." */
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
