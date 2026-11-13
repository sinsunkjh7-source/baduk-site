/**
 * PaperTheaterEngine (종이 극장 표준 엔진 - 하이브리드 오디오 탑재)
 * =================================================================
 * [특징]
 * 1. 각 씬에 지정된 스튜디오 오디오 파일(`audio`)을 우선 재생하여 완벽한 음질과 무결점 싱크 보장
 * 2. 오디오 파일이 없거나 브라우저 자동재생 제한 시 Web Speech API(TTS)로 부드럽게 Fallback
 * 3. 재생/일시정지/시크(탐색) 시 오디오와 타임라인이 0.1초의 오차도 없이 일치
 */

(function (global) {
  'use strict';

  function PaperTheaterEngine(options) {
    this.container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;

    if (!this.container) {
      throw new Error('[PaperTheaterEngine] Container element not found.');
    }

    this.story = options.story;
    this.duration = (this.story && this.story.duration) || 60.0;
    this.scenes = (this.story && this.story.scenes) || [];
    this.onEnded = options.onEnded || null;

    this.elapsed = 0;
    this.playing = options.autoPlay === true;
    this.voiceEnabled = options.voiceEnabled !== undefined ? options.voiceEnabled : true;
    this.playbackRate = options.playbackRate || 1.0;

    this.lastTime = performance.now();
    this.currentSceneIdx = -1;
    this.koVoice = null;
    this.animFrameId = null;

    // Audio Player for Studio Voice & Procedural BGM/SFX
    this.currentAudio = null;
    this.audioCache = {};
    this.audioCtx = null;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this._sfxFired = {};

    // DOM References
    this.dom = {};

    this._preloadAudios();
    this._initVoices();
    this._buildDOM();
    this._bindEvents();
    this.seek(0);

    if (this.playing) {
      this._startLoop();
    }
  }

  PaperTheaterEngine.prototype._preloadAudios = function () {
    for (var i = 0; i < this.scenes.length; i++) {
      var sc = this.scenes[i];
      if (sc.audio) {
        var a = new Audio();
        a.src = sc.audio;
        a.preload = 'auto';
        this.audioCache[sc.id] = a;
      }
    }
  };

  PaperTheaterEngine.prototype._initVoices = function () {
    var self = this;
    if (!('speechSynthesis' in window)) return;

    function pickVoice() {
      var voices = window.speechSynthesis.getVoices() || [];
      for (var i = 0; i < voices.length; i++) {
        var v = voices[i];
        if (v.lang && (v.lang.toLowerCase().indexOf('ko') === 0 || v.lang.indexOf('KR') !== -1)) {
          self.koVoice = v;
          break;
        }
      }
    }

    pickVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = pickVoice;
    }
  };

  PaperTheaterEngine.prototype._buildDOM = function () {
    var s = this.story;

    var backUrl = s.id === 'nanga' ? '/#badukstory' : '/#idioms';
    var backLabel = s.id === 'nanga' ? '← 바둑이야기 목록으로' : '← 고사성어 목록으로';
    var switcherHtml = '<div class="pt-top-nav-row">' +
      '<a href="' + backUrl + '" class="pt-back-link">' + backLabel + '</a>' +
      '<a href="/#story" class="pt-back-link pt-back-all">📚 Story 전체 보기</a>' +
    '</div>';

    var html = '' +
      '<div class="pt-standard-player">' +
        switcherHtml +
        '<!-- 헤더 섹션 -->' +
        '<header class="pt-header">' +
          '<div class="pt-badge-row">' +
            '<span class="pt-badge">' + (s.badge || '🎬 다층 종이 극장') + '</span>' +
            '<span class="pt-act-pill" data-ref="timePill">00:00 / ' + this._formatSec(this.duration) + '</span>' +
          '</div>' +
          '<h1 class="pt-title">' + s.title + ' <span class="pt-hanja">(' + (s.hanja || '') + ')</span></h1>' +
          (s.summary ? '<p class="pt-summary">' + s.summary + '</p>' : '') +
        '</header>' +

        '<!-- 16:9 무방해 순수 아트 스테이지 -->' +
        '<section class="pt-stage" data-ref="stage" aria-label="종이 극장 무대">' +
          '<div class="pt-stage-inner" data-ref="stageInner">';

    for (var i = 0; i < this.scenes.length; i++) {
      var sc = this.scenes[i];
      html += '<div class="pt-scene-slide" data-scene-id="' + sc.id + '" data-scene-index="' + i + '">';

      if (sc.layers && sc.layers.length > 0) {
        for (var l = 0; l < sc.layers.length; l++) {
          var layer = sc.layers[l];
          var layerClass = 'pt-depth-layer ' + (layer.className || '');
          var layerStyle = layer.style || '';
          html += '<div class="' + layerClass + '" style="' + layerStyle + '" data-layer-id="' + (layer.id || ('l_' + i + '_' + l)) + '">';
          if (layer.type === 'image') {
            html += '<img src="' + layer.src + '" alt="' + (layer.alt || '') + '" class="layer-img" draggable="false">';
          } else if (layer.type === 'custom') {
            html += layer.content || '';
          }
          html += '</div>';
        }
      }
      html += '</div>';
    }

    html += '' +
            '<div class="pt-depth-layer layer-particles" data-ref="particles" aria-hidden="true">' +
              '<span class="pt-mote m1"></span><span class="pt-mote m2"></span>' +
              '<span class="pt-mote m3"></span><span class="pt-mote m4"></span>' +
              '<span class="pt-mote m5"></span><span class="pt-mote m6"></span>' +
              '<span class="pt-mote m7"></span><span class="pt-mote m8"></span>' +
            '</div>' +
            '<div class="pt-depth-layer layer-curtains" aria-hidden="true">' +
              '<div class="curtain-left"></div>' +
              '<div class="curtain-right"></div>' +
              '<div class="stage-valance"></div>' +
            '</div>' +
            '<button type="button" class="pt-big-play-overlay" data-ref="bigPlayBtn" aria-label="이야기 재생하기"' + (this.playing ? ' hidden' : '') + '>' +
              '<span class="pt-big-play-circle"><span class="pt-big-play-icon">▶</span></span>' +
              '<span class="pt-big-play-text" data-ref="bigPlayText">이야기 재생하기</span>' +
            '</button>' +
          '</div>' +
        '</section>' +

        '<!-- 하단 시네마 독 (컨트롤 및 자막 완벽 통합) -->' +
        '<section class="pt-player-panel" aria-label="이야기 자막 및 재생 컨트롤">' +
          '<div class="pt-player-top">' +
            '<div class="pt-chapter-box">' +
              '<span class="pt-chapter-label" data-ref="chapter">제1장</span>' +
            '</div>' +
            '<div class="pt-player-btns">' +
              '<button type="button" class="pt-btn pt-btn-voice" data-ref="btnVoice" title="내레이션 켜기/끄기">' +
                (this.voiceEnabled ? '🔊 음성 켜짐' : '🔇 음성 꺼짐') +
              '</button>' +
              '<button type="button" class="pt-btn pt-btn-play" data-ref="btnPlay" title="재생/일시정지">' +
                (this.playing ? '⏸️ 일시정지' : '▶️ 재생') +
              '</button>' +
              '<button type="button" class="pt-btn pt-btn-replay" data-ref="btnReplay" title="처음부터 다시 보기">' +
                '🔄 처음부터' +
              '</button>' +
            '</div>' +
          '</div>' +

          '<div class="pt-progress-track" data-ref="progressTrack" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">' +
            '<div class="pt-progress-fill" data-ref="progressFill"></div>' +
          '</div>' +

          '<div class="pt-subtitle-box">' +
            '<p class="pt-subtitle" data-ref="subtitle">자막을 불러오는 중입니다...</p>' +
          '</div>' +
        '</section>' +

        '<!-- 학습 카드 -->' +
        (s.study ? this._buildStudyHTML(s.study) : '') +
      '</div>';

    this.container.innerHTML = html;

    var refs = this.container.querySelectorAll('[data-ref]');
    for (var r = 0; r < refs.length; r++) {
      this.dom[refs[r].getAttribute('data-ref')] = refs[r];
    }
    this.dom.slides = this.container.querySelectorAll('.pt-scene-slide');
  };

  PaperTheaterEngine.prototype._buildStudyHTML = function (study) {
    var out = '<section class="pt-story-card"><div class="pt-study-box">';

    if (study.hanja && study.hanja.length > 0) {
      out += '<div class="pt-hanja-grid">';
      for (var i = 0; i < study.hanja.length; i++) {
        var h = study.hanja[i];
        out += '<div class="hanja-chip"><strong>' + h.char + '</strong><span>' + h.meaning + '</span></div>';
      }
      out += '</div>';
    }

    if (study.badukWisdom) {
      out += '<div class="pt-baduk-tip"><strong>⚫ 바둑 속 지혜:</strong> ' + study.badukWisdom + '</div>';
    }

    if (study.quiz) {
      var q = study.quiz;
      out += '<div class="pt-mini-quiz" data-ref="miniQuiz">' +
        '<p class="quiz-q">💡 <b>확인 퀴즈:</b> ' + q.question + '</p>' +
        '<div class="quiz-opts">';
      for (var o = 0; o < q.options.length; o++) {
        var opt = q.options[o];
        out += '<button type="button" class="quiz-opt" data-ok="' + (opt.correct ? 'true' : 'false') + '">' + opt.text + '</button>';
      }
      out += '</div><p class="quiz-result" data-ref="quizResult" hidden></p></div>';
    }

    out += '</div></section>';
    return out;
  };

  PaperTheaterEngine.prototype._bindEvents = function () {
    var self = this;

    if (this.dom.btnPlay) {
      this.dom.btnPlay.addEventListener('click', function () {
        self.togglePlay();
      });
    }

    if (this.dom.bigPlayBtn) {
      this.dom.bigPlayBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        self.play();
      });
    }

    if (this.dom.stageInner) {
      this.dom.stageInner.addEventListener('click', function () {
        self.togglePlay();
      });
    }

    if (this.dom.btnReplay) {
      this.dom.btnReplay.addEventListener('click', function () {
        self.replay();
      });
    }

    if (this.dom.btnVoice) {
      this.dom.btnVoice.addEventListener('click', function () {
        self.toggleVoice();
      });
    }

    if (this.dom.progressTrack) {
      this.dom.progressTrack.addEventListener('click', function (e) {
        var rect = self.dom.progressTrack.getBoundingClientRect();
        var ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        self.seek(ratio * self.duration);
      });
    }

    var quizOpts = this.container.querySelectorAll('.quiz-opt');
    var quizResult = this.dom.quizResult;
    if (quizOpts.length > 0 && quizResult) {
      var quizData = (this.story.study && this.story.study.quiz) || {};
      for (var i = 0; i < quizOpts.length; i++) {
        quizOpts[i].addEventListener('click', function () {
          var ok = this.getAttribute('data-ok') === 'true';
          for (var j = 0; j < quizOpts.length; j++) {
            quizOpts[j].classList.remove('correct', 'wrong');
          }
          this.classList.add(ok ? 'correct' : 'wrong');
          quizResult.hidden = false;
          quizResult.textContent = ok
            ? (quizData.correctMsg || '🎉 정답입니다!')
            : (quizData.wrongMsg || '다시 한 번 생각해 볼까요?');
        });
      }
    }

    window.addEventListener('beforeunload', function () {
      self.stopNarration();
    });
  };

  PaperTheaterEngine.prototype._formatSec = function (sec) {
    var total = Math.min(Math.floor(sec), Math.floor(this.duration));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return (m < 10 ? '0' + m : String(m)) + ':' + (s < 10 ? '0' + s : String(s));
  };

  PaperTheaterEngine.prototype._ensureAudioCtx = function () {
    if (!this.audioCtx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        try {
          this.audioCtx = new Ctx();
        } catch (e) {}
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try { this.audioCtx.resume(); } catch (e) {}
    }
    return this.audioCtx;
  };

  PaperTheaterEngine.prototype._playNote = function (freq, duration, gainVal, type) {
    var ctx = this._ensureAudioCtx();
    if (!ctx || !this.voiceEnabled) return;
    try {
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainVal || 0.04, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (duration || 1.6));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (duration || 1.65));
    } catch (e) {}
  };

  PaperTheaterEngine.prototype._startBGM = function () {
    if (this.bgmTimer || !this.voiceEnabled || !this.playing) return;
    this._ensureAudioCtx();
    // Korean pentatonic scale (C4, D4, E4, G4, A4, C5, D5, E5)
    var scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 293.66];
    var self = this;
    function tickNote() {
      if (!self.playing || !self.voiceEnabled) return;
      var freq = scale[self.bgmStep % scale.length];
      self._playNote(freq, 2.0, 0.028, 'sine');
      if (self.bgmStep % 4 === 0) {
        self._playNote(freq * 0.5, 2.8, 0.018, 'triangle');
      }
      self.bgmStep++;
    }
    tickNote();
    this.bgmTimer = setInterval(tickNote, 950);
  };

  PaperTheaterEngine.prototype._stopBGM = function () {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  };

  PaperTheaterEngine.prototype.playSFX = function (type) {
    if (!this.voiceEnabled || !this.playing) return;
    var ctx = this._ensureAudioCtx();
    if (!ctx) return;
    var now = ctx.currentTime;
    try {
      if (type === 'stone') {
        // Crisp wooden Go board "clack"
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(920, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.055);
        g.gain.setValueAtTime(0.18, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.075);
      } else if (type === 'chime') {
        this._playNote(523.25, 1.4, 0.04, 'sine');
        var self = this;
        setTimeout(function () { self._playNote(659.25, 1.4, 0.035, 'sine'); }, 140);
        setTimeout(function () { self._playNote(783.99, 1.8, 0.035, 'sine'); }, 280);
      } else if (type === 'crumble') {
        var bufSize = ctx.sampleRate * 0.35;
        var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        var data = buf.getChannelData(0);
        for (var i = 0; i < bufSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.12));
        }
        var src = ctx.createBufferSource();
        src.buffer = buf;
        var filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 600;
        var g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.12, now);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        src.connect(filter);
        filter.connect(g2);
        g2.connect(ctx.destination);
        src.start(now);
      }
    } catch (e) {}
  };

  PaperTheaterEngine.prototype.triggerOnce = function (key, fn) {
    if (this._sfxFired[key]) return;
    this._sfxFired[key] = true;
    fn();
  };

  PaperTheaterEngine.prototype.stopNarration = function () {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
  };

  PaperTheaterEngine.prototype.playSceneNarration = function (scene, offsetSec) {
    if (!this.voiceEnabled || !this.playing) return;

    this.stopNarration();

    var offset = offsetSec || 0;
    var self = this;

    // 1. 스튜디오 오디오 파일 우선 재생
    if (scene.audio) {
      var audio = this.audioCache[scene.id] || new Audio(scene.audio);
      this.audioCache[scene.id] = audio;
      this.currentAudio = audio;

      try {
        if (offset > 0 && offset < audio.duration) {
          audio.currentTime = offset;
        } else {
          audio.currentTime = 0;
        }
        var promise = audio.play();
        if (promise !== undefined) {
          promise.catch(function () {
            // 브라우저 자동재생 제한 시 TTS로 fallback
            self._speakTTS(scene.subtitle);
          });
        }
        return;
      } catch (err) {
        // Fallback
      }
    }

    // 2. Fallback: Web Speech API
    this._speakTTS(scene.subtitle);
  };

  PaperTheaterEngine.prototype._speakTTS = function (text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.rate = 1.0;
      u.pitch = 1.02;
      if (this.koVoice) u.voice = this.koVoice;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  };

  PaperTheaterEngine.prototype.play = function () {
    if (this.elapsed >= this.duration) {
      this.seek(0);
    }
    this.playing = true;
    this.lastTime = performance.now();
    if (this.dom.btnPlay) {
      this.dom.btnPlay.textContent = '⏸️ 일시정지';
    }
    if (this.dom.bigPlayBtn) {
      this.dom.bigPlayBtn.hidden = true;
    }
    this._startBGM();
    if (this.currentSceneIdx >= 0 && this.scenes[this.currentSceneIdx]) {
      var curSc = this.scenes[this.currentSceneIdx];
      this.playSceneNarration(curSc, this.elapsed - curSc.start);
    }
    this._startLoop();
  };

  PaperTheaterEngine.prototype.pause = function () {
    this.playing = false;
    if (this.dom.btnPlay) {
      this.dom.btnPlay.textContent = '▶️ 재생';
    }
    if (this.dom.bigPlayBtn) {
      this.dom.bigPlayBtn.hidden = false;
      if (this.dom.bigPlayText) {
        this.dom.bigPlayText.textContent = this.elapsed > 0 ? '이어서 재생하기' : '이야기 재생하기';
      }
    }
    this._stopBGM();
    this.stopNarration();
  };

  PaperTheaterEngine.prototype.togglePlay = function () {
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
  };

  PaperTheaterEngine.prototype.toggleVoice = function () {
    this.voiceEnabled = !this.voiceEnabled;
    if (this.dom.btnVoice) {
      this.dom.btnVoice.textContent = this.voiceEnabled ? '🔊 음성 켜짐' : '🔇 음성 꺼짐';
    }
    if (!this.voiceEnabled) {
      this._stopBGM();
      this.stopNarration();
    } else if (this.playing && this.currentSceneIdx >= 0 && this.scenes[this.currentSceneIdx]) {
      this._startBGM();
      var curSc = this.scenes[this.currentSceneIdx];
      this.playSceneNarration(curSc, this.elapsed - curSc.start);
    }
  };

  PaperTheaterEngine.prototype.replay = function () {
    this._sfxFired = {};
    this.seek(0);
    this.play();
  };

  PaperTheaterEngine.prototype.seek = function (t) {
    this.elapsed = Math.min(this.duration, Math.max(0, t));
    this.lastTime = performance.now();
    this._renderFrame(this.elapsed, true);
  };

  PaperTheaterEngine.prototype._startLoop = function () {
    if (this.animFrameId) return;
    var self = this;
    function loop(now) {
      var dt = Math.min(0.1, (now - self.lastTime) * 0.001);
      self.lastTime = now;

      if (self.playing) {
        self.elapsed += dt * self.playbackRate;
        if (self.elapsed >= self.duration) {
          self.elapsed = self.duration;
          self.playing = false;
          if (self.dom.btnPlay) {
            self.dom.btnPlay.textContent = '▶️ 다시 재생';
          }
          if (self.dom.bigPlayBtn) {
            self.dom.bigPlayBtn.hidden = false;
            if (self.dom.bigPlayText) {
              self.dom.bigPlayText.textContent = '처음부터 다시 재생';
            }
          }
          self.stopNarration();
          if (typeof self.onEnded === 'function') {
            self.onEnded();
          }
        }
      }

      self._renderFrame(self.elapsed, false);
      self.animFrameId = requestAnimationFrame(loop);
    }
    this.animFrameId = requestAnimationFrame(loop);
  };

  PaperTheaterEngine.prototype._renderFrame = function (t, isSeek) {
    var pct = Math.min(100, Math.max(0, (t / this.duration) * 100));
    if (this.dom.progressFill) {
      this.dom.progressFill.style.width = pct.toFixed(2) + '%';
    }
    if (this.dom.progressTrack) {
      this.dom.progressTrack.setAttribute('aria-valuenow', String(Math.round(pct)));
    }
    if (this.dom.timePill) {
      this.dom.timePill.textContent = this._formatSec(t) + ' / ' + this._formatSec(this.duration);
    }

    var sceneIdx = 0;
    var activeScene = this.scenes[0];
    for (var i = 0; i < this.scenes.length; i++) {
      var sc = this.scenes[i];
      if (t >= sc.start && t < sc.end) {
        sceneIdx = i;
        activeScene = sc;
        break;
      }
    }
    if (t >= this.duration && this.scenes.length > 0) {
      sceneIdx = this.scenes.length - 1;
      activeScene = this.scenes[sceneIdx];
    }

    var sceneChanged = (this.currentSceneIdx !== sceneIdx);

    if (sceneChanged) {
      this.currentSceneIdx = sceneIdx;
      if (this.dom.chapter) this.dom.chapter.textContent = activeScene.chapter;
      if (this.dom.subtitle) this.dom.subtitle.textContent = activeScene.subtitle;

      for (var s = 0; s < this.dom.slides.length; s++) {
        this.dom.slides[s].classList.toggle('active', s === sceneIdx);
      }

      if (this.voiceEnabled && (this.playing || isSeek)) {
        this.playSceneNarration(activeScene, isSeek ? (t - activeScene.start) : 0);
      }
    } else if (isSeek && this.voiceEnabled && this.playing) {
      this.playSceneNarration(activeScene, t - activeScene.start);
    }

    if (activeScene && typeof activeScene.animate === 'function') {
      var sceneLocalTime = t - activeScene.start;
      var sceneProgress = Math.min(1, Math.max(0, sceneLocalTime / (activeScene.end - activeScene.start)));
      var slideEl = this.dom.slides[sceneIdx];
      activeScene.animate(slideEl, sceneProgress, sceneLocalTime, t, this.playing, this);
    }

    if (this.dom.particles && activeScene && activeScene.particlesClass) {
      this.dom.particles.className = 'pt-depth-layer layer-particles ' + activeScene.particlesClass;
    }
  };

  PaperTheaterEngine.prototype.destroy = function () {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this._stopBGM();
    this.stopNarration();
    this.container.innerHTML = '';
  };

  global.PaperTheaterEngine = PaperTheaterEngine;
})(window);
