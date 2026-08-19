import { useState } from "react";
import { CLICK_PRESETS } from "./clickSounds";
import { getSelectedPresetId, setSelectedPresetId, previewPreset, getVolume, setVolume } from "./soundSettings";
import "./SoundPicker.css";

export function SoundPicker() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(getSelectedPresetId());
  const [volume, setVolumeState] = useState(getVolume());

  function choose(id: string) {
    setSelectedPresetId(id);
    setSelected(id);
    previewPreset(id);
  }

  function handleVolumeChange(value: number) {
    setVolumeState(value);
    setVolume(value);
  }

  return (
    <div className="sound-picker">
      <button className="sound-picker-toggle" onClick={() => setOpen((v) => !v)}>
        🔊 소리 설정
      </button>
      {open && (
        <div className="sound-picker-panel">
          {CLICK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`sound-preset-btn${selected === preset.id ? " active" : ""}`}
              onClick={() => choose(preset.id)}
            >
              {preset.label}
            </button>
          ))}

          <label className="volume-control">
            볼륨: {Math.round(volume * 100)}%
            <input
              type="range"
              min={0}
              max={3}
              step={0.1}
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              onMouseUp={() => previewPreset(selected)}
              onTouchEnd={() => previewPreset(selected)}
            />
          </label>
        </div>
      )}
    </div>
  );
}
