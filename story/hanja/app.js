/**
 * 움직이는 바둑 한자 (키네틱 타이포 + 바둑돌 모션 그래픽)
 */
(function () {
  'use strict';

  var ITEMS = [
    {
      kanji: '圍',
      main: '圍 · 에워쌀 위',
      line1: '돌로 집을 둘러싸고',
      line2: '상대의 길을 에워싸는 지혜',
      words: ['바둑 위(圍)', '포위(包圍)', '위기(圍棋)'],
      desc: '바둑의 한자 이름 ‘위기(圍棋)’의 첫 글자인 圍(에워쌀 위)는 사방을 빙 둘러싼다는 뜻을 가지고 있어요. 내 돌을 연결해 집을 에워싸고, 상대 돌의 숨구멍을 에워싸는 바둑의 핵심 원리가 그대로 담겨 있습니다.',
      quizQ: '💡 확인 퀴즈: 바둑을 뜻하는 한자어 ‘위기(圍棋)’에서 ‘圍’의 뜻은 무엇일까요?',
      options: [
        { text: '빠르게 도망친다', ok: false },
        { text: '사방을 빙 둘러싼다', ok: true },
        { text: '돌을 높이 쌓는다', ok: false }
      ],
      okMsg: '🎉 정답입니다! 돌로 집과 상대를 에워싸는 뜻에서 바둑을 ‘위기(圍棋)’라고 불러요.'
    },
    {
      kanji: '手',
      main: '手 · 손 수',
      line1: '단 한 번의 선택이',
      line2: '바둑판 전체의 흐름을 바꾼다',
      words: ['한 수(一手)', '묘수(妙手)', '자충수(自充手)'],
      desc: '바둑에서는 돌을 한 번 놓는 것을 ‘한 수(一手)’라고 불러요. 손 수(手)는 단순히 손을 뜻하는 것을 넘어, 신중한 생각 끝에 두는 결정적인 방법과 실력을 의미합니다.',
      quizQ: '💡 확인 퀴즈: 판의 흐름을 단숨에 뒤집는 아주 기막힌 한 수를 무엇이라 할까요?',
      options: [
        { text: '묘수 (妙手)', ok: true },
        { text: '악수 (惡手)', ok: false },
        { text: '자충수 (自充手)', ok: false }
      ],
      okMsg: '🎉 정답입니다! 오묘하고 뛰어난 한 수를 ‘묘수(妙手)’라고 부릅니다.'
    },
    {
      kanji: '道',
      main: '道 · 길 도',
      line1: '이기고 지는 승패를 넘어',
      line2: '예의와 생각을 키우며 걷는 길',
      words: ['기도(棋道)', '도리(道理)', '인성(人性)'],
      desc: '길 도(道)는 사람이 마땅히 걸어가야 할 바른 길과 예절을 뜻합니다. 바둑은 ‘기도(棋道)’라 불리며, 대국 전후의 바른 인사와 상대를 존중하는 마음을 함께 배우는 인성 공부의 길이에요.',
      quizQ: '💡 확인 퀴즈: 바둑을 통해 예절과 바른 마음을 배우는 ‘바둑의 길’을 뜻하는 말은?',
      options: [
        { text: '포석 (布石)', ok: false },
        { text: '공배 (空排)', ok: false },
        { text: '기도 (棋道)', ok: true }
      ],
      okMsg: '🎉 정답입니다! 바둑으로 바른 마음과 예의를 익히는 길을 ‘기도(棋道)’라고 해요.'
    }
  ];

  var mgStage = document.getElementById('mgStage');
  var mgCountPill = document.getElementById('mgCountPill');
  var kanjiHero = document.getElementById('kanjiHero');
  var kt1 = document.getElementById('kt1');
  var kt2 = document.getElementById('kt2');
  var ktMain = document.getElementById('ktMain');
  var ktWords = document.getElementById('ktWords');
  var mgDesc = document.getElementById('mgDesc');
  var mgQuizQ = document.getElementById('mgQuizQ');
  var mgQuizOpts = document.getElementById('mgQuizOpts');
  var mgQuizRes = document.getElementById('mgQuizRes');
  var btnReplayMotion = document.getElementById('btnReplayMotion');
  var tabs = document.querySelectorAll('.mg-tab');
  var graphics = [
    document.getElementById('gfx0'),
    document.getElementById('gfx1'),
    document.getElementById('gfx2')
  ];

  var currentIdx = 0;

  function triggerMotion() {
    mgStage.classList.remove('playing');
    graphics.forEach(function (g, i) {
      g.classList.remove('active');
      if (i === currentIdx) {
        void g.offsetWidth;
        g.classList.add('active');
      }
    });
    void mgStage.offsetWidth;
    mgStage.classList.add('playing');
  }

  function renderItem(idx) {
    currentIdx = idx;
    var item = ITEMS[idx];

    mgCountPill.textContent = (idx + 1) + ' / ' + ITEMS.length + ' 한자';
    kanjiHero.textContent = item.kanji;
    kt1.textContent = item.line1;
    kt2.textContent = item.line2;
    ktMain.textContent = item.main;
    mgDesc.textContent = item.desc;
    mgQuizQ.textContent = item.quizQ;
    mgQuizRes.hidden = true;

    ktWords.innerHTML = '';
    item.words.forEach(function (w) {
      var span = document.createElement('span');
      span.className = 'kw-chip';
      span.textContent = w;
      ktWords.appendChild(span);
    });

    mgQuizOpts.innerHTML = '';
    item.options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mg-quiz-opt';
      btn.textContent = opt.text;
      btn.addEventListener('click', function () {
        mgQuizOpts.querySelectorAll('.mg-quiz-opt').forEach(function (b) {
          b.classList.remove('correct', 'wrong');
        });
        btn.classList.add(opt.ok ? 'correct' : 'wrong');
        mgQuizRes.hidden = false;
        mgQuizRes.textContent = opt.ok ? item.okMsg : '다시 한 번 위의 모션 그래픽을 살펴볼까요?';
      });
      mgQuizOpts.appendChild(btn);
    });

    tabs.forEach(function (t, i) {
      t.classList.toggle('active', i === idx);
    });

    triggerMotion();
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var idx = parseInt(tab.getAttribute('data-idx') || '0', 10);
      renderItem(idx);
    });
  });

  btnReplayMotion.addEventListener('click', triggerMotion);

  renderItem(0);
})();
