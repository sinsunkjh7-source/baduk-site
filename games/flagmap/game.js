/**
 * World Flag & Map Quiz (세계 국기 & 지도 탐험) - Game Engine & Controller
 */
(function() {
  'use strict';

  var DATA = window.FLAGMAP_DATA || {};
  var CAPITALS = window.FLAGMAP_CAPITALS || {};
  var BBOXES = window.MAP_BBOXES || {};
  var audio = window.FlagAudio;

  // 30 Most Recognizable / Popular Countries for Beginners
  var POPULAR_CODES = [
    'kr', 'us', 'jp', 'cn', 'gb', 'fr', 'de', 'ca', 'br', 'it',
    'es', 'au', 'ru', 'in', 'vn', 'th', 'eg', 'ar', 'mx', 'ch',
    'nl', 'se', 'gr', 'tr', 'za', 'nz', 'ph', 'id', 'sg', 'kp'
  ];

  // Lookup dictionaries
  var countryMap = {};
  var allCountries = [];
  var scopePools = {
    popular: [],
    asia: [],
    europe: [],
    america: [],
    africa: [],
    oceania: [],
    world: []
  };

  var rawSvgText = null;

  // Build Country Database
  function initDatabase() {
    var contKeys = Object.keys(DATA);
    for (var cIdx = 0; cIdx < contKeys.length; cIdx++) {
      var contKey = contKeys[cIdx];
      var contObj = DATA[contKey];
      var contName = contObj.name;
      var list = contObj.list;

      for (var i = 0; i < list.length; i++) {
        var iso = list[i][0];
        var name = list[i][1];
        var capData = CAPITALS[iso] || ['정보 없음', '🏛️', ''];
        var item = {
          iso: iso,
          name: name,
          continent: contName,
          contKey: contKey,
          capital: capData[0],
          landmarkIcon: capData[1] || '🏛️',
          landmarkName: capData[2] || ''
        };

        countryMap[iso] = item;
        allCountries.push(item);
        if (scopePools[contKey]) {
          scopePools[contKey].push(item);
        }
      }
    }

    scopePools.world = allCountries.slice();

    for (var p = 0; p < POPULAR_CODES.length; p++) {
      var pIso = POPULAR_CODES[p];
      if (countryMap[pIso]) {
        scopePools.popular.push(countryMap[pIso]);
      }
    }
  }

  // State Variables
  var state = {
    mode: 'flag-to-country', // 'flag-to-country' | 'country-to-flag' | 'capital-quiz' | 'encyclopedia'
    scope: 'popular',
    qTotal: 10,
    timerLimit: 10,
    showMap: true,
    mapZoomed: true,
    currentZoomFactor: 1.0,
    currentCenter: { x: 505, y: 333 },
    currentBaseBox: [0, 0, 1010, 666],
    isPlaying: false,
    isPaused: false,
    questions: [],
    currentIndex: 0,
    currentQuestion: null,
    score: 0,
    combo: 0,
    maxCombo: 0,
    correctCount: 0,
    wrongCount: 0,
    wrongList: [],
    lifeline5050Count: 2,
    hintUsed: false,
    timerInterval: null,
    timeRemaining: 0,
    isLocked: false
  };

  // DOM Elements
  var dom = {};

  function cacheDom() {
    // Screen Sections
    dom.lobbyView = document.getElementById('lobbyView');
    dom.inGameWrapper = document.getElementById('inGameWrapper');
    dom.encyclopediaView = document.getElementById('encyclopediaView');

    // Lobby Elements
    dom.lobbyModeGrid = document.getElementById('lobbyModeGrid');
    dom.lobbyScopeChips = document.getElementById('lobbyScopeChips');
    dom.lobbyScopeSection = document.getElementById('lobbyScopeSection');
    dom.lobbyOptionsSection = document.getElementById('lobbyOptionsSection');
    dom.lobbySelectQCount = document.getElementById('lobbySelectQCount');
    dom.lobbySelectTimer = document.getElementById('lobbySelectTimer');
    dom.lobbyToggleMap = document.getElementById('lobbyToggleMap');
    dom.btnLaunchQuiz = document.getElementById('btnLaunchQuiz');

    // In-Game Top Header
    dom.btnHeaderReturnLobby = document.getElementById('btnHeaderReturnLobby');
    dom.currentModeLabel = document.getElementById('currentModeLabel');
    dom.statQuestion = document.getElementById('statQuestion');
    dom.statScore = document.getElementById('statScore');
    dom.statCombo = document.getElementById('statCombo');
    dom.statComboPill = document.getElementById('statComboPill');
    dom.btnPauseGame = document.getElementById('btnPauseGame');
    dom.btnSoundToggle = document.getElementById('btnSoundToggle');
    dom.soundIcon = document.getElementById('soundIcon');

    dom.timerBarWrap = document.getElementById('timerBarWrap');
    dom.timerBar = document.getElementById('timerBar');

    // In-Game Wide Grid
    dom.quizWideGrid = document.getElementById('quizWideGrid');
    dom.lifelineBar = document.getElementById('lifelineBar');
    dom.btnLifeline5050 = document.getElementById('btnLifeline5050');
    dom.count5050 = document.getElementById('count5050');
    dom.btnLifelineHint = document.getElementById('btnLifelineHint');
    dom.hintBubble = document.getElementById('hintBubble');
    dom.hintText = document.getElementById('hintText');

    dom.leftQuizBox = document.getElementById('leftQuizBox');
    dom.mainFlagImg = document.getElementById('mainFlagImg');
    dom.landmarkTag = document.getElementById('landmarkTag');
    dom.landmarkIcon = document.getElementById('landmarkIcon');
    dom.landmarkName = document.getElementById('landmarkName');
    dom.promptText = document.getElementById('promptText');
    dom.promptSub = document.getElementById('promptSub');
    dom.optionsGrid = document.getElementById('optionsGrid');
    dom.optBtns = document.querySelectorAll('.opt-btn');

    dom.countryToFlagCard = document.getElementById('countryToFlagCard');
    dom.c2fContinent = document.getElementById('c2fContinent');
    dom.c2fCountryName = document.getElementById('c2fCountryName');
    dom.c2fCapitalHint = document.getElementById('c2fCapitalHint');
    dom.flagOptionsGrid = document.getElementById('flagOptionsGrid');

    // Right Column: Huge World Map
    dom.quizRightPanel = document.getElementById('quizRightPanel');
    dom.largeMapWrap = document.getElementById('largeMapWrap');
    dom.mapRegionBadge = document.getElementById('mapRegionBadge');
    dom.btnZoomIn = document.getElementById('btnZoomIn');
    dom.btnZoomOut = document.getElementById('btnZoomOut');
    dom.btnToggleZoom = document.getElementById('btnToggleZoom');

    dom.answerFeedback = document.getElementById('answerFeedback');
    dom.fbIcon = document.getElementById('fbIcon');
    dom.fbText = document.getElementById('fbText');

    // Encyclopedia
    dom.btnEncyReturnLobby = document.getElementById('btnEncyReturnLobby');
    dom.encySearchInput = document.getElementById('encySearchInput');
    dom.encyTotalCount = document.getElementById('encyTotalCount');
    dom.encyScopeChips = document.getElementById('encyScopeChips');
    dom.encyGrid = document.getElementById('encyGrid');

    // Modals
    dom.pauseModal = document.getElementById('pauseModal');
    dom.btnResumeGame = document.getElementById('btnResumeGame');
    dom.btnRestartCurrent = document.getElementById('btnRestartCurrent');
    dom.btnPauseReturnLobby = document.getElementById('btnPauseReturnLobby');

    dom.countryDetailModal = document.getElementById('countryDetailModal');
    dom.detailFlagImg = document.getElementById('detailFlagImg');
    dom.detailCountryName = document.getElementById('detailCountryName');
    dom.detailContinent = document.getElementById('detailContinent');
    dom.detailCapital = document.getElementById('detailCapital');
    dom.detailLandmark = document.getElementById('detailLandmark');
    dom.detailIso = document.getElementById('detailIso');
    dom.detailMapWrap = document.getElementById('detailMapWrap');
    dom.btnCloseDetail = document.getElementById('btnCloseDetail');
    dom.btnCloseDetail2 = document.getElementById('btnCloseDetail2');
    dom.btnQuizFromDetail = document.getElementById('btnQuizFromDetail');

    dom.resultModal = document.getElementById('resultModal');
    dom.resultBadgeIcon = document.getElementById('resultBadgeIcon');
    dom.resultTitle = document.getElementById('resultTitle');
    dom.resultGradeDesc = document.getElementById('resultGradeDesc');
    dom.resultScore = document.getElementById('resultScore');
    dom.resultCorrectCount = document.getElementById('resultCorrectCount');
    dom.resultAccuracy = document.getElementById('resultAccuracy');
    dom.resultMaxCombo = document.getElementById('resultMaxCombo');
    dom.wrongReviewBox = document.getElementById('wrongReviewBox');
    dom.wrongReviewList = document.getElementById('wrongReviewList');
    dom.btnPlayAgain = document.getElementById('btnPlayAgain');
    dom.btnResultReturnLobby = document.getElementById('btnResultReturnLobby');
    dom.btnGoEncyclopedia = document.getElementById('btnGoEncyclopedia');

    dom.confettiCanvas = document.getElementById('confettiCanvas');
  }

  // Utility: Shuffle Array
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = a[i];
      a[i] = a[j];
      a[j] = temp;
    }
    return a;
  }

  // ========================================================
  // World SVG Map Engine
  // ========================================================
  function loadWorldSvg() {
    return fetch('world.svg', { cache: 'force-cache' })
      .then(function(res) { return res.text(); })
      .then(function(txt) {
        rawSvgText = txt;
        initMapContainers();
      })
      .catch(function(err) {
        console.warn('SVG Map load failed:', err);
      });
  }

  function initMapContainers() {
    if (!rawSvgText) return;

    if (dom.largeMapWrap) {
      dom.largeMapWrap.innerHTML = rawSvgText;
      addMapPinGroup(dom.largeMapWrap.querySelector('svg'));
    }
    if (dom.detailMapWrap) {
      dom.detailMapWrap.innerHTML = rawSvgText;
      addMapPinGroup(dom.detailMapWrap.querySelector('svg'));
    }

    if (state.currentQuestion) {
      renderMapHighlight(state.currentQuestion.target.iso);
    }
  }

  function addMapPinGroup(svgEl) {
    if (!svgEl) return;
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    var pinG = svgEl.querySelector('#targetPinGroup');
    if (!pinG) {
      pinG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      pinG.setAttribute('id', 'targetPinGroup');
      pinG.setAttribute('class', 'map-pin-group');
      pinG.innerHTML =
        '<ellipse cx="0" cy="0.6" rx="3.5" ry="1.4" class="pin-shadow" />' +
        '<path class="pin-body" d="M 0,0 C -1.6,-2.8 -4.8,-6.5 -4.8,-11 C -4.8,-14.8 -2.6,-18 0,-18 C 2.6,-18 4.8,-14.8 4.8,-11 C 4.8,-6.5 1.6,-2.8 0,0 Z" />' +
        '<circle class="pin-inner" cx="0" cy="-11" r="2.0" />';
      svgEl.appendChild(pinG);
    }
  }

  function updatePinTransform(svg, cx, cy, visibleW) {
    if (!svg) return;
    var pinG = svg.querySelector('#targetPinGroup');
    if (!pinG) return;
    var containerW = svg.clientWidth || (svg.parentElement ? svg.parentElement.clientWidth : 0) || 620;
    var scaleFactor = (visibleW / containerW) * (24 / 18);
    scaleFactor = Math.max(0.18, Math.min(2.5, scaleFactor));
    pinG.setAttribute('transform', 'translate(' + cx.toFixed(2) + ',' + cy.toFixed(2) + ') scale(' + scaleFactor.toFixed(3) + ')');
    svg.appendChild(pinG);
  }

  function renderMapHighlight(iso, targetContainer, forceZoom) {
    var container = targetContainer || dom.largeMapWrap;
    if (!container) return;
    var svg = container.querySelector('svg');
    if (!svg) {
      if (rawSvgText) {
        container.innerHTML = rawSvgText;
        addMapPinGroup(container.querySelector('svg'));
        svg = container.querySelector('svg');
      } else {
        return;
      }
    }

    var isoLower = iso.toLowerCase();
    var b = BBOXES[isoLower];

    // 1. Remove prior active highlights
    var activePaths = svg.querySelectorAll('.active-target');
    for (var a = 0; a < activePaths.length; a++) {
      activePaths[a].classList.remove('active-target');
    }

    // 2. Add active-target class to target path
    var path = svg.querySelector('path[id="' + isoLower + '"]') || svg.querySelector('path[id="' + iso.toUpperCase() + '"]');
    if (path) {
      path.classList.add('active-target');
      svg.appendChild(path);
    }

    // 3. Move Teardrop Pin
    var pinG = svg.querySelector('#targetPinGroup');
    if (!pinG) {
      addMapPinGroup(svg);
      pinG = svg.querySelector('#targetPinGroup');
    }

    var cx = 505, cy = 333;
    if (b) {
      cx = b[0] + b[2] / 2;
      cy = b[1] + b[3] / 2;
    } else if (path) {
      try {
        var bb = path.getBBox();
        cx = bb.x + bb.width / 2;
        cy = bb.y + bb.height / 2;
        b = [bb.x, bb.y, bb.width, bb.height];
      } catch(e) {}
    }

    if (container === dom.largeMapWrap) {
      state.currentCenter = { x: cx, y: cy };
    }

    // 4. ViewBox Zooming & Pin Scale
    var isDetail = (container === dom.detailMapWrap);
    var shouldZoom = isDetail || (forceZoom === true) || state.mapZoomed;
    if (shouldZoom && b) {
      var aspect = isDetail ? 1.25 : 1.6;
      var zoomW = Math.max(b[2] * 2.8, 140);
      var zoomH = Math.max(b[3] * 2.8, 95);

      if (zoomW / zoomH > aspect) {
        zoomH = zoomW / aspect;
      } else {
        zoomW = zoomH * aspect;
      }

      if (container === dom.largeMapWrap) {
        state.currentBaseBox = [cx, cy, zoomW, zoomH];
        state.currentZoomFactor = 1.0;
      }
      applySvgViewBox(svg, cx, cy, zoomW, zoomH, 1.0);
    } else {
      svg.setAttribute('viewBox', '0 0 1010 666');
      updatePinTransform(svg, cx, cy, 1010);
    }
  }

  function applySvgViewBox(svg, cx, cy, w, h, zoomFactor) {
    if (!svg) return;
    var zf = (typeof zoomFactor === 'number') ? zoomFactor : state.currentZoomFactor;
    var finalW = w * zf;
    var finalH = h * zf;

    var vx = Math.max(0, Math.min(1010 - finalW, cx - finalW / 2));
    var vy = Math.max(0, Math.min(666 - finalH, cy - finalH / 2));

    svg.setAttribute('viewBox', vx.toFixed(1) + ' ' + vy.toFixed(1) + ' ' + finalW.toFixed(1) + ' ' + finalH.toFixed(1));
    updatePinTransform(svg, cx, cy, finalW);
  }

  // ========================================================
  // Confetti Particle System
  // ========================================================
  var confettiParticles = [];
  var confettiAnimId = null;

  function launchConfetti(count) {
    var canvas = dom.confettiCanvas;
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var colors = ['#0284c7', '#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
    confettiParticles = [];

    for (var i = 0; i < (count || 90); i++) {
      confettiParticles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 50,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 3,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10
      });
    }

    if (confettiAnimId) cancelAnimationFrame(confettiAnimId);

    function updateConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var alive = false;

      for (var p = 0; p < confettiParticles.length; p++) {
        var pt = confettiParticles[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.rotation += pt.vRot;

        if (pt.y < canvas.height + 20) {
          alive = true;
          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.rotate((pt.rotation * Math.PI) / 180);
          ctx.fillStyle = pt.color;
          ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size * 0.6);
          ctx.restore();
        }
      }

      if (alive) {
        confettiAnimId = requestAnimationFrame(updateConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    confettiAnimId = requestAnimationFrame(updateConfetti);
  }

  // ========================================================
  // Question Generator
  // ========================================================
  function generateQuizQuestions() {
    var pool = scopePools[state.scope] || scopePools.popular;
    if (pool.length < 4) pool = allCountries;

    var shuffledPool = shuffle(pool);
    var count = (state.qTotal >= 999) ? shuffledPool.length : Math.min(state.qTotal, shuffledPool.length);
    var targetList = shuffledPool.slice(0, count);

    var questions = [];
    for (var i = 0; i < targetList.length; i++) {
      var target = targetList[i];

      var sameContPool = pool.filter(function(c) {
        return c.iso !== target.iso && c.contKey === target.contKey;
      });
      var otherPool = pool.filter(function(c) {
        return c.iso !== target.iso && c.contKey !== target.contKey;
      });

      var distractors = [];
      var shuffledSame = shuffle(sameContPool);
      while (distractors.length < 2 && shuffledSame.length > 0) {
        distractors.push(shuffledSame.pop());
      }
      var shuffledOther = shuffle(otherPool.concat(shuffledSame));
      while (distractors.length < 3 && shuffledOther.length > 0) {
        distractors.push(shuffledOther.pop());
      }

      var options = shuffle([target].concat(distractors));

      questions.push({
        target: target,
        options: options
      });
    }

    return questions;
  }

  // ========================================================
  // Screen Navigation: Lobby vs Arena vs Encyclopedia
  // ========================================================
  function showLobby() {
    clearInterval(state.timerInterval);
    state.isPlaying = false;
    state.isPaused = false;

    dom.lobbyView.hidden = false;
    dom.inGameWrapper.hidden = true;
    dom.encyclopediaView.hidden = true;
    dom.pauseModal.hidden = true;
    dom.resultModal.hidden = true;
    dom.countryDetailModal.hidden = true;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function launchGame() {
    if (state.mode === 'encyclopedia') {
      showEncyclopedia();
      return;
    }

    state.isPlaying = true;
    state.isPaused = false;

    dom.lobbyView.hidden = true;
    dom.inGameWrapper.hidden = false;
    dom.encyclopediaView.hidden = true;
    dom.pauseModal.hidden = true;
    dom.resultModal.hidden = true;

    var modeLabels = {
      'flag-to-country': '국기 & 지도 퀴즈',
      'country-to-flag': '나라 보고 국기 찾기',
      'capital-quiz': '수도 & 랜드마크 퀴즈'
    };
    dom.currentModeLabel.textContent = modeLabels[state.mode] || '국기 & 지도 퀴즈';

    startNewQuiz();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showEncyclopedia() {
    state.isPlaying = false;
    state.isPaused = false;

    dom.lobbyView.hidden = true;
    dom.inGameWrapper.hidden = true;
    dom.encyclopediaView.hidden = false;

    renderEncyclopedia();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ========================================================
  // Pause / Stop Controllers
  // ========================================================
  function pauseGame() {
    if (!state.isPlaying || state.isPaused) return;
    state.isPaused = true;
    clearInterval(state.timerInterval);
    audio.playClick();
    dom.pauseModal.hidden = false;
  }

  function resumeGame() {
    if (!state.isPlaying || !state.isPaused) return;
    state.isPaused = false;
    dom.pauseModal.hidden = true;
    audio.playClick();

    // Resume timer with remaining seconds
    if (state.timeRemaining > 0) {
      resumeTimer();
    }
  }

  // ========================================================
  // Quiz Flow Controllers
  // ========================================================
  function startNewQuiz() {
    clearInterval(state.timerInterval);

    state.questions = generateQuizQuestions();
    state.currentIndex = 0;
    state.score = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.correctCount = 0;
    state.wrongCount = 0;
    state.wrongList = [];
    state.lifeline5050Count = 2;
    state.isLocked = false;
    state.isPaused = false;

    updateHeaderStats();
    updateLifelineUI();

    dom.resultModal.hidden = true;
    dom.hintBubble.hidden = true;

    renderQuestion();
  }

  function renderQuestion() {
    clearInterval(state.timerInterval);
    state.isLocked = false;
    state.hintUsed = false;
    dom.hintBubble.hidden = true;

    if (state.currentIndex >= state.questions.length) {
      finishQuiz();
      return;
    }

    var q = state.questions[state.currentIndex];
    state.currentQuestion = q;
    var target = q.target;

    updateHeaderStats();
    resetOptionStyles();

    // Handle Map Visibility
    if (state.showMap) {
      dom.quizRightPanel.style.display = 'flex';
      dom.quizWideGrid.style.gridTemplateColumns = (window.innerWidth > 950) ? '460px 1fr' : '1fr';
    } else {
      dom.quizRightPanel.style.display = 'none';
      dom.quizWideGrid.style.gridTemplateColumns = '1fr';
    }

    // Mode-Specific Setup
    if (state.mode === 'flag-to-country') {
      dom.leftQuizBox.hidden = false;
      dom.countryToFlagCard.hidden = true;
      dom.landmarkTag.hidden = true;

      dom.mainFlagImg.src = 'flags/' + target.iso + '.svg';
      dom.mapRegionBadge.textContent = '📍 ' + target.continent;
      dom.promptText.textContent = '이 국기와 위치의 나라는 어디일까요?';
      dom.promptSub.textContent = '오른쪽 세계 지도 위치와 국기를 보고 정답을 선택하세요!';

      renderMapHighlight(target.iso, dom.largeMapWrap);

      for (var o = 0; o < 4; o++) {
        var opt = q.options[o];
        var btn = dom.optBtns[o];
        if (btn && opt) {
          btn.querySelector('.opt-label').textContent = opt.name;
          btn.dataset.iso = opt.iso;
          btn.disabled = false;
          btn.classList.remove('eliminated');
        }
      }

    } else if (state.mode === 'capital-quiz') {
      dom.leftQuizBox.hidden = false;
      dom.countryToFlagCard.hidden = true;

      dom.mainFlagImg.src = 'flags/' + target.iso + '.svg';
      dom.landmarkTag.hidden = false;
      dom.landmarkIcon.textContent = target.landmarkIcon;
      dom.landmarkName.textContent = target.name + ' · ' + (target.landmarkName || '대표 문화');
      dom.mapRegionBadge.textContent = '📍 ' + target.continent;

      dom.promptText.textContent = target.name + '의 수도는 어디일까요?';
      dom.promptSub.textContent = '오른쪽 지도 위치와 국기를 확인하고 올바른 수도를 골라보세요!';

      renderMapHighlight(target.iso, dom.largeMapWrap);

      for (var c = 0; c < 4; c++) {
        var cOpt = q.options[c];
        var cBtn = dom.optBtns[c];
        if (cBtn && cOpt) {
          cBtn.querySelector('.opt-label').textContent = cOpt.capital;
          cBtn.dataset.iso = cOpt.iso;
          cBtn.disabled = false;
          cBtn.classList.remove('eliminated');
        }
      }

    } else if (state.mode === 'country-to-flag') {
      dom.leftQuizBox.hidden = true;
      dom.countryToFlagCard.hidden = false;

      dom.c2fContinent.textContent = '🌏 ' + target.continent;
      dom.c2fCountryName.textContent = target.name;
      dom.c2fCapitalHint.textContent = '수도: ' + target.capital + ' ' + target.landmarkIcon;
      dom.mapRegionBadge.textContent = '📍 ' + target.name + ' 위치';

      renderMapHighlight(target.iso, dom.largeMapWrap);

      // Render 4 flag choice cards
      dom.flagOptionsGrid.innerHTML = '';
      for (var f = 0; f < 4; f++) {
        var fOpt = q.options[f];
        var fCard = document.createElement('button');
        fCard.type = 'button';
        fCard.className = 'flag-opt-card';
        fCard.dataset.iso = fOpt.iso;
        fCard.dataset.index = f;
        fCard.innerHTML = '<img src="flags/' + fOpt.iso + '.svg" alt="국기">';

        fCard.addEventListener('click', function(e) {
          var selIso = this.dataset.iso;
          handleAnswer(selIso, this);
        });

        dom.flagOptionsGrid.appendChild(fCard);
      }
    }

    startTimer();
  }

  function resetOptionStyles() {
    for (var i = 0; i < dom.optBtns.length; i++) {
      dom.optBtns[i].className = 'opt-btn';
    }
  }

  // ========================================================
  // Timer Countdown Controller
  // ========================================================
  function startTimer() {
    clearInterval(state.timerInterval);

    if (state.timerLimit <= 0) {
      dom.timerBarWrap.style.display = 'none';
      return;
    }

    dom.timerBarWrap.style.display = 'block';
    state.timeRemaining = state.timerLimit;
    dom.timerBar.style.width = '100%';
    dom.timerBar.classList.remove('warning');

    runTimerLoop();
  }

  function resumeTimer() {
    clearInterval(state.timerInterval);
    runTimerLoop();
  }

  function runTimerLoop() {
    var totalMs = state.timerLimit * 1000;
    var startMs = Date.now() - (totalMs - state.timeRemaining * 1000);

    state.timerInterval = setInterval(function() {
      if (state.isLocked || state.isPaused) return;

      var elapsed = Date.now() - startMs;
      var remainingMs = Math.max(0, totalMs - elapsed);
      state.timeRemaining = remainingMs / 1000;

      var pct = (remainingMs / totalMs) * 100;
      dom.timerBar.style.width = pct + '%';

      if (state.timeRemaining <= 3.2 && !dom.timerBar.classList.contains('warning')) {
        dom.timerBar.classList.add('warning');
        audio.playTick();
      }

      if (remainingMs <= 0) {
        clearInterval(state.timerInterval);
        handleTimeout();
      }
    }, 100);
  }

  function handleTimeout() {
    if (state.isLocked) return;
    state.isLocked = true;

    audio.playWrong();
    showFeedback('⏰', '시간 초과!', false);

    var target = state.currentQuestion.target;
    state.wrongCount++;
    state.combo = 0;
    state.wrongList.push(target);

    highlightCorrectAnswer();

    setTimeout(function() {
      state.currentIndex++;
      renderQuestion();
    }, 1300);
  }

  // ========================================================
  // Answer Evaluation
  // ========================================================
  function handleAnswer(selectedIso, clickedElement) {
    if (state.isLocked) return;
    state.isLocked = true;
    clearInterval(state.timerInterval);

    var target = state.currentQuestion.target;
    var isCorrect = (selectedIso === target.iso);

    if (isCorrect) {
      state.correctCount++;
      state.combo++;
      if (state.combo > state.maxCombo) {
        state.maxCombo = state.combo;
      }

      var timeBonus = Math.floor(state.timeRemaining * 10);
      var comboBonus = Math.max(0, (state.combo - 1) * 20);
      var gained = 100 + timeBonus + comboBonus;
      state.score += gained;

      if (clickedElement) {
        clickedElement.classList.add('correct');
      }

      if (state.combo >= 3) {
        audio.playCombo(state.combo);
        showFeedback('🔥', state.combo + ' 콤보! +' + gained + '점', true);
      } else {
        audio.playCorrect();
        showFeedback('⭕', '정답입니다! +' + gained + '점', true);
      }

      setTimeout(function() {
        state.currentIndex++;
        renderQuestion();
      }, 850);

    } else {
      state.wrongCount++;
      state.combo = 0;
      state.wrongList.push(target);

      audio.playWrong();
      if (clickedElement) {
        clickedElement.classList.add('wrong');
      }

      highlightCorrectAnswer();
      showFeedback('❌', '오답! 정답은 ' + target.name + '입니다.', false);

      setTimeout(function() {
        state.currentIndex++;
        renderQuestion();
      }, 1400);
    }

    updateHeaderStats();
  }

  function highlightCorrectAnswer() {
    var target = state.currentQuestion.target;

    if (state.mode === 'country-to-flag') {
      var cards = dom.flagOptionsGrid.querySelectorAll('.flag-opt-card');
      for (var f = 0; f < cards.length; f++) {
        if (cards[f].dataset.iso === target.iso) {
          cards[f].classList.add('correct');
        }
      }
    } else {
      for (var o = 0; o < dom.optBtns.length; o++) {
        if (dom.optBtns[o].dataset.iso === target.iso) {
          dom.optBtns[o].classList.add('correct');
        }
      }
    }
  }

  function showFeedback(icon, text, isSuccess) {
    dom.fbIcon.textContent = icon;
    dom.fbText.textContent = text;
    dom.answerFeedback.hidden = false;

    setTimeout(function() {
      dom.answerFeedback.hidden = true;
    }, 1100);
  }

  function updateHeaderStats() {
    var totalText = (state.qTotal >= 999) ? state.questions.length : state.qTotal;
    dom.statQuestion.textContent = (state.currentIndex + 1) + ' / ' + totalText;
    dom.statScore.textContent = state.score.toLocaleString();

    if (state.combo > 1) {
      dom.statCombo.textContent = state.combo + ' COMBO';
      dom.statComboPill.classList.add('active');
    } else {
      dom.statCombo.textContent = '0 COMBO';
      dom.statComboPill.classList.remove('active');
    }
  }

  function updateLifelineUI() {
    dom.count5050.textContent = state.lifeline5050Count;
    dom.btnLifeline5050.disabled = (state.lifeline5050Count <= 0);
  }

  // ========================================================
  // Lifelines (50:50 and Hint)
  // ========================================================
  function useLifeline5050() {
    if (state.isLocked || state.lifeline5050Count <= 0) return;
    state.lifeline5050Count--;
    updateLifelineUI();
    audio.play5050();

    var targetIso = state.currentQuestion.target.iso;

    if (state.mode === 'country-to-flag') {
      var cards = Array.from(dom.flagOptionsGrid.querySelectorAll('.flag-opt-card'));
      var wrongCards = cards.filter(function(c) { return c.dataset.iso !== targetIso; });
      var toEliminate = shuffle(wrongCards).slice(0, 2);
      toEliminate.forEach(function(c) { c.classList.add('eliminated'); });
    } else {
      var btns = Array.from(dom.optBtns);
      var wrongBtns = btns.filter(function(b) { return b.dataset.iso !== targetIso; });
      var toEliminateBtns = shuffle(wrongBtns).slice(0, 2);
      toEliminateBtns.forEach(function(b) {
        b.classList.add('eliminated');
        b.disabled = true;
      });
    }
  }

  function useLifelineHint() {
    if (state.isLocked || state.hintUsed) return;
    state.hintUsed = true;
    audio.playHint();

    var target = state.currentQuestion.target;
    dom.hintText.innerHTML = '💡 <b>대륙:</b> ' + target.continent + ' &nbsp;|&nbsp; <b>수도:</b> ' + target.capital + ' ' + target.landmarkIcon;
    dom.hintBubble.hidden = false;
  }

  // ========================================================
  // Quiz Finish & Result Screen
  // ========================================================
  function finishQuiz() {
    clearInterval(state.timerInterval);
    audio.playVictory();

    var totalAnswered = state.correctCount + state.wrongCount;
    var accuracy = totalAnswered > 0 ? Math.round((state.correctCount / totalAnswered) * 100) : 0;

    dom.resultScore.textContent = state.score.toLocaleString();
    dom.resultCorrectCount.textContent = state.correctCount + ' / ' + totalAnswered;
    dom.resultAccuracy.textContent = accuracy + '%';
    dom.resultMaxCombo.textContent = state.maxCombo + ' 🔥';

    if (accuracy === 100) {
      dom.resultBadgeIcon.textContent = '👑';
      dom.resultTitle.textContent = '완벽한 국기 & 지도 마스터!';
      dom.resultGradeDesc.textContent = '단 한 문제도 틀리지 않고 국기와 위치를 100% 맞혔습니다!';
      launchConfetti(120);
    } else if (accuracy >= 80) {
      dom.resultBadgeIcon.textContent = '🥇';
      dom.resultTitle.textContent = '우수한 국기 박사!';
      dom.resultGradeDesc.textContent = '놀라운 실력입니다! 조금만 더 하면 만점이에요!';
      launchConfetti(80);
    } else if (accuracy >= 60) {
      dom.resultBadgeIcon.textContent = '🥈';
      dom.resultTitle.textContent = '멋진 도전이었습니다!';
      dom.resultGradeDesc.textContent = '틀린 나라들의 위치와 국기를 복습해 보세요!';
    } else {
      dom.resultBadgeIcon.textContent = '🥉';
      dom.resultTitle.textContent = '좋은 배움의 기회!';
      dom.resultGradeDesc.textContent = '세계 국기 도감에서 지도 위치를 확인하고 재도전해 볼까요?';
    }

    if (state.wrongList.length > 0) {
      dom.wrongReviewBox.hidden = false;
      dom.wrongReviewList.innerHTML = '';
      state.wrongList.forEach(function(item) {
        var row = document.createElement('div');
        row.className = 'review-item';
        row.innerHTML =
          '<img src="flags/' + item.iso + '.svg" alt="국기">' +
          '<span class="review-name">' + item.name + ' (' + item.continent + ')</span>' +
          '<span class="review-cap">수도: ' + item.capital + ' ' + item.landmarkIcon + '</span>';
        dom.wrongReviewList.appendChild(row);
      });
    } else {
      dom.wrongReviewBox.hidden = true;
    }

    dom.resultModal.hidden = false;
  }

  // ========================================================
  // World Flag Encyclopedia
  // ========================================================
  function renderEncyclopedia(filterKeyword) {
    var pool = scopePools[state.scope] || scopePools.world;
    if (state.scope === 'popular') pool = scopePools.popular;

    var kw = (filterKeyword || dom.encySearchInput.value || '').trim().toLowerCase();

    var filtered = pool.filter(function(c) {
      if (!kw) return true;
      return c.name.toLowerCase().indexOf(kw) !== -1 ||
             c.capital.toLowerCase().indexOf(kw) !== -1 ||
             c.landmarkName.toLowerCase().indexOf(kw) !== -1 ||
             c.iso.toLowerCase().indexOf(kw) !== -1;
    });

    dom.encyTotalCount.textContent = filtered.length + '개국';
    dom.encyGrid.innerHTML = '';

    filtered.forEach(function(c) {
      var card = document.createElement('div');
      card.className = 'ency-card';
      card.innerHTML =
        '<div class="ency-card-flag">' +
          '<img src="flags/' + c.iso + '.svg" alt="' + c.name + ' 국기" loading="lazy">' +
        '</div>' +
        '<div class="ency-card-info">' +
          '<span class="ency-card-name">' + c.name + '</span>' +
          '<span class="ency-card-cap">' + c.landmarkIcon + ' ' + c.capital + '</span>' +
        '</div>';

      card.addEventListener('click', function() {
        openCountryDetail(c);
      });

      dom.encyGrid.appendChild(card);
    });
  }

  function openCountryDetail(c) {
    audio.playClick();
    dom.detailFlagImg.src = 'flags/' + c.iso + '.svg';
    dom.detailCountryName.textContent = c.name;
    dom.detailContinent.textContent = c.continent;
    dom.detailCapital.textContent = c.capital;
    dom.detailLandmark.textContent = c.landmarkIcon + ' ' + (c.landmarkName || '전통 문화');
    dom.detailIso.textContent = c.iso.toUpperCase();

    // Show modal first so dimensions are computed
    dom.countryDetailModal.hidden = false;

    // Render highlighted country and pin in modal map
    renderMapHighlight(c.iso, dom.detailMapWrap, true);

    dom.btnQuizFromDetail.onclick = function() {
      dom.countryDetailModal.hidden = true;
      state.mode = 'flag-to-country';
      state.scope = 'world';
      launchGame();
    };
  }

  // ========================================================
  // Event Bindings
  // ========================================================
  function bindEvents() {
    // Sound Toggle
    dom.btnSoundToggle.addEventListener('click', function() {
      var muted = audio.toggleMute();
      dom.soundIcon.textContent = muted ? '🔇' : '🔊';
      dom.btnSoundToggle.title = muted ? '효과음 켜기' : '효과음 끄기';
    });

    // Lobby Mode Selection
    dom.lobbyModeGrid.addEventListener('click', function(e) {
      var card = e.target.closest('.mode-card');
      if (!card) return;
      audio.playClick();

      var cards = dom.lobbyModeGrid.querySelectorAll('.mode-card');
      cards.forEach(function(c) { c.classList.remove('active'); });
      card.classList.add('active');

      state.mode = card.dataset.mode;

      // If encyclopedia chosen, show or hide scope sections appropriately
      var isEncy = (state.mode === 'encyclopedia');
      dom.lobbyOptionsSection.style.display = isEncy ? 'none' : 'flex';
      dom.btnLaunchQuiz.querySelector('.btn-text').textContent = isEncy ? '📖 도감 열기!' : '🚀 퀴즈 시작하기!';
    });

    // Lobby Scope Selection Chips
    dom.lobbyScopeChips.addEventListener('click', function(e) {
      var chip = e.target.closest('.lobby-chip-btn');
      if (!chip) return;
      audio.playClick();

      var chips = dom.lobbyScopeChips.querySelectorAll('.lobby-chip-btn');
      chips.forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');

      state.scope = chip.dataset.scope;
    });

    // Lobby Options
    dom.lobbySelectQCount.addEventListener('change', function() {
      state.qTotal = parseInt(this.value, 10);
    });

    dom.lobbySelectTimer.addEventListener('change', function() {
      state.timerLimit = parseInt(this.value, 10);
    });

    dom.lobbyToggleMap.addEventListener('click', function() {
      state.showMap = !state.showMap;
      dom.lobbyToggleMap.classList.toggle('active', state.showMap);
      dom.lobbyToggleMap.textContent = state.showMap ? '🗺️ 지도 위치: ON' : '🗺️ 지도 위치: OFF';
      audio.playClick();
    });

    // Launch Button
    dom.btnLaunchQuiz.addEventListener('click', function() {
      audio.playClick();
      launchGame();
    });

    // Header Back & Pause Buttons
    dom.btnHeaderReturnLobby.addEventListener('click', function() {
      audio.playClick();
      showLobby();
    });

    dom.btnPauseGame.addEventListener('click', function() {
      pauseGame();
    });

    // Pause Modal Buttons
    dom.btnResumeGame.addEventListener('click', function() {
      resumeGame();
    });

    dom.btnRestartCurrent.addEventListener('click', function() {
      dom.pauseModal.hidden = true;
      audio.playClick();
      startNewQuiz();
    });

    dom.btnPauseReturnLobby.addEventListener('click', function() {
      dom.pauseModal.hidden = true;
      audio.playClick();
      showLobby();
    });

    // Map Zoom Buttons
    dom.btnZoomIn.addEventListener('click', function() {
      state.currentZoomFactor = Math.max(0.3, state.currentZoomFactor * 0.75);
      var svg = dom.largeMapWrap.querySelector('svg');
      if (svg) applySvgViewBox(svg, state.currentCenter.x, state.currentCenter.y, state.currentBaseBox[2], state.currentBaseBox[3]);
      audio.playClick();
    });

    dom.btnZoomOut.addEventListener('click', function() {
      state.currentZoomFactor = Math.min(3.0, state.currentZoomFactor * 1.35);
      var svg = dom.largeMapWrap.querySelector('svg');
      if (svg) applySvgViewBox(svg, state.currentCenter.x, state.currentCenter.y, state.currentBaseBox[2], state.currentBaseBox[3]);
      audio.playClick();
    });

    dom.btnToggleZoom.addEventListener('click', function() {
      state.mapZoomed = !state.mapZoomed;
      if (state.currentQuestion) {
        renderMapHighlight(state.currentQuestion.target.iso, dom.largeMapWrap);
      }
      audio.playClick();
    });

    // Option Buttons Click (Mode 1 & Mode 3)
    dom.optionsGrid.addEventListener('click', function(e) {
      var btn = e.target.closest('.opt-btn');
      if (!btn || btn.disabled) return;
      handleAnswer(btn.dataset.iso, btn);
    });

    // Keyboard Shortcuts (1, 2, 3, 4)
    window.addEventListener('keydown', function(e) {
      if (!state.isPlaying || state.isPaused) return;
      if (dom.resultModal && !dom.resultModal.hidden) return;
      if (dom.countryDetailModal && !dom.countryDetailModal.hidden) return;

      var num = parseInt(e.key, 10);
      if (num >= 1 && num <= 4) {
        var idx = num - 1;
        if (state.mode === 'country-to-flag') {
          var cards = dom.flagOptionsGrid.querySelectorAll('.flag-opt-card');
          if (cards[idx]) cards[idx].click();
        } else {
          var btns = dom.optionsGrid.querySelectorAll('.opt-btn');
          if (btns[idx]) btns[idx].click();
        }
      }
    });

    // Lifeline buttons
    dom.btnLifeline5050.addEventListener('click', useLifeline5050);
    dom.btnLifelineHint.addEventListener('click', useLifelineHint);

    // Encyclopedia
    dom.btnEncyReturnLobby.addEventListener('click', function() {
      audio.playClick();
      showLobby();
    });

    dom.encySearchInput.addEventListener('input', function() {
      renderEncyclopedia(this.value);
    });

    dom.encyScopeChips.addEventListener('click', function(e) {
      var chip = e.target.closest('.chip-btn');
      if (!chip) return;
      audio.playClick();

      var chips = dom.encyScopeChips.querySelectorAll('.chip-btn');
      chips.forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');

      state.scope = chip.dataset.scope;
      renderEncyclopedia();
    });

    // Detail Modal Closes
    dom.btnCloseDetail.addEventListener('click', function() {
      dom.countryDetailModal.hidden = true;
    });
    dom.btnCloseDetail2.addEventListener('click', function() {
      dom.countryDetailModal.hidden = true;
    });
    dom.countryDetailModal.addEventListener('click', function(e) {
      if (e.target === dom.countryDetailModal) dom.countryDetailModal.hidden = true;
    });

    // Result Modal Buttons
    dom.btnPlayAgain.addEventListener('click', function() {
      dom.resultModal.hidden = true;
      startNewQuiz();
    });

    dom.btnResultReturnLobby.addEventListener('click', function() {
      dom.resultModal.hidden = true;
      showLobby();
    });

    dom.btnGoEncyclopedia.addEventListener('click', function() {
      dom.resultModal.hidden = true;
      showEncyclopedia();
    });
  }

  // ========================================================
  // Boot
  // ========================================================
  function init() {
    initDatabase();
    cacheDom();
    bindEvents();

    loadWorldSvg().then(function() {
      var urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('detail')) {
        showEncyclopedia();
        var targetIso = urlParams.get('detail').toLowerCase();
        var found = countryMap[targetIso];
        if (found) openCountryDetail(found);
      } else if (urlParams.get('start') === '1') {
        launchGame();
      } else if (urlParams.get('mode') === 'encyclopedia') {
        showEncyclopedia();
      } else {
        showLobby();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
