/* 바둑돌 메모리 — 바둑스쿨 Fun */
(function () {
  'use strict';

  var SYMBOLS = ['⚫', '⚪', '🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];
  var elGrid = document.getElementById('grid');
  var elMoves = document.getElementById('moves');
  var elPairs = document.getElementById('pairs');
  var elTime = document.getElementById('time');
  var elMsg = document.getElementById('msg');

  var first = null, lock = false, moves = 0, matched = 0, total = 8;
  var timer = null, seconds = 0;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function setMsg(t) { elMsg.hidden = !t; elMsg.textContent = t || ''; }

  function startTimer() {
    stopTimer();
    seconds = 0;
    elTime.textContent = '0초';
    timer = setInterval(function () {
      seconds++;
      elTime.textContent = seconds + '초';
    }, 1000);
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function newGame() {
    stopTimer();
    startTimer();
    first = null; lock = false; moves = 0; matched = 0;
    elMoves.textContent = '0';
    elPairs.textContent = '0 / ' + total;
    setMsg('');

    var deck = [];
    for (var i = 0; i < total; i++) { deck.push(SYMBOLS[i]); deck.push(SYMBOLS[i]); }
    shuffle(deck);

    elGrid.innerHTML = '';
    deck.forEach(function (sym, idx) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'm-card';
      b.dataset.sym = sym;
      b.setAttribute('aria-label', '카드 ' + (idx + 1));
      b.innerHTML = '<span class="m-inner"><span class="m-face m-back">?</span>' +
                    '<span class="m-face m-front">' + sym + '</span></span>';
      b.addEventListener('click', function () { flip(b); });
      elGrid.appendChild(b);
    });
  }

  function flip(card) {
    if (lock || card.classList.contains('done') || card.classList.contains('flipped')) return;

    card.classList.add('flipped');

    if (!first) { first = card; return; }

    moves++;
    elMoves.textContent = moves;

    if (first.dataset.sym === card.dataset.sym) {
      var a = first, b = card;
      setTimeout(function () {
        a.classList.add('done'); b.classList.add('done');
        matched++;
        elPairs.textContent = matched + ' / ' + total;
        if (matched === total) {
          stopTimer();
          setMsg('완료! ' + moves + '번 시도 · ' + seconds + '초');
        }
      }, 260);
      first = null;
      return;
    }

    lock = true;
    var x = first, y = card;
    setTimeout(function () {
      x.classList.remove('flipped');
      y.classList.remove('flipped');
      first = null;
      lock = false;
    }, 700);
  }

  document.getElementById('btnNew').addEventListener('click', newGame);

  var sizes = [{ t: 8, label: '4×4 (16장)' }, { t: 6, label: '4×3 (12장)' }, { t: 4, label: '3×4 (8장)' }];
  var si = 0;
  document.getElementById('btnSize').addEventListener('click', function (e) {
    si = (si + 1) % sizes.length;
    total = sizes[si].t;
    e.currentTarget.textContent = sizes[si].label;
    elGrid.style.gridTemplateRows = total === 6 ? 'repeat(3,1fr)' : total === 4 ? 'repeat(2,1fr)' : 'repeat(4,1fr)';
    newGame();
  });

  window.addEventListener('beforeunload', stopTimer);
  newGame();

  /* AUTO_TEST: ?auto=1 이면 두 장을 뒤집고 상태를 title에 남긴다 */
  if (/[?&]auto=1/.test(location.search)) {
    setTimeout(function () {
      var cards = Array.prototype.slice.call(elGrid.children);
      cards[0].click();
      cards[1].click();
      setTimeout(function () {
        document.title = 'T|moves=' + moves + '|matched=' + matched + '|flipped=' +
          document.querySelectorAll('.m-card.flipped').length;
      }, 1200);
    }, 300);
  }
})();
