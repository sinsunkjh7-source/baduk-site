/**
 * Curling Audio Engine (Pure Web Audio API - Zero External Dependencies)
 */
(function(window) {
  'use strict';

  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var isMuted = false;

  function getCtx() {
    if (!ctx && AudioContext) {
      ctx = new AudioContext();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(function() {});
    }
    return ctx;
  }

  var CurlingAudio = {
    setMuted: function(muted) {
      isMuted = !!muted;
    },

    isMuted: function() {
      return isMuted;
    },

    // 1. Ice Gliding Swoosh (Stone slide)
    playSlide: function() {
      if (isMuted) return;
      var c = getCtx();
      if (!c) return;

      var t = c.currentTime;
      var node = c.createBufferSource();
      var buffer = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < buffer.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.15));
      }
      node.buffer = buffer;

      var filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);
      filter.frequency.exponentialRampToValueAtTime(180, t + 0.38);

      var gain = c.createGain();
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      node.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);

      node.start(t);
    },

    // 2. Sweeping Brush (슥삭슥삭)
    playSweep: function() {
      if (isMuted) return;
      var c = getCtx();
      if (!c) return;

      var t = c.currentTime;
      var node = c.createBufferSource();
      var buffer = c.createBuffer(1, c.sampleRate * 0.09, c.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < buffer.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / buffer.length);
      }
      node.buffer = buffer;

      var filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(2.5, t);

      var gain = c.createGain();
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.08);

      node.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);

      node.start(t);
    },

    // 3. Granite Stone Hit (묵직한 화강암 '탁/쿵!')
    playHit: function(volumeRatio) {
      if (isMuted) return;
      var c = getCtx();
      if (!c) return;

      var vol = Math.min(Math.max(volumeRatio || 0.5, 0.15), 1.0);
      var t = c.currentTime;

      // Low frequency body thud
      var osc = c.createOscillator();
      var gainOsc = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

      gainOsc.gain.setValueAtTime(0.35 * vol, t);
      gainOsc.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gainOsc);
      gainOsc.connect(c.destination);

      osc.start(t);
      osc.stop(t + 0.13);

      // High frequency stone clack click
      var noise = c.createBufferSource();
      var buf = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < buf.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.01));
      }
      noise.buffer = buf;

      var filter = c.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, t);

      var gainNoise = c.createGain();
      gainNoise.gain.setValueAtTime(0.4 * vol, t);
      gainNoise.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      noise.connect(filter);
      filter.connect(gainNoise);
      gainNoise.connect(c.destination);

      noise.start(t);
    },

    // 4. Score Bell / Button entry chime
    playScore: function() {
      if (isMuted) return;
      var c = getCtx();
      if (!c) return;

      var notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach(function(freq, idx) {
        var t = c.currentTime + idx * 0.08;
        var osc = c.createOscillator();
        var gain = c.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(t);
        osc.stop(t + 0.36);
      });
    },

    // 5. Final Victory Fanfare
    playVictory: function() {
      if (isMuted) return;
      var c = getCtx();
      if (!c) return;

      var chords = [
        { f: 523.25, d: 0.15, wait: 0 },
        { f: 659.25, d: 0.15, wait: 0.14 },
        { f: 783.99, d: 0.18, wait: 0.28 },
        { f: 1046.50, d: 0.45, wait: 0.46 }
      ];

      chords.forEach(function(item) {
        var t = c.currentTime + item.wait;
        var osc = c.createOscillator();
        var gain = c.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, t);

        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + item.d);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(t);
        osc.stop(t + item.d + 0.05);
      });
    },

    // 6. Defeat Tone
    playDefeat: function() {
      if (isMuted) return;
      var c = getCtx();
      if (!c) return;

      var notes = [392.0, 369.99, 349.23, 311.13];
      notes.forEach(function(freq, idx) {
        var t = c.currentTime + idx * 0.18;
        var osc = c.createOscillator();
        var gain = c.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(t);
        osc.stop(t + 0.32);
      });
    }
  };

  window.CurlingAudio = CurlingAudio;
})(window);
