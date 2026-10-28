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
        // 기본 음량 (0.85 배율)
        this.masterGain.gain.setValueAtTime(this.volume * 1.8, this.ctx.currentTime);

        // 여러 소리가 겹쳐도 찌그러지지 않게 리미터를 건다
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.setValueAtTime(-0.5, this.ctx.currentTime);
        this.limiter.knee.setValueAtTime(6, this.ctx.currentTime);
        this.limiter.ratio.setValueAtTime(8, this.ctx.currentTime);
        this.limiter.attack.setValueAtTime(0.005, this.ctx.currentTime);
        this.limiter.release.setValueAtTime(0.15, this.ctx.currentTime);

        this.masterGain.connect(this.limiter);
        this.limiter.connect(this.ctx.destination);
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
  playPlaceSound(color = 1) { this.playStone(); }

  playStone() {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    switch (this.soundType) {
      case 'wood':
      case 'deep': // 2. 묵직한 통나무 바둑판 소리
        this._playDeepWood(t);
        break;
      case 'stone':
      case 'stone':
      case 'crisp': // 3. 경쾌하고 시원한 딱! 소리
        this._playCrispClick(t);
        break;
      case 'maple':
      case 'maple':
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
  /* 잡음(노이즈) 소스 — 실제 돌 부딪히는 소리의 핵심 */
  _noise(dur) {
    const len = Math.ceil(this.ctx.sampleRate * dur);
    if (!this._noiseBuf || this._noiseBuf.length < len) {
      const size = Math.max(len, Math.ceil(this.ctx.sampleRate * 0.4));
      this._noiseBuf = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
      const d = this._noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuf;
    return src;
  }

  /* 프리셋 1: 명품 바둑돌 — 잡음 타격 + 나무 몸통 */
  _playClassicStone(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);

    gain.gain.setValueAtTime(2.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

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

    gain.gain.setValueAtTime(2.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);

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

    gain.gain.setValueAtTime(2.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

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

    gain.gain.setValueAtTime(2.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

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

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  // 🌟 [딩동댕] 전국노래자랑/퀴즈쇼 정통 맑고 화사한 실로폰 '딩-동-댕-동' (도-미-솔-도) 🌟
  playDingDongDang() {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // 한국인이 누구나 명확히 '딩-동-댕-동'으로 인식하는 정통 4단 계이름 (도5 - 미5 - 솔5 - 도6)
    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.65, gain: 0.42 }, // 딩 (도5)
      { freq: 659.25, time: 0.22, dur: 0.65, gain: 0.45 }, // 동 (미5)
      { freq: 783.99, time: 0.44, dur: 0.75, gain: 0.48 }, // 댕 (솔5)
      { freq: 1046.50, time: 0.66, dur: 1.20, gain: 0.55 } // 동 (도6 - 길고 청아한 여운)
    ];

    notes.forEach(n => {
      const start = t + n.time;

      // 1. 부드러운 고무 말렛 타격음 (금속 쇳소리 완전 제거)
      const oscMallet = this.ctx.createOscillator();
      const gainMallet = this.ctx.createGain();
      oscMallet.type = 'sine';
      oscMallet.frequency.setValueAtTime(1400, start);
      oscMallet.frequency.exponentialRampToValueAtTime(300, start + 0.015);
      gainMallet.gain.setValueAtTime(0.15, start);
      gainMallet.gain.exponentialRampToValueAtTime(0.001, start + 0.016);
      oscMallet.connect(gainMallet);
      gainMallet.connect(this.masterGain);
      oscMallet.start(start);
      oscMallet.stop(start + 0.02);

      // 2. 따뜻하고 영롱한 실로폰 바 기본 사인파 (Pure Warm Glockenspiel Tone)
      const oscMain = this.ctx.createOscillator();
      const gainMain = this.ctx.createGain();
      oscMain.type = 'sine';
      oscMain.frequency.setValueAtTime(n.freq, start);
      gainMain.gain.setValueAtTime(n.gain * 0.7, start);
      gainMain.gain.exponentialRampToValueAtTime(0.001, start + n.dur);
      oscMain.connect(gainMain);
      gainMain.connect(this.masterGain);
      oscMain.start(start);
      oscMain.stop(start + n.dur + 0.05);

      // 3. 맑고 청아한 2차 옥타브 배음 (은쟁반에 옥구슬 굴러가는 소리)
      const oscHarm1 = this.ctx.createOscillator();
      const gainHarm1 = this.ctx.createGain();
      oscHarm1.type = 'sine';
      oscHarm1.frequency.setValueAtTime(n.freq * 2, start);
      gainHarm1.gain.setValueAtTime(n.gain * 0.22, start);
      gainHarm1.gain.exponentialRampToValueAtTime(0.001, start + (n.dur * 0.5));
      oscHarm1.connect(gainHarm1);
      gainHarm1.connect(this.masterGain);
      oscHarm1.start(start);
      oscHarm1.stop(start + n.dur);
    });
  }

  // 호환용 별칭
  playDingDong() {
    this.playDingDongDang();
  }

  // 🌟 [오답음] 듀오링고/카훗 스타일 부드러운 저음 하강 톤 (딩동댕과 180도 확실히 구분되는 오답 사운드) 🌟
  playDdang() {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const dur = 0.45;

    // 메인 하강 톤 (260Hz -> 175Hz로 부드럽게 미끄러지며 아쉬움을 표현)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(260, t);
    osc1.frequency.exponentialRampToValueAtTime(175, t + dur);

    gain1.gain.setValueAtTime(0.01, t);
    gain1.gain.linearRampToValueAtTime(0.55, t + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + dur + 0.02);

    // 하모닉 단3도 마이너 코드 (오답/실패임을 누구나 직관적으로 알 수 있는 화음)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(310, t);
    osc2.frequency.exponentialRampToValueAtTime(208, t + dur);

    gain2.gain.setValueAtTime(0.01, t);
    gain2.gain.linearRampToValueAtTime(0.25, t + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t);
    osc2.stop(t + dur + 0.02);
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

  // 🖱️ 메뉴 위에 마우스가 닿을 때의 짧은 틱 소리
  playHover() {
    if (!this.enabled || this.volume <= 0) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1180, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.045);
    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('baduk_audio_enabled', this.enabled.toString());
    return this.enabled;
  }
}

window.badukAudio = new BadukAudio();
