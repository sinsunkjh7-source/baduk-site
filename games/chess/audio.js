/**
 * Web Audio API based sound synthesizer for Chess
 * Zero external audio files needed - ultra-fast & works offline
 */
(function(window) {
  'use strict';

  var audioCtx = null;
  var isMuted = false;

  function getAudioContext() {
    if (!audioCtx) {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  var ChessAudio = {
    setMuted: function(muted) {
      isMuted = !!muted;
    },
    isMuted: function() {
      return isMuted;
    },

    // 1. 일반 이동음 (경쾌한 나무 체스말 착점 소리)
    playMove: function() {
      if (isMuted) return;
      var ctx = getAudioContext();
      if (!ctx) return;

      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    },

    // 2. 기물 따내기(Capture) 소리 (딱! 하는 타격감)
    playCapture: function() {
      if (isMuted) return;
      var ctx = getAudioContext();
      if (!ctx) return;

      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    },

    // 3. 체크(Check) 경고음 (긴장감 있는 벨 소리)
    playCheck: function() {
      if (isMuted) return;
      var ctx = getAudioContext();
      if (!ctx) return;

      var now = ctx.currentTime;
      [587.33, 880].forEach(function(freq, idx) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.35, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    },

    // 4. 캐슬링(Castling) 소리 (두 번 빠르게 슬라이드)
    playCastle: function() {
      if (isMuted) return;
      var self = this;
      self.playMove();
      setTimeout(function() {
        self.playMove();
      }, 110);
    },

    // 5. 프로모션(Promotion) 팡파레 소리
    playPromote: function() {
      if (isMuted) return;
      var ctx = getAudioContext();
      if (!ctx) return;

      var now = ctx.currentTime;
      var notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach(function(freq, idx) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.3, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.25);
      });
    },

    // 6. 승리 팡파레 (Victory)
    playVictory: function() {
      if (isMuted) return;
      var ctx = getAudioContext();
      if (!ctx) return;

      var now = ctx.currentTime;
      var chords = [
        { f: 523.25, t: 0.00 }, // C5
        { f: 659.25, t: 0.12 }, // E5
        { f: 783.99, t: 0.24 }, // G5
        { f: 1046.50, t: 0.38 } // C6 (길게)
      ];

      chords.forEach(function(item) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(item.f, now + item.t);

        var duration = (item.t >= 0.38) ? 0.8 : 0.25;
        gain.gain.setValueAtTime(0.35, now + item.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + item.t + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + item.t);
        osc.stop(now + item.t + duration);
      });
    },

    // 7. 패배음 (Defeat)
    playDefeat: function() {
      if (isMuted) return;
      var ctx = getAudioContext();
      if (!ctx) return;

      var now = ctx.currentTime;
      var notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4
      notes.forEach(function(freq, idx) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);

        gain.gain.setValueAtTime(0.25, now + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.3);
      });
    }
  };

  window.ChessAudio = ChessAudio;
})(window);
