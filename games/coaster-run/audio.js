/**
 * audio.js - 롤러코스터 사운드 & 바둑 타격음 Web Audio 엔진
 * 리프트 체인 소리, 바람 질주음, 급제동 끼익, 부스터 폭발, 바둑 착수음
 */
(function(window) {
  'use strict';

  let audioCtx = null;
  let isSoundEnabled = true;

  function getCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // 바람 지속음용 노이즈 노드 참조
  let windSource = null;
  let windGain = null;
  let windFilter = null;
  let liftTimer = null;

  const CoasterAudio = {
    isEnabled: () => isSoundEnabled,
    toggleSound: () => {
      isSoundEnabled = !isSoundEnabled;
      if (!isSoundEnabled) CoasterAudio.stopWind();
      return isSoundEnabled;
    },

    // 1. 리프트 체인 등반 소리 (카르륵... 카르륵... 금속 래칫)
    startLiftHill: () => {
      if (!isSoundEnabled) return;
      CoasterAudio.stopLiftHill();

      const click = () => {
        const ctx = getCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      };

      click();
      liftTimer = setInterval(click, 180);
    },

    stopLiftHill: () => {
      if (liftTimer) {
        clearInterval(liftTimer);
        liftTimer = null;
      }
    },

    // 2. 고속 질주 바람 소리 (속도에 따른 다이내믹 화이트 노이즈)
    startWind: () => {
      if (!isSoundEnabled) return;
      const ctx = getCtx();
      if (!ctx || windSource) return;

      // 2초 화이트 노이즈 버퍼 생성 후 루프
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
      windFilter.type = 'lowpass';
      windFilter.frequency.setValueAtTime(400, ctx.currentTime);

      windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.01, ctx.currentTime);

      windSource.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(ctx.destination);
      windSource.start();
    },

    setWindSpeed: (speedRatio) => { // 0.0 ~ 1.0
      if (!windGain || !windFilter) return;
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      const targetGain = Math.min(Math.max(speedRatio * 0.45, 0.01), 0.5);
      const targetFreq = 300 + speedRatio * 1800; // 300Hz ~ 2100Hz

      windGain.gain.setTargetAtTime(targetGain, now, 0.1);
      windFilter.frequency.setTargetAtTime(targetFreq, now, 0.1);
    },

    stopWind: () => {
      if (windSource) {
        try { windSource.stop(); } catch(e){}
        windSource = null;
        windGain = null;
        windFilter = null;
      }
    },

    // 3. 비상 브레이크 끼이익-! 소리
    playBrakeScreech: () => {
      if (!isSoundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.35);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    },

    // 4. 로켓 부스터 점화 & 게이트 파괴 폭발 (정답 시 폭풍 질주)
    playBoosterLaunch: () => {
      if (!isSoundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 묵직한 폭발음
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      // 상승 로켓 굉음
      const rocket = ctx.createOscillator();
      const rGain = ctx.createGain();
      rocket.type = 'sawtooth';
      rocket.frequency.setValueAtTime(220, now + 0.05);
      rocket.frequency.exponentialRampToValueAtTime(880, now + 0.5);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now + 0.05);
      filter.frequency.linearRampToValueAtTime(2200, now + 0.5);

      rGain.gain.setValueAtTime(0.35, now + 0.05);
      rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      rocket.connect(filter);
      filter.connect(rGain);
      rGain.connect(ctx.destination);
      rocket.start(now + 0.05);
      rocket.stop(now + 0.55);
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
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.07);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    },

    // 6. 오답 경보 & 스파크 찌릿
    playWrongAlarm: () => {
      if (!isSoundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(140, now + 0.1);
      osc.frequency.setValueAtTime(100, now + 0.2);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    },

    // 7. 골인 승리 팡파르
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

        gain.gain.setValueAtTime(0.35, t);
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
