/**
 * 다층 종이 극장 (Paper Theater) — 우공이산 샘플 컨트롤러
 */
(function () {
  'use strict';

  var ACTS = [
    {
      kicker: '제1막 · 거대한 벽',
      headline: '집 앞을 가로막은 두 개의 큰 산',
      body: '옛날 중국에 아흔 살이 된 ‘우공’ 할아버지가 살았어요. 집 바로 앞에 태행산과 왕옥산이라는 너무 큰 산 두 개가 가로막고 있어서, 어디를 가든 멀리 돌아가야만 했지요. 우공은 가족들과 함께 삽을 들고 산을 옮기기로 결심했답니다!'
    },
    {
      kicker: '제2막 · 매일 한 삽씩',
      headline: '포기하지 않고 꾸준히 흙을 나르다',
      body: '이웃 사람이 “아흔 살에 어떻게 그 큰 산을 옮기나요?” 하고 웃었지만, 우공은 말했어요. “내가 못 끝내면 자식이, 자식이 못 끝내면 손자가 계속할 걸세. 산은 더 커지지 않으니 언젠가는 반드시 평지가 될 걸세!”'
    },
    {
      kicker: '제3막 · 하늘도 감동한 끈기',
      headline: '작은 노력이 모여 큰 산을 움직이다',
      body: '우공의 지치지 않는 정성에 하늘의 신마저 크게 감동해, 결국 산을 다른 곳으로 옮겨 주었어요. 아무리 크고 어려워 보이는 일도 포기하지 않고 꾸준히 노력하면 반드시 이루어 낸다는 멋진 교훈이 담겨 있답니다!'
    }
  ];

  var paperStage = document.getElementById('paperStage');
  var layers = document.querySelectorAll('.pt-layer[data-depth]');
  var layerMountain = document.getElementById('layerMountain');
  var paperSun = document.getElementById('paperSun');
  var ugongChar = document.getElementById('ugongChar');

  var actPill = document.getElementById('actPill');
  var stageKicker = document.getElementById('stageKicker');
  var stageHeadline = document.getElementById('stageHeadline');
  var storyBody = document.getElementById('storyBody');

  var shovelBox = document.getElementById('shovelBox');
  var btnShovel = document.getElementById('btnShovel');
  var shovelCountEl = document.getElementById('shovelCount');
  var shovelHint = document.getElementById('shovelHint');

  var studyBox = document.getElementById('studyBox');
  var quizOpts = document.querySelectorAll('.quiz-opt');
  var quizResult = document.getElementById('quizResult');

  var btnPrev = document.getElementById('btnPrev');
  var btnNext = document.getElementById('btnNext');
  var dots = document.querySelectorAll('#actDots .pt-dot');

  var currentAct = 0;
  var shovels = 0;

  function applyMountainProgress() {
    var dropY = currentAct === 2 ? 95 : shovels * 28;
    layerMountain.style.transform = 'translateY(' + dropY + 'px)';
    if (paperSun) {
      var sunLift = currentAct === 2 ? -24 : -(shovels * 7);
      paperSun.style.transform = 'translateY(' + sunLift + 'px) scale(' + (1 + shovels * 0.04) + ')';
    }
  }

  function renderAct() {
    var act = ACTS[currentAct];
    actPill.textContent = '제' + (currentAct + 1) + '막 / ' + ACTS.length + '막';
    stageKicker.textContent = act.kicker;
    stageHeadline.textContent = act.headline;
    storyBody.textContent = act.body;

    shovelBox.hidden = currentAct !== 1;
    studyBox.hidden = currentAct !== 2;

    btnPrev.disabled = currentAct === 0;
    btnNext.disabled = currentAct === ACTS.length - 1;
    btnNext.textContent = currentAct === ACTS.length - 1 ? '이야기 끝 🎉' : '다음 장면 ▶';

    dots.forEach(function (dot, idx) {
      dot.classList.toggle('active', idx === currentAct);
    });

    applyMountainProgress();
  }

  // 2.5D Mouse / Touch Parallax
  function updateParallax(clientX, clientY) {
    var rect = paperStage.getBoundingClientRect();
    var nx = (clientX - rect.left) / rect.width - 0.5;
    var ny = (clientY - rect.top) / rect.height - 0.5;

    layers.forEach(function (layer) {
      if (layer === layerMountain) return; // mountain uses vertical shovel drop
      var depth = parseFloat(layer.getAttribute('data-depth') || '0.3');
      var tx = (-nx * 24 * depth).toFixed(1);
      var ty = (-ny * 14 * depth).toFixed(1);
      layer.style.transform = 'translate3d(' + tx + 'px, ' + ty + 'px, 0)';
    });
  }

  paperStage.addEventListener('mousemove', function (e) {
    updateParallax(e.clientX, e.clientY);
  });

  paperStage.addEventListener('mouseleave', function () {
    layers.forEach(function (layer) {
      if (layer === layerMountain) return;
      layer.style.transform = 'translate3d(0, 0, 0)';
    });
  });

  // Shovel interaction in Act 2
  btnShovel.addEventListener('click', function () {
    if (shovels >= 3) return;
    shovels += 1;
    shovelCountEl.textContent = String(shovels);

    ugongChar.classList.remove('digging');
    void ugongChar.offsetWidth;
    ugongChar.classList.add('digging');

    applyMountainProgress();

    if (shovels === 1) {
      shovelHint.textContent = '좋아요! 큰 산이 조금 낮아졌어요! (2번 더!)';
    } else if (shovels === 2) {
      shovelHint.textContent = '우와! 산 너머로 햇살이 보이기 시작했어요! (1번 더!)';
    } else {
      btnShovel.disabled = true;
      btnShovel.textContent = '✅ 산을 옮겼어요! (3 / 3)';
      shovelHint.textContent = '대단해요! 우공의 끈기로 길이 환하게 열렸습니다!';
    }
  });

  // Mini quiz in Act 3
  quizOpts.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var ok = btn.getAttribute('data-ok') === 'true';
      quizOpts.forEach(function (b) {
        b.classList.remove('correct', 'wrong');
      });
      btn.classList.add(ok ? 'correct' : 'wrong');
      quizResult.hidden = false;
      quizResult.textContent = ok
        ? '🎉 정답입니다! 어렵더라도 포기하지 않고 꾸준히 노력하는 마음이 바로 우공이산이에요.'
        : '다시 한 번 생각해 볼까요? 우공 할아버지가 산을 옮긴 비결을 떠올려 보세요!';
    });
  });

  btnPrev.addEventListener('click', function () {
    if (currentAct > 0) {
      currentAct -= 1;
      renderAct();
    }
  });

  btnNext.addEventListener('click', function () {
    if (currentAct < ACTS.length - 1) {
      currentAct += 1;
      renderAct();
    }
  });

  renderAct();
})();
