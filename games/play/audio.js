// ===================================================
// 바둑 어드벤처 사운드 엔진 (단일 타격음 & 강력한 볼륨 증폭)
// ===================================================

class BadukAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    
    // 🌟 마지막 볼륨/사운드 설정 복원 (기본 100%) 🌟
    const savedVol = localStorage.getItem('baduk_audio_volume') || localStorage.getItem('sandbox_audio_volume');
    this.volume = (savedVol !== null) ? parseFloat(savedVol) : 1.0;

    const savedType = localStorage.getItem('baduk_audio_type') || localStorage.getItem('sandbox_audio_type');
    this.soundType = savedType || 'classic';

    const savedEnabled = localStorage.getItem('sandbox_audio_enabled') || localStorage.getItem('baduk_audio_enabled');
    this.enabled = (savedEnabled !== null) ? (savedEnabled === 'true') : true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    localStorage.setItem('sandbox_audio_volume', this.volume); localStorage.setItem('baduk_audio_volume', this.volume);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  setSoundType(type) {
    this.soundType = type;
    localStorage.setItem('sandbox_audio_type', type); localStorage.setItem('baduk_audio_type', type);
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    localStorage.setItem('sandbox_audio_enabled', this.enabled ? 'true' : 'false');
  }

  playPlaceSound(stoneColor = 1) {
    if (!this.enabled || this.volume <= 0.01) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const colorMod = (stoneColor === 1) ? 0.95 : 1.05;

      switch (this.soundType) {
        case 'wood': // 둔탁한 묵직 (두터운 원목 울림)
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(280 * colorMod, t);
          osc.frequency.exponentialRampToValueAtTime(70, t + 0.09);
          gain.gain.setValueAtTime(1.8 * this.volume, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
          break;

        case 'stone': // 맑은 딸깍 (선명한 운석)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(540 * colorMod, t);
          osc.frequency.exponentialRampToValueAtTime(160, t + 0.07);
          gain.gain.setValueAtTime(1.9 * this.volume, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
          break;

        case 'maple': // 정갈한 단풍 (산뜻하고 경쾌한 클릭)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(420 * colorMod, t);
          osc.frequency.exponentialRampToValueAtTime(110, t + 0.075);
          gain.gain.setValueAtTime(1.7 * this.volume, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.085);
          break;

        case 'classic': // 경쾌한 바둑돌 (기본 명품 타격음)
        default:
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(360 * colorMod, t);
          osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);
          gain.gain.setValueAtTime(2.0 * this.volume, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.095);
          break;
      }

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  playCaptureSound() {
    if (!this.enabled || this.volume <= 0.01) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(680, t + 0.08);
      gain.gain.setValueAtTime(1.4 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.11);
    } catch (e) {}
  }

  playCountdownBeep(isFinal = false) {
    if (!this.enabled || this.volume <= 0.01) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      if (isFinal) {
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.25);
        gain.gain.setValueAtTime(1.5 * this.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.3);
      } else {
        osc.frequency.setValueAtTime(520, t);
        gain.gain.setValueAtTime(0.9 * this.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.13);
      }
    } catch (e) {}
  }
}

window.BadukAudio = BadukAudio;
window.badukAudio = new BadukAudio();
