import { CLICK_PRESETS, DEFAULT_PRESET_ID } from "./clickSounds";

const STORAGE_KEY = "baduk-sound-preset";

let audioCtx: AudioContext | null = null;
function getContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function getSelectedPresetId(): string {
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_PRESET_ID;
}

export function setSelectedPresetId(id: string): void {
  localStorage.setItem(STORAGE_KEY, id);
}

function getSelectedPreset() {
  return CLICK_PRESETS.find((p) => p.id === getSelectedPresetId()) ?? CLICK_PRESETS[0];
}

export function playClickSound(): void {
  getSelectedPreset().play(getContext(), "click");
}

export function playCorrectSound(): void {
  getSelectedPreset().play(getContext(), "correct");
}

export function playIncorrectSound(): void {
  getSelectedPreset().play(getContext(), "incorrect");
}

export function previewPreset(id: string): void {
  const preset = CLICK_PRESETS.find((p) => p.id === id);
  preset?.play(getContext(), "click");
}
