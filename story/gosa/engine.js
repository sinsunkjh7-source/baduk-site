/**
 * PaperTheaterEngine (종이 극장 표준 엔진)
 * ===============================================
 * JH 바둑스쿨 종이 극장 표준 모션그래픽 런타임 프레임워크
 *
 * [주요 기능]
 * 1. 데이터 주도형 아키텍처: 스토리 데이터(배경, 레이어, 대사, 모션 파라미터)만 주입하면 자동 렌더링
 * 2. 16:9 무방해 시네마틱 스테이지: 텍스트나 조작계가 아트를 가리지 않고 하단 독에 통합
 * 3. 다층 Z-깊이 모션 엔진: Depth 0(Sky) ~ Depth 5(Curtains) 분리 제어 및 물리/자연 진동(브리딩)
 * 4. 정밀 타임라인 동기화: 재생/일시정지/탐색(시크)/처음부터, Web Speech API 음성 내레이션 싱크
 * 5. 모바일/저사양 PC 최적화: requestAnimationFrame + GPU 가속 translate3d/scale 만 사용
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
    this.duration = (this.story && this.story.duration) || 48.0;
    this.scenes = (this.story && this.story.scenes) || [];
    this.onEnded = options.onEnded || null;

    this.elapsed = 0;
    this.playing = options.autoPlay !== undefined ? options.autoPlay : true;
    this.voiceEnabled = options.voiceEnabled !== undefined ? options.voiceEnabled : true;
    this.playbackRate = options.playbackRate || 1.0;

    this.lastTime = performance.now();
    this.currentSceneIdx = -1;
    this.koVoice = null;
    this.animFrameId = null;

    // DOM References
    this.dom = {};

    this._initVoices();
    this._buildDOM();
    this._bindEvents();
    this.seek(0);

    if (this.playing) {
      this._startLoop();
    }
  }

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

    var html = '' +
      '<div class="pt-standard-player">' +
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

    // 씬 및 레이어 동적 생성
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

    // 전역 파티클 및 프레임 레이어
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

        '<!-- 학습 카드: 한자 훈음 + 바둑 속 지혜 + 미니 퀴즈 -->' +
        (s.study ? this._buildStudyHTML(s.study) : '') +
      '</div>';

    this.container.innerHTML = html;

    // Cache refs
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
    var s = Math.min(Math.floor(sec), Math.floor(this.duration));
    return '00:' + (s < 10 ? '0' + s : String(s));
  };

  PaperTheaterEngine.prototype.stopNarration = function () {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
  };

  PaperTheaterEngine.prototype.speakLine = function (text) {
    if (!this.voiceEnabled || !this.playing || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.rate = 0.96;
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
    if (this.currentSceneIdx >= 0 && this.scenes[this.currentSceneIdx]) {
      this.speakLine(this.scenes[this.currentSceneIdx].subtitle);
    }
    this._startLoop();
  };

  PaperTheaterEngine.prototype.pause = function () {
    this.playing = false;
    if (this.dom.btnPlay) {
      this.dom.btnPlay.textContent = '▶️ 재생';
    }
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
      this.stopNarration();
    } else if (this.playing && this.currentSceneIdx >= 0 && this.scenes[this.currentSceneIdx]) {
      this.speakLine(this.scenes[this.currentSceneIdx].subtitle);
    }
  };

  PaperTheaterEngine.prototype.replay = function () {
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

    // 씬 찾기
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
        this.speakLine(activeScene.subtitle);
      }
    }

    // 씬별 커스텀 애니메이션 훅 실행 (선언적 정의 또는 함수형 훅 지원)
    if (activeScene && typeof activeScene.animate === 'function') {
      var sceneLocalTime = t - activeScene.start;
      var sceneProgress = Math.min(1, Math.max(0, sceneLocalTime / (activeScene.end - activeScene.start)));
      var slideEl = this.dom.slides[sceneIdx];
      activeScene.animate(slideEl, sceneProgress, sceneLocalTime, t, this.playing);
    }

    // 파티클/특수 상태
    if (this.dom.particles && activeScene && activeScene.particlesClass) {
      this.dom.particles.className = 'pt-depth-layer layer-particles ' + activeScene.particlesClass;
    }
  };

  PaperTheaterEngine.prototype.destroy = function () {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.stopNarration();
    this.container.innerHTML = '';
  };

  global.PaperTheaterEngine = PaperTheaterEngine;
})(window);
