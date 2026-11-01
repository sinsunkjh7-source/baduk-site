/**
 * audio.js - 미니 동물장기 생생한 동물 울음소리 & 게임 타격감 Web Audio 엔진
 */
(function(window) {
  'use strict';

  let audioCtx = null;
  let isSoundEnabled = true;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  const AnimalAudio = {
    isEnabled: () => isSoundEnabled,
    toggleSound: () => {
      isSoundEnabled = !isSoundEnabled;
      return isSoundEnabled;
    },
    setSound: (val) => {
      isSoundEnabled = !!val;
    },

    // 1. 나무 말 통통 착수음 (바운스)
    playMove: () => {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 주 타격음 (묵직한 나무소리)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);

      // 보조 탄성음 (통~)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(520, now + 0.02);
      osc2.frequency.exponentialRampToValueAtTime(200, now + 0.12);

      gain2.gain.setValueAtTime(0.2, now + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.02);
      osc2.stop(now + 0.13);
    },

    // 2. 묵직한 포획 타격음 (쿵! + 팡!)
    playCapture: () => {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 강력한 저음 쿵 (화면 흔들림과 싱크)
      const bass = ctx.createOscillator();
      const bGain = ctx.createGain();
      bass.type = 'sine';
      bass.frequency.setValueAtTime(140, now);
      bass.frequency.exponentialRampToValueAtTime(45, now + 0.18);
      bGain.gain.setValueAtTime(0.6, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      bass.connect(bGain);
      bGain.connect(ctx.destination);
      bass.start(now);
      bass.stop(now + 0.2);

      // 경쾌한 포획 팝콘 팝!
      const pop = ctx.createOscillator();
      const pGain = ctx.createGain();
      pop.type = 'triangle';
      pop.frequency.setValueAtTime(400, now + 0.03);
      pop.frequency.exponentialRampToValueAtTime(1100, now + 0.14);
      pGain.gain.setValueAtTime(0.35, now + 0.03);
      pGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      pop.connect(pGain);
      pGain.connect(ctx.destination);
      pop.start(now + 0.03);
      pop.stop(now + 0.18);
    },

    // 3. 동물 소환/드롭 (마법 반짝이 소리)
    playDrop: () => {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const freqs = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.035;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.17);
      });
    },

    // 4. 🦁 사자 어흥 소리 (Lion Roar)
    playLionRoar: () => {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 사자의 웅장하고 유쾌한 만화풍 어흥
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.35);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      // 저역 통과 필터로 부드럽고 묵직한 울림
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(250, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    },

    // 5. 🐥 병아리 삐약! 소리 (Chick Chirp)
    playChickChirp: () => {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 삐약! 1회차
      const o1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      o1.type = 'sine';
      o1.frequency.setValueAtTime(1600, now);
      o1.frequency.exponentialRampToValueAtTime(2800, now + 0.07);
      g1.gain.setValueAtTime(0.25, now);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      o1.connect(g1);
      g1.connect(ctx.destination);
      o1.start(now);
      o1.stop(now + 0.08);

      // 삐약! 2회차
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(1800, now + 0.09);
      o2.frequency.exponentialRampToValueAtTime(3100, now + 0.16);
      g2.gain.setValueAtTime(0.28, now + 0.09);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      o2.connect(g2);
      g2.connect(ctx.destination);
      o2.start(now + 0.09);
      o2.stop(now + 0.18);
    },

    // 6. 🐓 닭 진화 "꼬끼오~!" 팡파르 (Rooster Crow & Fanfare)
    playPromote: () => {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 반짝이는 승급 아르페지오
      const sparkleNotes = [523.25, 659.25, 783.99, 1046.50];
      sparkleNotes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.05;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.21);
      });

      // 꼬-끼-오~! 팡파르
      const crowT = now + 0.25;
      const crowNotes = [
        { f: 440, d: 0.12 },  // 꼬
        { f: 554.37, d: 0.12 }, // 끼
        { f: 659.25, d: 0.14 }, // 오
        { f: 880, d: 0.45 }   // ~!
      ];

      let offset = 0;
      crowNotes.forEach(({ f, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = crowT + offset;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, t);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, t);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + d);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + d + 0.02);
        offset += d * 0.85;
      });
    },

    // 7. 🦒 기린 경쾌한 슬라이드 (Giraffe whistle)
    playGiraffeSound: () => {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    },

    // 8. 🐘 코끼리 트럼펫 뿌우- (Elephant Trumpet)
    playElephantSound: () => {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(330, now + 0.1);
      osc.frequency.linearRampToValueAtTime(440, now + 0.22);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500, now);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    },

    // 9. 승리 팡파르
    playVictory: () => {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const fanfare = [
        { f: 523.25, t: 0.0, d: 0.12 },
        { f: 523.25, t: 0.12, d: 0.12 },
        { f: 523.25, t: 0.24, d: 0.12 },
        { f: 659.25, t: 0.36, d: 0.25 },
        { f: 523.25, t: 0.62, d: 0.12 },
        { f: 659.25, t: 0.74, d: 0.12 },
        { f: 783.99, t: 0.86, d: 0.55 },
        { f: 1046.50, t: 1.45, d: 0.8 }
      ];

      fanfare.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const time = now + t;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, time);

        gain.gain.setValueAtTime(0.32, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + d + 0.05);
      });
    },

    // 10. 패배 아쉬움
    playDefeat: () => {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const notes = [440, 415.3, 392, 349.23];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.15;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    },

    // 11. 선택 톡
    playSelect: () => {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(640, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  };

  window.AnimalAudio = AnimalAudio;
})(window);
