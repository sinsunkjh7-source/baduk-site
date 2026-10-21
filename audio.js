// ===================================================
// 바둑 어드벤처 사운드 엔진 (단일 타격음 & 강력한 볼륨 증폭)
// ===================================================

class BadukAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    
    // 🌟 마지막 볼륨/사운드 설정 복원 (기본 100%) 🌟
    const savedVol = localStorage.getItem('baduk_audio_volume');
    this.volume = (savedVol !== null) ? parseFloat(savedVol) : 1.0;

    const savedType = localStorage.getItem('baduk_audio_type');
    this.soundType = savedType || 'classic';

    const savedEnabled = localStorage.getItem('baduk_audio_enabled');
    this.enabled = (savedEnabled !== null) ? (savedEnabled === 'true') : true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        // 볼륨 증폭 지원 (기본 1.8배 부스트)
        this.masterGain.gain.setValueAtTime(this.volume * 1.8, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 볼륨 조절 (0.0 ~ 2.0으로 최대 200% 강력 증폭)
  setVolume(val) {
    this.volume = Math.max(0, val);
    localStorage.setItem('baduk_audio_volume', this.volume.toString());
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume * 1.8, this.ctx.currentTime);
    }
  }

  setSoundType(type) {
    this.soundType = type;
    localStorage.setItem('baduk_audio_type', type);
  }

  // 🌟 이중 소리 방지: 단 하나의 명쾌한 단타 사운드 재생 🌟
  playStone() {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    switch (this.soundType) {
      case 'deep': // 2. 묵직한 통나무 바둑판 소리
        this._playDeepWood(t);
        break;
      case 'crisp': // 3. 경쾌하고 시원한 딱! 소리
        this._playCrispClick(t);
        break;
      case 'pop': // 4. 귀여운 퐁퐁 소리
        this._playCutePop(t);
        break;
      case 'classic': // 1. 명품 바둑돌 (단일 착수음)
      default:
        this._playClassicStone(t);
        break;
    }
  }

  // 프리셋 1: 정통 명품 바둑돌 (단일 타격, 깔끔한 잔향)
  _playClassicStone(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);

    gain.gain.setValueAtTime(1.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // 프리셋 2: 묵직한 통나무 바둑판 소리
  _playDeepWood(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.14);

    gain.gain.setValueAtTime(1.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // 프리셋 3: 경쾌한 딱! 소리
  _playCrispClick(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(250, t + 0.035);

    gain.gain.setValueAtTime(1.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.045);
  }

  // 프리셋 4: 귀여운 퐁퐁 소리
  _playCutePop(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.09);

    gain.gain.setValueAtTime(1.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  // 돌 따내기 소리
  playCapture() {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.12);

    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  // 🌟 [딩동댕] 초고음질 맑고 경쾌한 실로폰/글로켄슈필 차임 (맑고 청아한 크리스탈 사운드) 🌟
  playDingDongDang() {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // 경쾌하고 높은 옥타브 (미6: 1318.5Hz, 솔6: 1568Hz, 도7: 2093Hz)
    const notes = [
      { freq: 1318.51, time: 0, dur: 0.38, gain: 0.70 },
      { freq: 1567.98, time: 0.13, dur: 0.38, gain: 0.75 },
      { freq: 2093.00, time: 0.26, dur: 0.85, gain: 0.90 }
    ];

    notes.forEach(n => {
      const start = t + n.time;

      // 1. 실로폰 말렛의 경쾌하고 청량한 타격 클릭 (Crisp mallet strike)
      const oscAttack = this.ctx.createOscillator();
      const gainAttack = this.ctx.createGain();
      oscAttack.type = 'triangle';
      oscAttack.frequency.setValueAtTime(3600, start);
      oscAttack.frequency.exponentialRampToValueAtTime(1000, start + 0.012);
      gainAttack.gain.setValueAtTime(0.40, start);
      gainAttack.gain.exponentialRampToValueAtTime(0.001, start + 0.016);
      oscAttack.connect(gainAttack);
      gainAttack.connect(this.masterGain);
      oscAttack.start(start);
      oscAttack.stop(start + 0.02);

      // 2. 맑고 투명한 실로폰 바 기본 음 (Pure crystal sine)
      const oscMain = this.ctx.createOscillator();
      const gainMain = this.ctx.createGain();
      oscMain.type = 'sine';
      oscMain.frequency.setValueAtTime(n.freq, start);
      gainMain.gain.setValueAtTime(n.gain, start);
      gainMain.gain.exponentialRampToValueAtTime(0.001, start + n.dur);
      oscMain.connect(gainMain);
      gainMain.connect(this.masterGain);
      oscMain.start(start);
      oscMain.stop(start + n.dur + 0.05);

      // 3. 은방울처럼 반짝이는 청아한 배음 (Shimmering chime overtone)
      const oscHarmonic = this.ctx.createOscillator();
      const gainHarmonic = this.ctx.createGain();
      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(n.freq * 2.76, start);
      gainHarmonic.gain.setValueAtTime(n.gain * 0.28, start);
      gainHarmonic.gain.exponentialRampToValueAtTime(0.001, start + (n.dur * 0.45));
      oscHarmonic.connect(gainHarmonic);
      gainHarmonic.connect(this.masterGain);
      oscHarmonic.start(start);
      oscHarmonic.stop(start + n.dur);
    });
  }

  // 🌟 [땡!] 경쾌하고 명확한 퀴즈 땡 사운드 (둔탁함 완전 제거, 경쾌한 실로폰 블록음) 🌟
  playDdang() {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. 말렛 목탁/블록 타격음 (Crisp woodblock strike)
    const oscClick = this.ctx.createOscillator();
    const gainClick = this.ctx.createGain();
    oscClick.type = 'triangle';
    oscClick.frequency.setValueAtTime(1800, t);
    oscClick.frequency.exponentialRampToValueAtTime(500, t + 0.015);
    gainClick.gain.setValueAtTime(0.45, t);
    gainClick.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    oscClick.connect(gainClick);
    gainClick.connect(this.masterGain);
    oscClick.start(t);
    oscClick.stop(t + 0.025);

    // 2. 경쾌하고 청명한 땡 소리 (Bright dissonant bell pair: F#5 + G5 drop)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(740, t); // F#5
    osc1.frequency.exponentialRampToValueAtTime(440, t + 0.3);
    gain1.gain.setValueAtTime(0.70, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.35);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(784, t); // G5 (반음 불협화음으로 명쾌한 땡 느낌)
    osc2.frequency.exponentialRampToValueAtTime(480, t + 0.3);
    gain2.gain.setValueAtTime(0.45, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t);
    osc2.stop(t + 0.35);
  }

  // 미션 성공 효과음 (딩동댕 호출)
  playSuccess() {
    this.playDingDongDang();
  }

  // 💬 매너 퀵채팅 수신 차임벨 (맑고 정중한 투톤 벨소리)
  playChatChime() {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [659.25, 880.00]; // E5 -> A5 (맑은 종소리)
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.11;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.45, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.38);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    });
  }

  // ⏱️ 초읽기 카운트다운 비프음
  playBeep(isWarning = false) {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isWarning ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isWarning ? 880 : 520, t);

    gain.gain.setValueAtTime(isWarning ? 0.35 : 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('baduk_audio_enabled', this.enabled.toString());
    return this.enabled;
  }
}

window.badukAudio = new BadukAudio();
