/**
 * World Flag Quiz (세계 국기 퀴즈 왕) - Game Engine & Interactive Controller
 */
(function() {
  'use strict';

  var DATA = window.FLAGMAP_DATA || {};
  var CAPITALS = window.FLAGMAP_CAPITALS || {};
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

    // Populate popular pool
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
    dom.statQuestion = document.getElementById('statQuestion');
    dom.statScore = document.getElementById('statScore');
    dom.statCombo = document.getElementById('statCombo');
    dom.statComboPill = document.getElementById('statComboPill');
    dom.btnSoundToggle = document.getElementById('btnSoundToggle');
    dom.soundIcon = document.getElementById('soundIcon');
    dom.currentModeLabel = document.getElementById('currentModeLabel');

    dom.timerBarWrap = document.getElementById('timerBarWrap');
    dom.timerBar = document.getElementById('timerBar');

    dom.modeTabNav = document.querySelector('.mode-tab-nav');
    dom.tabBtns = document.querySelectorAll('.tab-btn');

    dom.quizFilterBar = document.getElementById('quizFilterBar');
    dom.scopeChips = document.getElementById('scopeChips');
    dom.chipBtns = document.querySelectorAll('.chip-btn');
    dom.selectQCount = document.getElementById('selectQCount');
    dom.selectTimer = document.getElementById('selectTimer');
    dom.btnRestartQuiz = document.getElementById('btnRestartQuiz');

    dom.quizArena = document.getElementById('quizArena');
    dom.lifelineBar = document.getElementById('lifelineBar');
    dom.btnLifeline5050 = document.getElementById('btnLifeline5050');
    dom.count5050 = document.getElementById('count5050');
    dom.btnLifelineHint = document.getElementById('btnLifelineHint');
    dom.hintBubble = document.getElementById('hintBubble');
    dom.hintText = document.getElementById('hintText');

    dom.questionCard = document.getElementById('questionCard');
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

    dom.answerFeedback = document.getElementById('answerFeedback');
    dom.fbIcon = document.getElementById('fbIcon');
    dom.fbText = document.getElementById('fbText');

    dom.encyclopediaView = document.getElementById('encyclopediaView');
    dom.encySearchInput = document.getElementById('encySearchInput');
    dom.encyTotalCount = document.getElementById('encyTotalCount');
    dom.encyGrid = document.getElementById('encyGrid');

    dom.countryDetailModal = document.getElementById('countryDetailModal');
    dom.detailFlagImg = document.getElementById('detailFlagImg');
    dom.detailCountryName = document.getElementById('detailCountryName');
    dom.detailContinent = document.getElementById('detailContinent');
    dom.detailCapital = document.getElementById('detailCapital');
    dom.detailLandmark = document.getElementById('detailLandmark');
    dom.detailIso = document.getElementById('detailIso');
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

      // Select 3 distractors
      // 1st priority: same continent; 2nd: general pool
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

    updateHeaderStats();
    updateLifelineUI();

    dom.resultModal.hidden = true;
    dom.hintBubble.hidden = true;

    if (state.mode === 'encyclopedia') {
      renderEncyclopedia();
    } else {
      renderQuestion();
    }
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

    // Mode-Specific Setup
    if (state.mode === 'flag-to-country') {
      dom.questionCard.hidden = false;
      dom.countryToFlagCard.hidden = true;
      dom.landmarkTag.hidden = true;

      dom.mainFlagImg.src = 'flags/' + target.iso + '.svg';
      dom.promptText.textContent = '이 국기의 나라는 어디일까요?';
      dom.promptSub.textContent = '4개의 보기 중 올바른 나라를 선택하세요!';

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
      dom.questionCard.hidden = false;
      dom.countryToFlagCard.hidden = true;

      dom.mainFlagImg.src = 'flags/' + target.iso + '.svg';
      dom.landmarkTag.hidden = false;
      dom.landmarkIcon.textContent = target.landmarkIcon;
      dom.landmarkName.textContent = target.name + ' · ' + (target.landmarkName || '대표 문화');

      dom.promptText.textContent = target.name + '의 수도는 어디일까요?';
      dom.promptSub.textContent = '올바른 수도 이름을 골라보세요!';

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
      dom.questionCard.hidden = true;
      dom.countryToFlagCard.hidden = false;

      dom.c2fContinent.textContent = '🌏 ' + target.continent;
      dom.c2fCountryName.textContent = target.name;
      dom.c2fCapitalHint.textContent = '수도: ' + target.capital + ' ' + target.landmarkIcon;

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

    var totalMs = state.timerLimit * 1000;
    var startMs = Date.now();

    state.timerInterval = setInterval(function() {
      if (state.isLocked) return;

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

    // Determine Grade
    if (accuracy === 100) {
      dom.resultBadgeIcon.textContent = '👑';
      dom.resultTitle.textContent = '완벽한 국기 마스터!';
      dom.resultGradeDesc.textContent = '단 한 문제도 틀리지 않고 100% 모두 맞혔습니다!';
      launchConfetti(120);
    } else if (accuracy >= 80) {
      dom.resultBadgeIcon.textContent = '🥇';
      dom.resultTitle.textContent = '우수한 국기 박사!';
      dom.resultGradeDesc.textContent = '놀라운 실력입니다! 조금만 더 하면 만점이에요!';
      launchConfetti(80);
    } else if (accuracy >= 60) {
      dom.resultBadgeIcon.textContent = '🥈';
      dom.resultTitle.textContent = '멋진 도전이었습니다!';
      dom.resultGradeDesc.textContent = '틀린 나라들을 복습하고 다시 도전해 보세요!';
    } else {
      dom.resultBadgeIcon.textContent = '🥉';
      dom.resultTitle.textContent = '좋은 배움의 기회!';
      dom.resultGradeDesc.textContent = '세계 국기 도감에서 나라들을 둘러보고 재도전해 볼까요?';
    }

    // Wrong review items
    if (state.wrongList.length > 0) {
      dom.wrongReviewBox.hidden = false;
      dom.wrongReviewList.innerHTML = '';
      state.wrongList.forEach(function(item) {
        var row = document.createElement('div');
        row.className = 'review-item';
        row.innerHTML =
          '<img src="flags/' + item.iso + '.svg" alt="국기">' +
          '<span class="review-name">' + item.name + '</span>' +
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
    dom.quizArena.hidden = true;
    dom.encyclopediaView.hidden = false;
    dom.lifelineBar.hidden = true;

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

    dom.btnQuizFromDetail.onclick = function() {
      dom.countryDetailModal.hidden = true;
      switchMode('flag-to-country');
    };

    dom.countryDetailModal.hidden = false;
  }

  function switchMode(newMode) {
    state.mode = newMode;

    dom.tabBtns.forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.mode === newMode);
    });

    var modeLabels = {
      'flag-to-country': '국기 보고 나라 맞추기',
      'country-to-flag': '나라 보고 국기 맞추기',
      'capital-quiz': '수도 & 랜드마크 퀴즈',
      'encyclopedia': '세계 국기 도감'
    };
    dom.currentModeLabel.textContent = modeLabels[newMode] || '';

    if (newMode === 'encyclopedia') {
      dom.quizArena.hidden = true;
      dom.encyclopediaView.hidden = false;
      dom.lifelineBar.hidden = true;
      renderEncyclopedia();
    } else {
      dom.quizArena.hidden = false;
      dom.encyclopediaView.hidden = true;
      dom.lifelineBar.hidden = false;
      startNewQuiz();
    }
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

    // Mode Tabs
    dom.modeTabNav.addEventListener('click', function(e) {
      var btn = e.target.closest('.tab-btn');
      if (!btn) return;
      audio.playClick();
      switchMode(btn.dataset.mode);
    });

    // Scope Chips
    dom.scopeChips.addEventListener('click', function(e) {
      var chip = e.target.closest('.chip-btn');
      if (!chip) return;
      audio.playClick();

      dom.chipBtns.forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      state.scope = chip.dataset.scope;

      if (state.mode === 'encyclopedia') {
        renderEncyclopedia();
      } else {
        startNewQuiz();
      }
    });

    // Question Count & Timer Selects
    dom.selectQCount.addEventListener('change', function() {
      state.qTotal = parseInt(this.value, 10);
      startNewQuiz();
    });

    dom.selectTimer.addEventListener('change', function() {
      state.timerLimit = parseInt(this.value, 10);
      startNewQuiz();
    });

    dom.btnRestartQuiz.addEventListener('click', function() {
      audio.playClick();
      startNewQuiz();
    });

    // Option Buttons Click (Mode 1 & Mode 3)
    dom.optionsGrid.addEventListener('click', function(e) {
      var btn = e.target.closest('.opt-btn');
      if (!btn || btn.disabled) return;
      handleAnswer(btn.dataset.iso, btn);
    });

    // Keyboard Shortcuts (1, 2, 3, 4)
    window.addEventListener('keydown', function(e) {
      if (dom.resultModal && !dom.resultModal.hidden) return;
      if (dom.countryDetailModal && !dom.countryDetailModal.hidden) return;
      if (state.mode === 'encyclopedia') return;

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

    // Encyclopedia live search
    dom.encySearchInput.addEventListener('input', function() {
      renderEncyclopedia(this.value);
    });

    // Modal Closes
    dom.btnCloseDetail.addEventListener('click', function() {
      dom.countryDetailModal.hidden = true;
    });
    dom.btnCloseDetail2.addEventListener('click', function() {
      dom.countryDetailModal.hidden = true;
    });
    dom.countryDetailModal.addEventListener('click', function(e) {
      if (e.target === dom.countryDetailModal) dom.countryDetailModal.hidden = true;
    });

    dom.btnPlayAgain.addEventListener('click', function() {
      dom.resultModal.hidden = true;
      startNewQuiz();
    });

    dom.btnGoEncyclopedia.addEventListener('click', function() {
      dom.resultModal.hidden = true;
      switchMode('encyclopedia');
    });
  }

  // ========================================================
  // Boot
  // ========================================================
  function init() {
    initDatabase();
    cacheDom();
    bindEvents();

    var urlParams = new URLSearchParams(window.location.search);
    var initMode = urlParams.get('mode');
    var initScope = urlParams.get('scope');

    if (initScope && scopePools[initScope]) {
      state.scope = initScope;
      dom.chipBtns.forEach(function(c) {
        c.classList.toggle('active', c.dataset.scope === initScope);
      });
    }

    if (initMode && ['flag-to-country', 'country-to-flag', 'capital-quiz', 'encyclopedia'].indexOf(initMode) !== -1) {
      switchMode(initMode);
    } else {
      startNewQuiz();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
