/**
 * audio.js - 롤러코스터 고화질 입체 사운드 Web Audio 엔진
 * 리프트 래칫 소리, 속도 연동 레일 굉음 + 맞바람 소리, 브레이크 마찰음,
 * 부스터 폭발음, 바둑 착수 타격음
 */
(function(window) {
  'use strict';

  let audioCtx = null;
  let isSoundEnabled = true;

  function getCtx() {
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

  // 레일 진동음 & 바람 소리용 노드
  let windSource = null;
  let windGain = null;
  let windFilter = null;

  let railSource = null;
  let railGain = null;
  let railFilter = null;

  let liftTimer = null;

  const CoasterAudio = {
    isEnabled: () => isSoundEnabled,

    resume: () => {
      const ctx = getCtx();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
    },

    toggleSound: () => {
      isSoundEnabled = !isSoundEnabled;
      if (!isSoundEnabled) {
        CoasterAudio.stopWind();
        CoasterAudio.stopLiftHill();
      }
      return isSoundEnabled;
    },

    // 1. 리프트 체인 등반 래칫 소리 (카르륵... 카르륵...)
    startLiftHill: () => {
      if (!isSoundEnabled) return;
      CoasterAudio.stopLiftHill();

      const click = () => {
        const ctx = getCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      };

      click();
      liftTimer = setInterval(click, 140);
    },

    stopLiftHill: () => {
      if (liftTimer) {
        clearInterval(liftTimer);
        liftTimer = null;
      }
    },

    // 2. 롤러코스터 질주 바람음 + 육중한 레일 마찰 굉음 (속도 실시간 연동)
    startRideAudio: () => {
      if (!isSoundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;

      // 바람 화이트 노이즈 생성
      if (!windSource) {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        windSource = ctx.createBufferSource();
        windSource.buffer = noiseBuffer;
        windSource.loop = true;

        windFilter = ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.setValueAtTime(600, ctx.currentTime);
        windFilter.Q.setValueAtTime(1.5, ctx.currentTime);

        windGain = ctx.createGain();
        windGain.gain.setValueAtTime(0.02, ctx.currentTime);

        windSource.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(ctx.destination);
        windSource.start();
      }

      // 레일 저음 진동 (핑크 노이즈 느낌의 저역 필터)
      if (!railSource) {
        const bufferSize = ctx.sampleRate * 2;
        const railBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const rOut = railBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          rOut[i] = (b0 + b1 + b2 + white * 0.5362) * 0.25;
        }

        railSource = ctx.createBufferSource();
        railSource.buffer = railBuffer;
        railSource.loop = true;

        railFilter = ctx.createBiquadFilter();
        railFilter.type = 'lowpass';
        railFilter.frequency.setValueAtTime(180, ctx.currentTime);

        railGain = ctx.createGain();
        railGain.gain.setValueAtTime(0.04, ctx.currentTime);

        railSource.connect(railFilter);
        railFilter.connect(railGain);
        railGain.connect(ctx.destination);
        railSource.start();
      }
    },

    // 속도(0 ~ 200km/h)에 따른 사운드 볼륨 & 피치 실시간 모듈레이션
    setRideSpeed: (speedKm) => {
      if (!isSoundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      const norm = Math.min(1.0, Math.max(0.05, speedKm / 180)); // 0.05 ~ 1.0

      if (windGain && windFilter) {
        const targetWindVol = 0.02 + norm * 0.38; // 고속 시 바람 볼륨 급상승
        const targetWindFreq = 300 + norm * 1800; // 300Hz ~ 2100Hz
        windGain.gain.setTargetAtTime(targetWindVol, now, 0.08);
        windFilter.frequency.setTargetAtTime(targetWindFreq, now, 0.08);
      }

      if (railGain && railFilter) {
        const targetRailVol = 0.03 + norm * 0.32; // 레일 덜컹거리는 굉음
        const targetRailFreq = 120 + norm * 350; // 120Hz ~ 470Hz
        railGain.gain.setTargetAtTime(targetRailVol, now, 0.08);
        railFilter.frequency.setTargetAtTime(targetRailFreq, now, 0.08);
      }
    },

    stopWind: () => {
      if (windSource) {
        try { windSource.stop(); } catch(e){}
        windSource = null;
        windGain = null;
        windFilter = null;
      }
      if (railSource) {
        try { railSource.stop(); } catch(e){}
        railSource = null;
        railGain = null;
        railFilter = null;
      }
    },

    // 3. 브레이크 마찰음 (게이트 앞 감속 시 끼이익-! + 공기압 취익-!)
    playBrakeScreech: () => {
      if (!isSoundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 날카로운 금속 마찰음
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1600, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.45);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);

      // 에어 브레이크 취익-! 사운드
      const noise = ctx.createBufferSource();
      const bSize = ctx.sampleRate * 0.5;
      const b = ctx.createBuffer(1, bSize, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
      noise.buffer = b;

      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.setValueAtTime(1200, now);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(f);
      f.connect(g);
      g.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.5);
    },

    // 4. 로켓/마그마 부스터 점화 & 대폭발 굉음 (정답 시 폭풍 질주)
    playBoosterLaunch: () => {
      if (!isSoundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 묵직한 서브우퍼 폭발음 (쾅-!)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);
      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);

      // 로켓 화염 분사 굉음 (콰아아아앙-!)
      const rocket = ctx.createOscillator();
      const rGain = ctx.createGain();
      rocket.type = 'sawtooth';
      rocket.frequency.setValueAtTime(180, now + 0.05);
      rocket.frequency.exponentialRampToValueAtTime(1200, now + 0.6);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now + 0.05);
      filter.frequency.linearRampToValueAtTime(2800, now + 0.6);

      rGain.gain.setValueAtTime(0.5, now + 0.05);
      rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      rocket.connect(filter);
      filter.connect(rGain);
      rGain.connect(ctx.destination);
      rocket.start(now + 0.05);
      rocket.stop(now + 0.65);
    },

    // 5. 바둑 착수음 (명쾌한 나무 타격 "탁!")
    playStoneClack: () => {
      if (!isSoundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.07);

      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    },

    // 6. 오답 경보 & 비상 탈락
    playWrongAlarm: () => {
      if (!isSoundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(160, now + 0.12);
      osc.frequency.setValueAtTime(110, now + 0.24);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    },

    // 7. 카운트다운 째깍 비프음
    playTick: (isUrgent = false) => {
      if (!isSoundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isUrgent ? 950 : 680, now);

      gain.gain.setValueAtTime(isUrgent ? 0.35 : 0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isUrgent ? 0.08 : 0.04));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    },

    // 8. 골인 승리 팡파르
    playVictory: () => {
      if (!isSoundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.38);
      });
    }
  };

  window.CoasterAudio = CoasterAudio;
})(window);
