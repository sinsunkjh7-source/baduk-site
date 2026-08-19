import { useState } from "react";
import { CLICK_PRESETS } from "./clickSounds";
import { getSelectedPresetId, setSelectedPresetId, previewPreset } from "./soundSettings";
import "./SoundPicker.css";

export function SoundPicker() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(getSelectedPresetId());

  function choose(id: string) {
    setSelectedPresetId(id);
    setSelected(id);
    previewPreset(id);
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
        </div>
      )}
    </div>
  );
}
