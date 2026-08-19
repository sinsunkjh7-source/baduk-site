import { CLICK_PRESETS, DEFAULT_PRESET_ID } from "./clickSounds";

const PRESET_STORAGE_KEY = "baduk-sound-preset";
const VOLUME_STORAGE_KEY = "baduk-sound-volume";
const DEFAULT_VOLUME = 1.6;

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;

// A limiter (not a general compressor) sits after the master gain: threshold is close to
// 0dB so normal-level audio passes through completely untouched, and only genuine
// near-clipping peaks get caught. A low threshold here would quietly undo the volume
// boost instead of protecting it — that was a real bug in an earlier version of this file.
function getCompressor(ctx: AudioContext): DynamicsCompressorNode {
  if (!compressor) {
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -3;
    compressor.knee.value = 6;
    compressor.ratio.value = 20;
    compressor.attack.value = 0.001;
    compressor.release.value = 0.1;
    compressor.connect(ctx.destination);
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

/** 0 (silent) to 2 (200%, boosted). Defaults to 1.6 (160%) — a limiter keeps this from clipping. */
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
