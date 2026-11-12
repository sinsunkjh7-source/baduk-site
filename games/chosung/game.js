/**
 * 초성 퀴즈 대모험 — 게임 컨트롤러
 */
(function () {
  'use strict';

  var CHOSUNG = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
    'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];

  var CAT_LABELS = {
    baduk: '⚫ 바둑 용어',
    proverb: '📜 속담 · 사자성어',
    animal: '🐾 동물 · 자연',
    food: '🍓 음식 · 간식',
    korea: '🏫 우리나라 · 상식'
  };

  var BEST_KEY = 'bks_chosung_best_v1';
  var SET_SIZE = 10;

  // DOM Elements
  var btnModeSolo = document.getElementById('btnModeSolo');
  var btnModeTeam = document.getElementById('btnModeTeam');
  var selCategory = document.getElementById('selCategory');
  var btnSound = document.getElementById('btnSound');
  var btnRestart = document.getElementById('btnRestart');

  var lblProgress = document.getElementById('lblProgress');
  var lblScore = document.getElementById('lblScore');
  var lblCombo = document.getElementById('lblCombo');
  var lblBest = document.getElementById('lblBest');
  var pillSoloScore = document.getElementById('pillSoloScore');
  var pillCombo = document.getElementById('pillCombo');
  var pillBest = document.getElementById('pillBest');

  var teamBoard = document.getElementById('teamBoard');
  var scoreBlue = document.getElementById('scoreBlue');
  var scoreWhite = document.getElementById('scoreWhite');

  var quizStage = document.getElementById('quizStage');
  var lblCatTag = document.getElementById('lblCatTag');
  var lblLengthTag = document.getElementById('lblLengthTag');
  var chosungTiles = document.getElementById('chosungTiles');
  var feedbackBox = document.getElementById('feedbackBox');
  var hintBox = document.getElementById('hintBox');
  var hintText = document.getElementById('hintText');
  var factBox = document.getElementById('factBox');
  var factText = document.getElementById('factText');

  var answerForm = document.getElementById('answerForm');
  var answerInput = document.getElementById('answerInput');
  var btnSubmit = document.getElementById('btnSubmit');

  var soloActions = document.getElementById('soloActions');
  var btnHintMeaning = document.getElementById('btnHintMeaning');
  var btnHintLetter = document.getElementById('btnHintLetter');
  var btnSkip = document.getElementById('btnSkip');
  var btnNextSolo = document.getElementById('btnNextSolo');

  var teamControls = document.getElementById('teamControls');
  var btnAwardBlue = document.getElementById('btnAwardBlue');
  var btnAwardWhite = document.getElementById('btnAwardWhite');
  var btnTeamHint = document.getElementById('btnTeamHint');
  var btnTeamLetter = document.getElementById('btnTeamLetter');
  var btnTeamReveal = document.getElementById('btnTeamReveal');
  var btnTeamNext = document.getElementById('btnTeamNext');

  var resultCard = document.getElementById('resultCard');
  var resStars = document.getElementById('resStars');
  var resTitle = document.getElementById('resTitle');
  var resSub = document.getElementById('resSub');
  var resScore = document.getElementById('resScore');
  var resCorrect = document.getElementById('resCorrect');
  var resMaxCombo = document.getElementById('resMaxCombo');
  var reviewList = document.getElementById('reviewList');
  var btnPlayAgain = document.getElementById('btnPlayAgain');

  // Lightweight Web Audio synth
  var audioCtx = null;
  var soundEnabled = true;

  function playTone(freqs, dur) {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var now = audioCtx.currentTime;
      freqs.forEach(function (f, idx) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.08);
        gain.gain.setValueAtTime(0.14, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + dur);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + dur);
      });
    } catch (e) {
      // Ignore audio errors on restricted devices
    }
  }

  // Hangul helpers
  function getCharChosung(ch) {
    var code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      return CHOSUNG[Math.floor((code - 0xac00) / 588)];
    }
    return ch;
  }

  function normalize(str) {
    return String(str || '').replace(/\s+/g, '').trim();
  }

  function shuffle(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function loadBest() {
    try {
      return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBest(val) {
    try {
      localStorage.setItem(BEST_KEY, String(val));
    } catch (e) {
      // Ignore storage errors
    }
  }

  // State
  var state = {
    mode: 'solo', // 'solo' | 'team'
    category: 'all',
    deck: [],
    index: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    correctCount: 0,
    bestScore: loadBest(),
    blueScore: 0,
    whiteScore: 0,
    revealedIndices: [],
    meaningUsed: false,
    letterPenalty: 0,
    roundFinished: false,
    history: []
  };

  function buildDeck() {
    var pool = window.CHOSUNG_QUESTIONS || [];
    if (state.category !== 'all') {
      pool = pool.filter(function (q) {
        return q.cat === state.category;
      });
    }
    var shuffled = shuffle(pool);
    return shuffled.slice(0, Math.min(SET_SIZE, shuffled.length));
  }

  function startNewSet() {
    state.deck = buildDeck();
    state.index = 0;
    state.score = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.correctCount = 0;
    state.blueScore = 0;
    state.whiteScore = 0;
    state.history = [];

    resultCard.hidden = true;
    quizStage.hidden = false;
    loadQuestion();
    updateTopStats();
  }

  function currentQuestion() {
    return state.deck[state.index];
  }

  function loadQuestion() {
    var q = currentQuestion();
    if (!q) {
      showResult();
      return;
    }

    state.revealedIndices = [];
    state.meaningUsed = false;
    state.letterPenalty = 0;
    state.roundFinished = false;

    lblCatTag.textContent = CAT_LABELS[q.cat] || '🔤 퀴즈';
    var charCount = normalize(q.word).length;
    lblLengthTag.textContent = charCount + '글자';

    feedbackBox.hidden = true;
    feedbackBox.className = 'cs-feedback';
    hintBox.hidden = true;
    factBox.hidden = true;

    answerInput.value = '';
    answerInput.disabled = false;
    btnSubmit.disabled = false;

    btnHintMeaning.disabled = false;
    btnHintLetter.disabled = false;
    btnSkip.hidden = false;
    btnNextSolo.hidden = true;

    btnTeamHint.disabled = false;
    btnTeamLetter.disabled = false;
    btnTeamReveal.disabled = false;
    btnAwardBlue.disabled = false;
    btnAwardWhite.disabled = false;

    renderTiles(false);
    updateTopStats();

    if (state.mode === 'solo') {
      setTimeout(function () {
        answerInput.focus();
      }, 40);
    }
  }

  function renderTiles(revealAll) {
    var q = currentQuestion();
    if (!q) return;
    chosungTiles.innerHTML = '';

    for (var i = 0; i < q.word.length; i++) {
      var ch = q.word[i];
      if (ch === ' ') {
        var sp = document.createElement('div');
        sp.className = 'cs-tile-space';
        chosungTiles.appendChild(sp);
        continue;
      }

      var tile = document.createElement('div');
      var isRevealed = revealAll || state.revealedIndices.indexOf(i) !== -1;
      tile.className = 'cs-tile' + (isRevealed ? ' revealed' : '');
      tile.textContent = isRevealed ? ch : getCharChosung(ch);
      chosungTiles.appendChild(tile);
    }
  }

  function updateTopStats() {
    var total = state.deck.length || 1;
    var shownIdx = Math.min(state.index + 1, total);
    lblProgress.textContent = shownIdx + ' / ' + total;
    lblScore.textContent = state.score + '점';
    lblCombo.textContent = state.combo + ' 콤보';
    lblBest.textContent = state.bestScore + '점';

    scoreBlue.textContent = state.blueScore + '점';
    scoreWhite.textContent = state.whiteScore + '점';
  }

  function showFeedback(type, msg) {
    feedbackBox.className = 'cs-feedback ' + type;
    feedbackBox.textContent = msg;
    feedbackBox.hidden = false;
  }

  function revealMeaningHint() {
    var q = currentQuestion();
    if (!q || state.meaningUsed) return;
    state.meaningUsed = true;
    hintText.textContent = q.hint;
    hintBox.hidden = false;
    btnHintMeaning.disabled = true;
    btnTeamHint.disabled = true;
    playTone([523], 0.12);
  }

  function revealOneLetter() {
    var q = currentQuestion();
    if (!q || state.roundFinished) return;

    var candidates = [];
    for (var i = 0; i < q.word.length; i++) {
      if (q.word[i] !== ' ' && state.revealedIndices.indexOf(i) === -1) {
        candidates.push(i);
      }
    }
    if (candidates.length <= 1) {
      btnHintLetter.disabled = true;
      btnTeamLetter.disabled = true;
      return;
    }

    var pick = candidates[Math.floor(Math.random() * candidates.length)];
    state.revealedIndices.push(pick);
    state.letterPenalty += 3;
    renderTiles(false);
    playTone([659], 0.12);

    if (candidates.length - 1 <= 1) {
      btnHintLetter.disabled = true;
      btnTeamLetter.disabled = true;
    }
  }

  function finishQuestion(isSolved, customMsg) {
    var q = currentQuestion();
    state.roundFinished = true;
    renderTiles(true);

    factText.textContent = q.fact;
    factBox.hidden = false;

    answerInput.disabled = true;
    btnSubmit.disabled = true;
    btnHintMeaning.disabled = true;
    btnHintLetter.disabled = true;
    btnSkip.hidden = true;
    btnNextSolo.hidden = false;

    btnTeamHint.disabled = true;
    btnTeamLetter.disabled = true;
    btnTeamReveal.disabled = true;

    state.history.push({
      word: q.word,
      fact: q.fact,
      solved: isSolved
    });

    if (customMsg) {
      showFeedback(isSolved ? 'ok' : 'info', customMsg);
    }
    updateTopStats();
  }

  function handleSoloSubmit(e) {
    e.preventDefault();
    if (state.roundFinished || state.mode !== 'solo') return;

    var q = currentQuestion();
    var userAns = normalize(answerInput.value);
    if (!userAns) {
      answerInput.focus();
      return;
    }

    if (userAns === normalize(q.word)) {
      state.combo += 1;
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;
      state.correctCount += 1;

      var penalty = (state.meaningUsed ? 2 : 0) + state.letterPenalty;
      var basePts = Math.max(2, 10 - penalty);
      var comboBonus = state.combo >= 2 ? Math.min(state.combo, 5) : 0;
      var gained = basePts + comboBonus;
      state.score += gained;

      if (state.score > state.bestScore) {
        state.bestScore = state.score;
        saveBest(state.bestScore);
      }

      playTone([523, 659, 784], 0.18);
      var bonusTxt = comboBonus > 0 ? ' (콤보 +' + comboBonus + ')' : '';
      finishQuestion(true, '🎉 정답입니다! +' + gained + '점' + bonusTxt);
    } else {
      state.combo = 0;
      playTone([220, 196], 0.14);
      showFeedback('err', '아쉬워요! 다시 한 번 생각해 볼까요?');
      updateTopStats();
      answerInput.select();
    }
  }

  function handleSkip() {
    var q = currentQuestion();
    if (!q || state.roundFinished) return;
    state.combo = 0;
    playTone([392, 330], 0.14);
    finishQuestion(false, '정답은 「' + q.word + '」 입니다!');
  }

  function handleTeamAward(team) {
    var q = currentQuestion();
    if (!q) return;
    if (!state.roundFinished) {
      if (team === 'blue') {
        state.blueScore += 10;
        finishQuestion(true, '🔵 청팀 정답! +10점 획득!');
      } else {
        state.whiteScore += 10;
        finishQuestion(true, '⚪ 백팀 정답! +10점 획득!');
      }
      playTone([523, 659, 784], 0.18);
      btnAwardBlue.disabled = true;
      btnAwardWhite.disabled = true;
    }
  }

  function nextQuestion() {
    state.index += 1;
    if (state.index >= state.deck.length) {
      showResult();
    } else {
      loadQuestion();
    }
  }

  function showResult() {
    quizStage.hidden = true;
    resultCard.hidden = false;

    var total = state.deck.length || 1;
    if (state.mode === 'team') {
      var winner =
        state.blueScore > state.whiteScore
          ? '🔵 청팀 승리!'
          : state.whiteScore > state.blueScore
          ? '⚪ 백팀 승리!'
          : '🤝 사이좋은 무승부!';
      resStars.textContent = '🏆';
      resTitle.textContent = winner;
      resSub.textContent = '청팀 ' + state.blueScore + '점 vs 백팀 ' + state.whiteScore + '점';
      resScore.textContent = Math.max(state.blueScore, state.whiteScore) + '점';
      resCorrect.textContent = state.blueScore + ' : ' + state.whiteScore;
      resMaxCombo.textContent = total + '문제';
    } else {
      var ratio = state.correctCount / total;
      var stars = ratio >= 0.8 ? '★★★' : ratio >= 0.5 ? '★★☆' : '★☆☆';
      resStars.textContent = stars;
      resTitle.textContent = ratio >= 0.8 ? '최고예요! 초성 박사!' : ratio >= 0.5 ? '잘했어요! 실력이 쑥쑥!' : '좋은 도전이었어요!';
      resSub.textContent = '총 ' + total + '문제 중 ' + state.correctCount + '문제를 맞혔어요.';
      resScore.textContent = state.score + '점';
      resCorrect.textContent = state.correctCount + ' / ' + total;
      resMaxCombo.textContent = state.maxCombo + ' 콤보';
    }

    reviewList.innerHTML = '';
    state.history.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'cs-review-item';

      var badge = document.createElement('span');
      badge.className = 'cs-review-badge ' + (item.solved ? 'ok' : 'skip');
      badge.textContent = item.solved ? '정답' : '복습';

      var wordSpan = document.createElement('span');
      wordSpan.className = 'cs-review-word';
      wordSpan.textContent = item.word;

      var factSpan = document.createElement('span');
      factSpan.textContent = '— ' + item.fact;

      li.appendChild(badge);
      li.appendChild(wordSpan);
      li.appendChild(factSpan);
      reviewList.appendChild(li);
    });

    playTone([523, 659, 784, 1046], 0.25);
  }

  function setMode(mode) {
    state.mode = mode;
    var isTeam = mode === 'team';

    btnModeSolo.classList.toggle('active', !isTeam);
    btnModeTeam.classList.toggle('active', isTeam);

    teamBoard.hidden = !isTeam;
    teamControls.hidden = !isTeam;
    answerForm.hidden = isTeam;
    soloActions.hidden = isTeam;

    pillSoloScore.hidden = isTeam;
    pillCombo.hidden = isTeam;
    pillBest.hidden = isTeam;

    startNewSet();
  }

  // Event Listeners
  btnModeSolo.addEventListener('click', function () {
    setMode('solo');
  });

  btnModeTeam.addEventListener('click', function () {
    setMode('team');
  });

  selCategory.addEventListener('change', function () {
    state.category = selCategory.value;
    startNewSet();
  });

  btnSound.addEventListener('click', function () {
    soundEnabled = !soundEnabled;
    btnSound.textContent = soundEnabled ? '🔊' : '🔇';
  });

  btnRestart.addEventListener('click', startNewSet);
  btnPlayAgain.addEventListener('click', startNewSet);

  answerForm.addEventListener('submit', handleSoloSubmit);
  btnHintMeaning.addEventListener('click', revealMeaningHint);
  btnHintLetter.addEventListener('click', revealOneLetter);
  btnSkip.addEventListener('click', handleSkip);
  btnNextSolo.addEventListener('click', nextQuestion);

  btnTeamHint.addEventListener('click', revealMeaningHint);
  btnTeamLetter.addEventListener('click', revealOneLetter);
  btnTeamReveal.addEventListener('click', handleSkip);
  btnTeamNext.addEventListener('click', nextQuestion);
  btnAwardBlue.addEventListener('click', function () {
    handleTeamAward('blue');
  });
  btnAwardWhite.addEventListener('click', function () {
    handleTeamAward('white');
  });

  // Init
  startNewSet();
})();
